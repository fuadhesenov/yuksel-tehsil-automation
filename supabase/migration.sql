-- Supabase Migration: Config + Paused Conversations
-- Bu SQL-i Supabase Dashboard > SQL Editor-da çalıştırın
-- ÖNEMLİ: Migration artıq çalıştırılıbsa, yalnız paused_conversations hissəsini çalıştırın

-- ═══════════════════════════════════════════
-- 1) CONFIG TABLOSU (briefData + systemPrompt saxlayır)
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_config_updated_at ON config (updated_at DESC);

ALTER TABLE config ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'config' AND policyname = 'Service role full access') THEN
        CREATE POLICY "Service role full access" ON config FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- İlk konfiqurasiya
INSERT INTO config (key, value) VALUES 
    ('systemPrompt', '"Sən Yüksel Təhsil Mərkəzinin peşəkar AI köməkçisisən."'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ═══════════════════════════════════════════
-- 2) PAUSED_CONVERSATIONS TABLOSU
-- ManyChat 30 dəq avtomatik pause verir, bu tablo əlavə idarəetmə üçündür
-- ═══════════════════════════════════════════
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
