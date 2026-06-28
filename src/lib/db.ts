import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { kv } from '@vercel/kv';
import type { ResumeRecord, OptimizeStatus, KeywordMatch } from '@/types';

// Vercel 鐢?/tmp锛屾湰鍦扮敤 data/
const DB_DIR = process.env.VERCEL ? '/tmp/data' : path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'resumes.db');

// 妫€娴?KV 鏄惁鍙敤
const useKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

let db: Database.Database;

function initDb(): Database.Database {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  const database = new Database(DB_PATH);
  database.pragma('journal_mode = WAL');
  database.exec(`
    CREATE TABLE IF NOT EXISTS resumes (
      id TEXT PRIMARY KEY, user_id TEXT,
      original_text TEXT NOT NULL, optimized_text TEXT,
      job_description TEXT, target_position TEXT,
      keyword_match TEXT, tier TEXT DEFAULT 'single',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT, resume_id TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '鍖垮悕鐢ㄦ埛', rating INTEGER NOT NULL DEFAULT 5,
      content TEXT NOT NULL, approved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL, name TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY, user_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS referrals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      share_token TEXT NOT NULL UNIQUE,
      referrer_resume_id TEXT NOT NULL,
      claimer_resume_id TEXT,
      claimer_ip TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      claimed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_resumes_user ON resumes(user_id);
  `);
  return database;
}
db = initDb();
function getDb(): Database.Database { return db; }

// ====== Resume ======

export function createResume(originalText: string, jobDescription?: string, targetPosition?: string, tier?: string): ResumeRecord {
  const id = uuidv4();
  getDb().prepare(`INSERT INTO resumes(id,original_text,job_description,target_position,tier,status) VALUES(?,?,?,?,?,'pending')`)
    .run(id, originalText, jobDescription||null, targetPosition||null, tier||'single');
  return getResume(id)!;
}
export function getResume(id: string): ResumeRecord | null {
  return (getDb().prepare('SELECT * FROM resumes WHERE id=?').get(id) as ResumeRecord) ?? null;
}
export function updateOptimized(id: string, optimizedText: string, jobDescription?: string, targetPosition?: string, keywordMatch?: KeywordMatch): void {
  getDb().prepare(`UPDATE resumes SET optimized_text=?,job_description=?,target_position=?,keyword_match=?,status='pending_payment',updated_at=datetime('now') WHERE id=?`)
    .run(optimizedText, jobDescription??null, targetPosition??null, keywordMatch?JSON.stringify(keywordMatch):null, id);
}
export function updateStatus(id: string, status: OptimizeStatus): void {
  getDb().prepare("UPDATE resumes SET status=?,updated_at=datetime('now') WHERE id=?").run(status, id);
}
export function confirmPayment(id: string): void { updateStatus(id, 'paid'); }
export function expireOrder(id: string): boolean {
  return getDb().prepare("UPDATE resumes SET status='expired',updated_at=datetime('now') WHERE id=? AND status='pending_payment'").run(id).changes > 0;
}
export function expireOldPendingPayments(): number {
  return getDb().prepare("UPDATE resumes SET status='expired',updated_at=datetime('now') WHERE status='pending_payment' AND created_at<datetime('now','-24 hours')").run().changes;
}
export function listPendingPayments(): ResumeRecord[] {
  return getDb().prepare("SELECT * FROM resumes WHERE status='pending_payment' AND created_at>datetime('now','-24 hours') ORDER BY created_at DESC LIMIT 50").all() as ResumeRecord[];
}
export function getKeywordMatch(record: ResumeRecord): KeywordMatch | undefined {
  if (!record.keyword_match) return undefined;
  try { return JSON.parse(record.keyword_match); } catch { return undefined; }
}

// ====== Users (SQLite + KV 鍙屽啓) ======

export interface User { id:string; email:string; password_hash:string; name:string; created_at:string; }
export interface Session { token:string; user_id:string; created_at:string; }

export function createUser(email: string, passwordHash: string, name: string): User {
  const id = uuidv4();
  const normalizedEmail = email.toLowerCase().trim();
  const user: User = { id, email: normalizedEmail, password_hash: passwordHash, name: name.slice(0,50), created_at: new Date().toISOString().replace('T',' ').slice(0,19) };
  // SQLite锛堜富璇伙級
  getDb().prepare('INSERT INTO users(id,email,password_hash,name) VALUES(?,?,?,?)')
    .run(user.id, user.email, user.password_hash, user.name);
  // KV锛堟寔涔呭悗澶囷級
  if (useKV) { kv.set(`user:${id}`, user); kv.set(`user_email:${normalizedEmail}`, id); }
  return user;
}

export function getUserByEmail(email: string): User | null {
  const normalizedEmail = email.toLowerCase().trim();
  // 鍏堟煡 SQLite
  const sqliteUser = (getDb().prepare('SELECT * FROM users WHERE email=?').get(normalizedEmail) as User) ?? null;
  if (sqliteUser) return sqliteUser;
  // SQLite 娌℃湁 + KV 鍙敤 鈫?寮傛鎭㈠锛堜粎鐧诲綍鏃惰Е鍙戯紝鐧诲畬灏辨湁浜嗭級
  return null;
}

/** KV 鎭㈠鐢ㄦ埛鍒?SQLite锛堢櫥褰曟椂璋冪敤锛?*/
export async function restoreUserFromKV(email: string): Promise<User | null> {
  if (!useKV) return null;
  try {
    const id = await kv.get<string>(`user_email:${email.toLowerCase().trim()}`);
    if (!id) return null;
    const user = await kv.get<User>(`user:${id}`);
    if (!user) return null;
    // 鎭㈠鍒?SQLite
    getDb().prepare('INSERT OR IGNORE INTO users(id,email,password_hash,name,created_at) VALUES(?,?,?,?,?)')
      .run(user.id, user.email, user.password_hash, user.name, user.created_at);
    return user;
  } catch { return null; }
}

export function getUserById(id: string): User | null {
  return (getDb().prepare('SELECT * FROM users WHERE id=?').get(id) as User) ?? null;
}

export function createSession(userId: string, token: string): void {
  getDb().prepare('INSERT INTO sessions(token,user_id) VALUES(?,?)').run(token, userId);
  if (useKV) {
    const session: Session = { token, user_id: userId, created_at: new Date().toISOString().replace('T',' ').slice(0,19) };
    kv.set(`session:${token}`, session, { ex: 7 * 86400 });
  }
}

export function getSessionByToken(token: string): Session | null {
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE created_at<datetime('now','-7 days')").run();
  return (db.prepare('SELECT * FROM sessions WHERE token=?').get(token) as Session) ?? null;
}
export function getResumesByUserId(userId: string): ResumeRecord[] {
  return getDb().prepare('SELECT * FROM resumes WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(userId) as ResumeRecord[];
}
export function setResumeUserId(resumeId: string, userId: string): void {
  getDb().prepare('UPDATE resumes SET user_id=? WHERE id=?').run(userId, resumeId);
}

// ====== Feedback ======

export interface Feedback { id:number; resume_id:string; name:string; rating:number; content:string; approved:number; created_at:string; }
export function addFeedback(resumeId: string, name: string, rating: number, content: string): void {
  getDb().prepare('INSERT INTO feedback(resume_id,name,rating,content,approved) VALUES(?,?,?,?,1)')
    .run(resumeId, name.slice(0,20), Math.min(5,Math.max(1,rating)), content.slice(0,500));
}
export function getApprovedFeedback(): Feedback[] {
  return getDb().prepare('SELECT * FROM feedback WHERE approved=1 ORDER BY created_at DESC LIMIT 10').all() as Feedback[];
}

// ====== 鎺ㄥ箍瑁傚彉 ======
export function createShareToken(resumeId: string): string {
  const token = Math.random().toString(36).slice(2, 10);
  getDb().prepare("INSERT OR IGNORE INTO referrals (share_token, referrer_resume_id) VALUES (?,?)").run(token, resumeId);
  return token;
}
export function claimFreeOptimization(token: string, claimerResumeId: string): boolean {
  const row = getDb().prepare("SELECT * FROM referrals WHERE share_token=? AND status='active'").get(token) as any;
  if (!row) return false;
  getDb().prepare("UPDATE referrals SET status='claimed',claimer_resume_id=?,claimed_at=datetime('now') WHERE id=?").run(claimerResumeId, row.id);
  return true;
}
