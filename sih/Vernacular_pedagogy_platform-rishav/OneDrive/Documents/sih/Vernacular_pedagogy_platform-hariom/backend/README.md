# LokShiksha Multilingual AI Backend

Production-ready, secure, and scalable Node.js backend for the Vernacular Pedagogy Platform using Express.js, MongoDB (Mongoose), Socket.IO, and Google Gemini AI.

## Features

- **Multilingual Vernacular Engine**: Instant translation across regional tribal languages of Jharkhand:
  - **Santhali** (Ol Chiki script + Latin phonetic guide)
  - **Mundari** (Mundari Bani / Devanagari)
  - **Ho** (Warang Citi / Devanagari)
  - **Kurukh** (Tolong Siki / Devanagari)
  - **Hindi** & **English**
- **Google Gemini AI Integration**: Automated lesson simplification for primary classes (Class 3-6) and indigenous pedagogical translation.
- **Offline & Demo Resilience**: High-fidelity vernacular dictionary and in-memory mock store fallback ensures zero crashes even when offline or without external credentials.
- **Real-Time Classroom (Socket.IO)**:
  - Teacher broadcast in Hindi with simultaneous multilingual speech translation.
  - Language-targeted delivery to student subchannels based on each child's preferred dialect.
  - Student questions translated back to teacher in Hindi.
- **Speech-to-Text & Text-to-Speech**:
  - STT via Gemini multimodal audio and browser/classroom fallbacks.
  - TTS acoustic synthesis with regional phonetic transliteration.
- **Production Security**:
  - JWT authentication & Role-Based Access Control (`teacher`, `student`, `admin`).
  - Helmet security headers, CORS origin filtering, and Express rate limiting.
  - Centralized error handling via `ApiError`.

---

## Directory Structure

```text
backend/
├── .env.example              # Environment variables template
├── package.json              # Node.js dependencies
├── test/
│   └── api.test.js           # Automated end-to-end test suite
└── src/
    ├── config/
    │   ├── env.js            # Environment validation
    │   └── db.js             # Mongoose connection with resilient fallback
    ├── models/
    │   ├── User.js           # Users (Teachers/Students)
    │   ├── Lesson.js         # Lessons & extracted textbook content
    │   ├── Translation.js    # Multilingual cached translations
    │   ├── ClassroomSession.js# Live sessions & transcripts
    │   └── Language.js       # Regional language catalog
    ├── middleware/
    │   ├── auth.js           # JWT & RBAC authorization
    │   ├── upload.js         # Multer PDF/audio file upload
    │   ├── rateLimiter.js    # Rate limiting
    │   └── errorHandler.js   # Centralized error handler
    ├── services/
    │   ├── gemini.service.js      # Gemini AI client
    │   ├── translation.service.js # Multilingual translation engine
    │   ├── stt.service.js         # Speech-to-Text
    │   ├── tts.service.js         # Text-to-Speech
    │   └── classroom.service.js   # Classroom state manager
    ├── controllers/          # Request handlers
    ├── routes/               # Express REST routes
    ├── sockets/
    │   └── classroom.socket.js    # Real-time Socket.IO handlers
    └── server.js             # Express app & server startup
```

---

## Getting Started

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
Edit `.env`:
```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/vernacular_classroom
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key_from_google_ai_studio
CORS_ORIGIN=http://localhost:5173
```

### 3. Run Server
```bash
# Production mode
npm start

# Development mode (auto-reload on save)
npm run dev
```

### 4. Run Automated Tests
```bash
npm test
```

---

## REST API Reference

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/health` | Service health, DB status & AI engine info | Public |
| `POST` | `/api/auth/demo` | One-click instant demo login (`teacher`/`student`) | Public |
| `POST` | `/api/auth/login` | Email & password login | Public |
| `POST` | `/api/auth/register`| Register new educator or student | Public |
| `GET` | `/api/auth/me` | Current user profile | Bearer JWT |
| `GET` | `/api/languages` | List supported regional languages and scripts | Public |
| `GET` | `/api/lessons` | List lessons with translations | Public |
| `POST` | `/api/lessons/upload` | Upload PDF/TXT lesson and auto-extract text | Public / Teacher |
| `POST` | `/api/lessons/simplify` | AI lesson simplification for Class 3-6 | Public |
| `POST` | `/api/translate` | Translate text into target dialect | Public |
| `POST` | `/api/translate/all` | Simultaneous translation to all 4 tribal dialects | Public |
| `POST` | `/api/translate/speech`| Translate text with TTS audio metadata | Public |
| `POST` | `/api/speech/transcribe`| Upload speech audio recording and transcribe | Public |
| `GET` | `/api/classroom/:room` | Live room details and active participant stats | Public |

---

## Socket.IO Events (`/classroom` namespace)

### Client to Server
- `join_room`: `{ room, role: 'teacher' | 'student', name, preferredLanguage }`
- `change_language`: `{ language: 'Santhali' | 'Mundari' | 'Ho' | 'Kurukh' }`
- `teacher:speech`: `{ room, text, sourceLanguage }`
- `student:question`: `{ room, text, language }`
- `student:raise_hand`: `{}`

### Server to Client
- `classroom:broadcast`: Emitted to all in room with full multilingual dictionary.
- `classroom:speech_translated`: Emitted to language-specific subchannel (`main:santhali`, etc.) with targeted translation & TTS audio.
- `classroom:student_question`: Emitted to teacher with Hindi translation.
- `room:state`: Current room participants and recent transcript feed.
