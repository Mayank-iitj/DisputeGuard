import { DatabaseSync } from 'node:sqlite';
import * as path from 'node:path';
import * as fs from 'node:fs';

export class AppDatabase {
  public db: DatabaseSync;

  constructor(dbPath: string = ':memory:') {
    if (dbPath !== ':memory:') {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    this.db = new DatabaseSync(dbPath);
    this.initPragmas();
    this.createTables();
  }

  private initPragmas() {
    this.db.exec('PRAGMA foreign_keys = ON;');
  }

  public createTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('buyer','seller','agent','supervisor','bot')),
        lang TEXT NOT NULL,
        avatar TEXT
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        image TEXT,
        amount_minor INTEGER NOT NULL,
        currency TEXT NOT NULL,
        status TEXT NOT NULL,
        delivered_at INTEGER,
        buyer_id TEXT NOT NULL REFERENCES users(id),
        seller_id TEXT NOT NULL REFERENCES users(id),
        category TEXT NOT NULL DEFAULT 'general'
      );

      CREATE TABLE IF NOT EXISTS disputes (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL UNIQUE REFERENCES orders(id),
        channel_id TEXT NOT NULL UNIQUE,
        reason TEXT NOT NULL,
        status TEXT NOT NULL,
        risk_score REAL NOT NULL DEFAULT 0,
        risk_band TEXT NOT NULL DEFAULT 'low',
        frozen INTEGER NOT NULL DEFAULT 0,
        assigned_agent_id TEXT REFERENCES users(id),
        negotiation_round INTEGER NOT NULL DEFAULT 0,
        policy_version TEXT NOT NULL,
        opened_at INTEGER NOT NULL,
        escalated_at INTEGER,
        resolved_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS escrow_accounts (
        dispute_id TEXT PRIMARY KEY REFERENCES disputes(id),
        state TEXT NOT NULL,
        amount_minor INTEGER NOT NULL,
        currency TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS escrow_ledger (
        id TEXT PRIMARY KEY,
        dispute_id TEXT NOT NULL REFERENCES disputes(id),
        type TEXT NOT NULL,
        from_state TEXT NOT NULL,
        to_state TEXT NOT NULL,
        amount_minor INTEGER NOT NULL DEFAULT 0,
        actor_id TEXT NOT NULL,
        reason_code TEXT NOT NULL,
        note TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS evidence (
        id TEXT PRIMARY KEY,
        dispute_id TEXT NOT NULL REFERENCES disputes(id),
        uploader_id TEXT NOT NULL REFERENCES users(id),
        status TEXT NOT NULL,
        files TEXT NOT NULL,
        assessment TEXT,
        integrity TEXT,
        captured_at INTEGER,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS proposals (
        id TEXT PRIMARY KEY,
        dispute_id TEXT NOT NULL REFERENCES disputes(id),
        round INTEGER NOT NULL,
        options TEXT NOT NULL,
        buyer_response TEXT,
        seller_response TEXT,
        status TEXT NOT NULL,
        policy_version TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS observed_messages (
        uid TEXT PRIMARY KEY,
        dispute_id TEXT NOT NULL REFERENCES disputes(id),
        sender_id TEXT NOT NULL,
        text TEXT NOT NULL,
        lang TEXT,
        ts INTEGER NOT NULL,
        analysis TEXT
      );

      CREATE TABLE IF NOT EXISTS translations (
        message_uid TEXT NOT NULL,
        target_lang TEXT NOT NULL,
        source_lang TEXT,
        text TEXT NOT NULL,
        tone_note TEXT,
        PRIMARY KEY (message_uid, target_lang)
      );

      CREATE TABLE IF NOT EXISTS risk_events (
        id TEXT PRIMARY KEY,
        dispute_id TEXT NOT NULL REFERENCES disputes(id),
        message_uid TEXT,
        type TEXT NOT NULL,
        confidence REAL NOT NULL,
        score_after REAL NOT NULL,
        fired_freeze INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS agent_actions (
        id TEXT PRIMARY KEY,
        dispute_id TEXT NOT NULL REFERENCES disputes(id),
        agent_id TEXT NOT NULL,
        action TEXT NOT NULL,
        payload TEXT NOT NULL,
        override INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS briefs (
        dispute_id TEXT PRIMARY KEY REFERENCES disputes(id),
        body TEXT NOT NULL,
        generated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS outbox (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dispute_id TEXT,
        channel_id TEXT NOT NULL,
        from_user TEXT NOT NULL,
        envelope TEXT NOT NULL,
        sent_at INTEGER,
        attempts INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS idempotency (
        key TEXT PRIMARY KEY,
        route TEXT NOT NULL,
        body_hash TEXT NOT NULL,
        response TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);
  }

  public clearAll() {
    this.db.exec(`
      DELETE FROM idempotency;
      DELETE FROM outbox;
      DELETE FROM briefs;
      DELETE FROM agent_actions;
      DELETE FROM risk_events;
      DELETE FROM translations;
      DELETE FROM observed_messages;
      DELETE FROM proposals;
      DELETE FROM evidence;
      DELETE FROM escrow_ledger;
      DELETE FROM escrow_accounts;
      DELETE FROM disputes;
      DELETE FROM orders;
      DELETE FROM users;
    `);
  }
}

// Global shared singleton
let defaultDb: AppDatabase | null = null;

export function getDatabase(): AppDatabase {
  if (!defaultDb) {
    const isTest = process.env.NODE_ENV === 'test';
    const dbPath = isTest
      ? ':memory:'
      : process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data', 'disputeguard.sqlite');
    defaultDb = new AppDatabase(dbPath);
  }
  return defaultDb;
}
