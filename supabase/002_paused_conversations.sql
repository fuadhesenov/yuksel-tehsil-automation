-- Migration 002: Paused Conversations tablosu
-- Tarix: 2026-02-14
-- Bu SQL-i Supabase Dashboard > SQL Editor-da çalıştırın

CREATE TABLE IF NOT EXISTS paused_conversations (
    subscriber_id VARCHAR PRIMARY KEY,
    paused_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ,
    reason VARCHAR DEFAULT 'manual_pause'
);

CREATE INDEX IF NOT EXISTS idx_paused_expires ON paused_conversations (expires_at);

ALTER TABLE paused_conversations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'paused_conversations' AND policyname = 'Service role full access') THEN
        CREATE POLICY "Service role full access" ON paused_conversations FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
