# TalkCraft AI — Fullstack English Conversational & Grammar Coach

A full-stack real-time conversational English coach built with **Next.js 14**, **FastAPI (Python)**, and **PostgreSQL**.
Features:
- **Speech-to-Speech Flow**: Speaks in a warm female voice and listens via voice recognition.
- **Deep Grammar & Sentence Framing Analysis**: Detects tense errors, prepositions, articles, and awkward phrasing.
- **Tamil Nuance Explanations (தமிழ் விளக்கம்)**: Instant bilingual reasoning so learners master rules rapidly.
- **Native Phrasing Comparison**: Compares awkward sentences into Casual Conversational and Workplace Professional styles.
- **PostgreSQL Persistence**: Saves conversation logs, accuracy scores, and a personal mistake review bank.

---

## 📁 Clean Project Structure

```
talkcraft_fullstack_ai/
├── docker-compose.yml        # Orchestrates PostgreSQL, FastAPI, and Next.js containers
├── .env.example              # Central environment template
├── README.md                 # Deployment & quickstart manual
├── database/
│   └── init.sql              # Auto-initialization schema and seed data
├── backend/
│   ├── Dockerfile            # Python 3.11 slim backend image
│   ├── .dockerignore
│   ├── .env.example
│   ├── requirements.txt      # FastAPI, SQLAlchemy, Asyncpg, Google GenAI
│   ├── main.py               # REST API & WebSocket endpoints
│   ├── database.py           # Async SQLAlchemy engine & session maker
│   ├── models.py             # PostgreSQL database entities
│   ├── schemas.py            # Pydantic request/response validation
│   └── gemini_service.py     # Google Gemini AI coaching & voice logic
└── frontend/
    ├── Dockerfile            # Multi-stage production Next.js image
    ├── .dockerignore
    ├── .env.example
    ├── package.json          # Next.js 14, React 18, Tailwind CSS, Lucide icons
    ├── next.config.js
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── postcss.config.js
    └── app/
        ├── layout.tsx        # App layout and viewport metadata
        ├── page.tsx          # Real-time interactive conversational UI
        └── globals.css       # Tailwind stylesheet
```

---

## 🚀 Running with Docker (Recommended)

### 1. Set your Gemini API Key
Copy `.env.example` to `.env` in the root folder:
```bash
cp .env.example .env
```
Open `.env` and set your `GEMINI_API_KEY`:
```env
GEMINI_API_KEY=your_actual_gemini_api_key
```

### 2. Build and Start All Services
Run a single command:
```bash
docker-compose up --build
```

### 3. Open in Browser
- **Frontend UI**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Backend API**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **PostgreSQL Database**: Port `5432` (`talkcraft_user` / `talkcraft_password`)

---

## 💻 Manual Local Development (Without Docker)

### 1. Start PostgreSQL
Make sure PostgreSQL is running locally on port `5432`, and execute `database/init.sql` to initialize the database tables.

### 2. Start the FastAPI Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
export GEMINI_API_KEY="your_api_key"
uvicorn main:app --reload --port 8000
```

### 3. Start the Next.js Frontend
```bash
cd frontend
npm install
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000).
