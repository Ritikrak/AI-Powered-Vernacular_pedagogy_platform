# LokShiksha - Vernacular Pedagogy Platform

LokShiksha is an MVP classroom workflow for teachers who teach in Hindi and students who learn in Santhali, Mundari, Ho, or Kurukh.

## Flow implemented

1. Teacher uploads a PDF, TXT, or Markdown lesson.
2. FastAPI extracts text with PyMuPDF for PDFs and UTF-8 decoding for text files.
3. The lesson is stored with SQLAlchemy in SQLite by default, or PostgreSQL when `DATABASE_URL` is changed.
4. The translation endpoint returns all four language targets through an offline demo dictionary. Replace `backend/app/services/translator.py` with an AI translation provider when credentials are available.
5. The teacher can start a live classroom. Browser speech recognition listens in Hindi, the backend translates each transcript, and WebSocket messages are broadcast to all students in the room.

## Project structure

```text
backend/
	app/
		services/       extraction, translation, and token services
		config.py       environment settings
		database.py     SQLAlchemy engine and session dependency
		models.py       Lesson and Translation tables
		routes.py       REST and WebSocket API
		schemas.py      Pydantic request/response contracts
	main.py           FastAPI application entry point
frontend/
	src/App.tsx       teacher workspace and live room
	src/api.ts        REST/WebSocket client
	src/styles.css    responsive visual system
```

## Run locally

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn main:app --reload --port 8000
```

The API is available at `http://localhost:8000`; interactive docs are at `http://localhost:8000/docs`.

### Frontend (React + Vite)

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`. The frontend uses React, Vite, React Router, Axios, Context API, React Hook Form, Recharts, Lucide React, Tailwind-compatible design tokens, WebSocket classroom messaging, and a service worker for offline caching. The dashboard includes login/signup role selection, responsive teacher/student workspaces, lesson search and filters, progress analytics, translation controls, Classes 5 and 6 activity, and browser speech-to-text/text-to-speech classroom tools.

The frontend works in offline mode with local lesson data when the backend is unavailable. To enable persistence, PDF extraction, JWT demo tokens, translations, and classroom WebSockets, start the FastAPI backend on `http://localhost:8000`.

### OpenAI translation and TTS

The backend prefers OpenAI for `/api/translate/speech`, `/api/translate/all`, and live classroom WebSocket speech messages. Set the key locally in `backend/.env`; never commit it:

```env
OPENAI_API_KEY=your_rotated_key_here
OPENAI_TRANSLATION_MODEL=gpt-4o-mini
OPENAI_TTS_MODEL=gpt-4o-mini-tts
OPENAI_TTS_VOICE=alloy
```

Restart FastAPI after changing `.env`. OpenAI produces the translated text and MP3 audio; Google and the offline dictionary remain fallback providers. Rotate any API key pasted into chat or source control before using it.

### PostgreSQL

Change `DATABASE_URL` in `backend/.env` to a SQLAlchemy PostgreSQL URL, for example:

```text
postgresql+psycopg://postgres:postgres@localhost:5432/vernacular
```

For production, also replace the demo token endpoint and offline translator with your identity provider and translation/Whisper services. The WebSocket room protocol is already isolated in `app/routes.py` for that integration.