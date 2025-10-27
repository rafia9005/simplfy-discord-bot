import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const dataDir = join(__dirname, '../../data');
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

const dbPath = join(dataDir, 'chat.db');
const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS chats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  meta TEXT,
  created_at INTEGER NOT NULL
);
`);

export function saveChat(userId: string, role: 'user' | 'assistant', content: string, meta?: object) {
  const stmt = db.prepare('INSERT INTO chats (user_id, role, content, meta, created_at) VALUES (?, ?, ?, ?, ?)');
  stmt.run(userId, role, content, meta ? JSON.stringify(meta) : null, Date.now());
}

export function getChats(userId: string, limit = 10) {
  const stmt = db.prepare('SELECT * FROM chats WHERE user_id = ? ORDER BY created_at ASC LIMIT ?');
  return stmt.all(userId, limit);
}

export function clearChats(userId: string) {
  const stmt = db.prepare('DELETE FROM chats WHERE user_id = ?');
  stmt.run(userId);
}