# RupeeRadar

AI-powered personal finance assistant that parses Indian bank statements and surfaces spending insights.

## Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.11, FastAPI, SQLAlchemy, SQLite / PostgreSQL |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| LLM | [Groq](https://groq.com/) (`llama-3.3-70b-versatile`) |
| Deploy | [Railway](https://railway.app/) (API) + [Vercel](https://vercel.com/) (Frontend) |

---

## Quick Start (Local)

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker & Docker Compose (optional)

### 1. Clone & configure environment

```bash
git clone https://github.com/Rahil-live/Rupee-Radar.git
cd Rupee-Radar
cp .env.example .env
# Edit .env — add your GROQ_API_KEY (optional, enables AI categorisation)
```

### 2. Docker Compose (recommended)

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Health check | http://localhost:8000/api/v1/health |

### 3. Manual (without Docker)

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
mkdir -p data
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Deployment

### Architecture
```
Vercel (React SPA)  ──VITE_API_URL──►  Railway (FastAPI + Docker)
                                                │
                                       Railway PostgreSQL Plugin
```

---

### Backend → Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select this repo, set **Root Directory** = `backend`
3. Add the **PostgreSQL** plugin (Railway auto-sets `DATABASE_URL`)
4. Set these environment variables:

| Variable | Value |
|----------|-------|
| `GROQ_API_KEY` | Your key from [console.groq.com](https://console.groq.com) |
| `CORS_ORIGINS` | `https://your-app.vercel.app` (add after Vercel deploy) |
| `SESSION_TTL_HOURS` | `72` |
| `MAX_UPLOAD_SIZE_MB` | `10` |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` |

5. Deploy — confirm `GET /api/v1/health` returns `{"status":"ok"}`
6. Copy your Railway public URL (e.g. `https://rupee-radar.up.railway.app`)

---

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → Import from GitHub
2. Select this repo, set **Root Directory** = `frontend`
3. Framework: **Vite** | Build: `npm run build` | Output: `dist`
4. Add environment variable:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your Railway API URL (no trailing slash) |

5. Deploy — your app is live at `https://your-app.vercel.app`
6. Go back to Railway and update `CORS_ORIGINS` with your Vercel URL

---

### Update docker-compose for local dev

The `docker-compose.yml` at the root is for local development only and uses SQLite.

---

## Supported Statement Formats

| Format | Detection |
|--------|-----------|
| HDFC CSV | `Narration` + `Withdrawal Amt.` headers |
| ICICI CSV | `Transaction Remarks` + `Withdrawal Amount (INR)` headers |
| Generic CSV | Auto-detects `Date`, `Description/Narration/Particulars`, `Debit`/`Credit` columns |
| Excel (.xlsx) | First sheet converted to CSV internally |

Supported date formats: `DD/MM/YY`, `DD/MM/YYYY`, `DD-MM-YYYY`, `YYYY-MM-DD`, `DD MMM YYYY`, `DD-MMM-YYYY`, `DD.MM.YYYY` and more.

Sample template: [`samples/sample-statement-template.csv`](samples/sample-statement-template.csv)

---

## Features

- Upload → parse → clean → categorise (rules + LLM fallback)
- Recurring payment detection (subscriptions, EMIs, rent)
- Dashboard: category breakdown, monthly trends, spending insights
- Manual category overrides with live metric refresh
- PDF / HTML report export
- Privacy: 72-hour TTL, delete endpoint, no persistent raw files

---

## Project Structure

```
rupee-radar/
├── backend/                  # FastAPI app
│   ├── app/
│   │   ├── api/routes/       # Upload, sessions, health
│   │   ├── parsers/          # HDFC, ICICI, generic, Excel
│   │   ├── pipeline/         # Cleaner, categoriser, recurring, metrics, insights
│   │   ├── services/         # LLM, analysis, report, session lifecycle
│   │   └── models/           # SQLAlchemy models + enums
│   ├── tests/                # 48 pytest tests
│   ├── Dockerfile
│   └── railway.toml
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── api/client.ts     # All API calls (reads VITE_API_URL)
│   │   ├── pages/            # HomePage, AnalysisPage
│   │   └── components/       # Charts, tables, upload, insights
│   ├── vercel.json
│   └── Dockerfile
├── samples/                  # Sample CSVs for testing
├── docker-compose.yml        # Local dev
└── .env.example
```

---

## Environment Variables Reference

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./data/rupee_radar.db` | SQLite (local) or PostgreSQL (production) |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed origins |
| `GROQ_API_KEY` | _(empty)_ | Groq API key — leave blank for rule-only mode |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Groq model name |
| `SESSION_TTL_HOURS` | `72` | Auto-expire session data after N hours |
| `MAX_UPLOAD_SIZE_MB` | `10` | Max file upload size |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend API base URL |

---

## License

MIT
