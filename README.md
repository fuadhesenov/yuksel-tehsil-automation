# Yüksel Təhsil Mərkəzi - Instagram DM Automation

Instagram DM mesajlarını **ManyChat** və **OpenAI GPT-4** istifadə edərək avtomatik cavablayan sistem.

## Proje Strukturu

```
├── backend/              # Python/FastAPI API (Railway)
│   ├── main.py           # Əsas server faylı
│   ├── requirements.txt  # Python bağımlılıqları
│   ├── Procfile          # Railway start command
│   └── nixpacks.toml     # Railway build config
├── frontend/             # Next.js Admin Panel (Netlify)
│   ├── src/app/          # Səhifələr (Dashboard, Brief, Chat Test, Settings)
│   ├── src/components/   # UI komponentləri (shadcn/ui)
│   └── src/lib/          # API client, utils
├── supabase/             # Supabase migration SQL
├── docs/                 # Proje dokumentasiyası
│   ├── progress.md       # İrəliləyiş qeydləri
│   └── decisions.md      # Qərar qeydləri
└── README.md
```

## Hızlı Başlangıç

### Backend (Python/FastAPI)

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env     # .env faylını doldurun
uvicorn main:app --reload --port 8000
```

### Frontend (Next.js)

```bash
cd frontend
npm install
cp .env.example .env.local  # API URL-ni ayarlayın
npm run dev                  # http://localhost:3000
```

## Environment Variables

### Backend (`backend/.env`)
| Dəyişən | Təsvir |
|---------|--------|
| `OPENAI_API_KEY` | OpenAI API açarı |
| `MANYCHAT_API_KEY` | ManyChat API açarı (Pro hesab) |
| `MANYCHAT_FLOW_NS` | ManyChat "Send AI Response" flow ID |
| `DATABASE_URL` | Supabase PostgreSQL bağlantı URL |
| `PORT` | Server portu (default: 8000) |

### Frontend (`frontend/.env.local`)
| Dəyişən | Təsvir |
|---------|--------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (Railway URL) |

## API Endpoints

| Method | Endpoint | Təsvir |
|--------|----------|--------|
| GET | `/` | Server statusu |
| GET | `/health` | Health check |
| POST | `/webhook` | ManyChat webhook (DM alır) |
| POST | `/admin/savePrompt` | Brief-dən sistem promptu yarat |
| POST | `/admin/testPrompt` | AI cavabını test et |
| GET | `/admin/getConfig` | Mövcud konfiqurasiyanı al |

## Deploy

### Backend → Railway
1. Railway-də yeni proje yaradın
2. GitHub reposunu bağlayın (`backend` qovluğu root dir olaraq)
3. Environment variables əlavə edin
4. Deploy edin → URL-ni alın

### Frontend → Netlify
1. Netlify-da yeni sayt yaradın
2. GitHub reposunu bağlayın
3. Base directory: `frontend`
4. Build command: `npm run build`
5. Environment variables əlavə edin (`NEXT_PUBLIC_API_URL`)

### Supabase
1. Supabase-də yeni proje yaradın
2. SQL Editor-da `supabase/migration.sql` çalıştırın
3. Settings > Database > Connection string-i alın
4. Backend-ə `DATABASE_URL` olaraq əlavə edin

## ManyChat Konfiqurasiyası

1. ManyChat-da Instagram hesabını bağlayın
2. Settings > API → API key alın
3. Settings > Fields → `AI_Response` (Text) field yaradın
4. Yeni Flow yaradın: "Send AI Response" → mesaj: `{{AI_Response}}`
5. Default Reply flow-da External Request əlavə edin:
   - URL: `https://your-backend.up.railway.app/webhook`
   - Method: POST
   - Body: `{"id": "{{contact.id}}", "last_input_text": "{{last_text_input}}"}`
6. Flow-nu publish edin, flow_ns-i URL-dən kopyalayın

## Tələblər

- Python 3.11+
- Node.js 18+
- OpenAI API Key
- ManyChat Pro Hesab
- Railway hesabı (backend)
- Netlify hesabı (frontend)
- Supabase hesabı (database)

## Lisans

MIT
