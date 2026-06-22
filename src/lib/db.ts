import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { ResumeRecord, OptimizeStatus, KeywordMatch } from '@/types';

const DB_PATH = path.join(process.cwd(), 'data', 'resumes.db');

let db: Database.Database;

function initDb(): Database.Database {
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
  `);
  return database;
}

// 模块加载时即初始化，避免多请求竞争
db = initDb();

function getDb(): Database.Database {
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
