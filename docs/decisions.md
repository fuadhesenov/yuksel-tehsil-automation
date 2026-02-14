# Decisions Log

## Decision 1: Frontend Framework - Next.js (WowDash Template)
- **Decision:** WowDash Next.js + shadcn/ui template istifadə olunacaq
- **Reason:** User tələbi - ThemeForest-dən alınmış professional admin panel template
- **Alternatives:** Əvvəlki Vite + React (sadə) yanaşma
- **Consequences:** Daha professional UI, daha böyük bundle size, Next.js öyrənmə əyrisi

## Decision 2: Backend - FastAPI (Python)
- **Decision:** Mövcud sistemdəki kimi FastAPI/Python istifadə olunacaq
- **Reason:** Mövcud sistemin dəqiq kopyası - "testid tabanlı" = FastAPI tabanlı
- **Alternatives:** Node.js/Express (PDF-dəki plan)
- **Consequences:** Python ekosistemi, Railway deploy asan, OpenAI SDK dəstəyi

## Decision 3: Database - Supabase PostgreSQL
- **Decision:** Supabase PostgreSQL (psycopg2 ilə birbaşa bağlantı)
- **Reason:** Mövcud sistemdəki kimi, config saxlamaq üçün
- **Alternatives:** SQLite, Firebase
- **Consequences:** Hosted PostgreSQL, RLS mümkün, pulsuz tier mövcud

## Decision 4: Deploy Architecture
- **Decision:** Frontend → Netlify, Backend → Railway
- **Reason:** Mövcud sistemin dəqiq kopyası
- **Alternatives:** Vercel + Railway, ya da hamısı Railway-də
- **Consequences:** İki ayrı platform, CORS konfiqurasiyası lazım
