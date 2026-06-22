import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { ResumeRecord, OptimizeStatus, KeywordMatch } from '@/types';

// Vercel serverless 环境下只有 /tmp 可写
const DATA_DIR = process.env.VERCEL
  ? '/tmp/data'
  : path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'resumes.db');

let db: Database.Database | null = null;

function initDb(): Database.Database {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const database = new Database(DB_PATH);
  database.pragma('journal_mode = WAL');
  database.exec(`
    CREATE TABLE IF NOT EXISTS resumes (
      id TEXT PRIMARY KEY,
      original_text TEXT NOT NULL,
      optimized_text TEXT,
      job_description TEXT,
      target_position TEXT,
      keyword_match TEXT,
      tier TEXT DEFAULT 'single',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resume_id TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '匿名用户',
      rating INTEGER NOT NULL DEFAULT 5,
      content TEXT NOT NULL,
      approved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return database;
}

function getDb(): Database.Database {
  if (!db) {
    db = initDb();
  }
  return db;
}

// 创建新简历记录
export function createResume(originalText: string, jobDescription?: string, targetPosition?: string, tier?: string): ResumeRecord {
  const database = getDb();
  const id = uuidv4();
  const stmt = database.prepare(`
    INSERT INTO resumes (id, original_text, job_description, target_position, tier, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `);
  stmt.run(id, originalText, jobDescription || null, targetPosition || null, tier || 'single');
  return getResume(id)!;
}

// 获取单条记录
export function getResume(id: string): ResumeRecord | null {
  const database = getDb();
  const stmt = database.prepare('SELECT * FROM resumes WHERE id = ?');
  const row = stmt.get(id) as ResumeRecord | undefined;
  return row ?? null;
}

// 更新优化结果
export function updateOptimized(
  id: string,
  optimizedText: string,
  jobDescription?: string,
  targetPosition?: string,
  keywordMatch?: KeywordMatch
): void {
  const database = getDb();
  const stmt = database.prepare(`
    UPDATE resumes
    SET optimized_text = ?, job_description = ?, target_position = ?,
        keyword_match = ?, status = 'pending_payment', updated_at = datetime('now')
    WHERE id = ?
  `);
  stmt.run(
    optimizedText,
    jobDescription ?? null,
    targetPosition ?? null,
    keywordMatch ? JSON.stringify(keywordMatch) : null,
    id
  );
}

// 更新状态
export function updateStatus(id: string, status: OptimizeStatus): void {
  const database = getDb();
  const stmt = database.prepare(`
    UPDATE resumes SET status = ?, updated_at = datetime('now') WHERE id = ?
  `);
  stmt.run(status, id);
}

// 管理员确认收款
export function confirmPayment(id: string): void {
  const database = getDb();
  const stmt = database.prepare(`
    UPDATE resumes SET status = 'paid', updated_at = datetime('now') WHERE id = ?
  `);
  stmt.run(id);
}

// 标记订单为过期
export function expireOrder(id: string): boolean {
  const database = getDb();
  const stmt = database.prepare(`
    UPDATE resumes SET status = 'expired', updated_at = datetime('now')
    WHERE id = ? AND status = 'pending_payment'
  `);
  const result = stmt.run(id);
  return result.changes > 0;
}

// 自动过期（超过2小时的待支付订单）
export function expireOldPendingPayments(): number {
  const database = getDb();
  const stmt = database.prepare(`
    UPDATE resumes SET status = 'expired', updated_at = datetime('now')
    WHERE status = 'pending_payment' AND created_at < datetime('now', '-2 hours')
  `);
  const result = stmt.run();
  return result.changes;
}

// 查询待支付列表
export function listPendingPayments(): ResumeRecord[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT * FROM resumes
    WHERE status = 'pending_payment' AND created_at > datetime('now', '-2 hours')
    ORDER BY created_at DESC LIMIT 50
  `);
  return stmt.all() as ResumeRecord[];
}

// 清理24小时前的记录
export function cleanOldRecords(): number {
  const database = getDb();
  const stmt = database.prepare(`
    DELETE FROM resumes WHERE created_at < datetime('now', '-24 hours')
  `);
  const result = stmt.run();
  return result.changes;
}

// 从 DB 记录解析 keywordMatch
export function getKeywordMatch(record: ResumeRecord): KeywordMatch | undefined {
  if (!record.keyword_match) return undefined;
  try {
    return JSON.parse(record.keyword_match) as KeywordMatch;
  } catch {
    return undefined;
  }
}

// ========== 用户反馈 ==========

export interface Feedback {
  id: number;
  resume_id: string;
  name: string;
  rating: number;
  content: string;
  approved: number;
  created_at: string;
}

// 提交反馈
export function addFeedback(resumeId: string, name: string, rating: number, content: string): void {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO feedback (resume_id, name, rating, content, approved)
    VALUES (?, ?, ?, ?, 1)
  `);
  stmt.run(resumeId, name.slice(0, 20), Math.min(5, Math.max(1, rating)), content.slice(0, 500));
}

// 获取已审核通过的反馈
export function getApprovedFeedback(): Feedback[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT * FROM feedback WHERE approved = 1 ORDER BY created_at DESC LIMIT 10
  `);
  return stmt.all() as Feedback[];
}

// 管理员获取所有反馈（待审核）
export function getAllFeedback(): Feedback[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT * FROM feedback ORDER BY created_at DESC LIMIT 50
  `);
  return stmt.all() as Feedback[];
}

// 审核通过反馈
export function approveFeedback(id: number): void {
  const database = getDb();
  const stmt = database.prepare(`UPDATE feedback SET approved = 1 WHERE id = ?`);
  stmt.run(id);
}

// 删除反馈
export function deleteFeedback(id: number): void {
  const database = getDb();
  const stmt = database.prepare(`DELETE FROM feedback WHERE id = ?`);
  stmt.run(id);
}
