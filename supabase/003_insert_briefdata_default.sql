-- Migration 003: briefData boş default satır əlavə et
-- Tarix: 2026-02-14
-- Brief form doldurulduqda bu satır UPSERT ilə yenilənəcək

INSERT INTO config (key, value) VALUES 
    ('briefData', '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;
