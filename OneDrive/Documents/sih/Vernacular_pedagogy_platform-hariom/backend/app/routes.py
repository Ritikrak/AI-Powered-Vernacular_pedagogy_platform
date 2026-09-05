import json
import asyncio
from collections import defaultdict

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import RedirectResponse
from urllib.parse import urlencode
from sqlalchemy.orm import Session

from .database import get_db
from .models import Lesson, Translation, User
from .schemas import DemoLoginRequest, LessonOut, SpeechTranslateRequest, SpeechTranslateResponse, TokenResponse, TranscriptionResponse, TranslateAllRequest, TranslateAllResponse, TranslateRequest, TranslateResponse, TranslationCreate, TranslationOutWithLesson
from .services.auth import create_access_token
from .services.extractor import extract_text
from .services.translator import translate
from .services.google_speech import free_translate, translate_and_speak
from .services.openai_speech import translate_and_speak_openai
from .config import get_settings
from .services.deepgram import connect_realtime, transcribe_audio

router = APIRouter()
rooms: dict[str, set[WebSocket]] = defaultdict(set)


def translate_with_audio(text: str, language: str) -> tuple[str, str | None, str]:
    if get_settings().openai_api_key:
        return translate_and_speak_openai(text, language, translate)
    if get_settings().google_api_key:
        return translate_and_speak(text, language, translate)
    free_result = free_translate(text, language)
    if free_result:
        return free_result, None, "mymemory"
    return translate(text, language), None, "offline"


@router.post("/auth/demo", response_model=TokenResponse)
def demo_login(payload: DemoLoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(User).filter_by(email=payload.email).first()
    if user is None:
        user = User(email=payload.email, name=payload.name, role=payload.role)
        db.add(user)
    else:
        user.name = payload.name
        user.role = payload.role
    db.commit()
    db.refresh(user)
    return TokenResponse(access_token=create_access_token(f"user:{user.id}"))


@router.get("/auth/google")
def google_login() -> RedirectResponse:
    settings = get_settings()
    if not settings.google_client_id:
        raise HTTPException(status_code=503, detail="Google login is not configured")
    query = urlencode({"client_id": settings.google_client_id, "redirect_uri": settings.google_redirect_uri, "response_type": "code", "scope": "openid email profile", "access_type": "offline", "prompt": "select_account"})
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{query}")


@router.post("/translate", response_model=TranslateResponse)
def translate_text(payload: TranslateRequest) -> TranslateResponse:
    translated, _, _ = translate_with_audio(payload.text, payload.target_language)
    return TranslateResponse(source_text=payload.text, target_language=payload.target_language, translated_text=translated)


@router.post("/translate/speech", response_model=SpeechTranslateResponse)
def translate_speech(payload: SpeechTranslateRequest) -> SpeechTranslateResponse:
    translated, audio, provider = translate_with_audio(payload.text, payload.target_language)
    return SpeechTranslateResponse(source_text=payload.text, target_language=payload.target_language, translated_text=translated, audio_base64=audio, provider=provider)


@router.post("/speech/transcribe", response_model=TranscriptionResponse)
async def transcribe(file: UploadFile = File(...)) -> TranscriptionResponse:
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Upload an audio recording")
    try:
        transcript = transcribe_audio(await file.read(), file.content_type, "hi")
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=502, detail="Deepgram transcription failed") from error
    return TranscriptionResponse(transcript=transcript)


@router.post("/translate/all", response_model=TranslateAllResponse)
def translate_all(payload: TranslateAllRequest) -> TranslateAllResponse:
    target_languages = ("hi", "en", "sat", "unr", "hoc", "kru")
    return TranslateAllResponse(source_text=payload.text, translations={language: translate_with_audio(payload.text, language)[0] for language in target_languages})


@router.post("/lessons/upload", response_model=LessonOut)
async def upload_lesson(file: UploadFile = File(...), db: Session = Depends(get_db)) -> Lesson:
    if not file.filename or file.filename.lower().split(".")[-1] not in {"pdf", "txt", "md"}:
        raise HTTPException(status_code=400, detail="Upload a PDF, TXT, or MD file")
    content = await file.read()
    text = await extract_text(file.filename, content)
    if not text:
        raise HTTPException(status_code=400, detail="No readable text found in this file")
    lesson = Lesson(title=file.filename.rsplit(".", 1)[0], source_text=text)
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.post("/lessons/{lesson_id}/translate", response_model=LessonOut)
def translate_lesson(lesson_id: int, payload: TranslateRequest, db: Session = Depends(get_db)) -> Lesson:
    lesson = db.get(Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    existing = db.query(Translation).filter_by(lesson_id=lesson_id, language=payload.target_language).first()
    if existing is None:
        existing = Translation(lesson_id=lesson_id, language=payload.target_language, translated_text=translate(lesson.source_text, payload.target_language))
        db.add(existing)
        db.commit()
    db.refresh(lesson)
    return lesson


@router.post("/lessons/{lesson_id}/translations", response_model=TranslationOutWithLesson)
def create_lesson_translation(lesson_id: int, payload: TranslationCreate, db: Session = Depends(get_db)) -> Translation:
    lesson = db.get(Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    translation = db.query(Translation).filter_by(lesson_id=lesson_id, language=payload.target_language).first()
    if translation is None:
        translation = Translation(lesson_id=lesson_id, language=payload.target_language, translated_text=translate(lesson.source_text, payload.target_language))
        db.add(translation)
        db.commit()
        db.refresh(translation)
    return {"lesson_id": lesson.id, "lesson_title": lesson.title, "language": translation.language, "translated_text": translation.translated_text}


@router.get("/lessons/{lesson_id}/translations/{language}", response_model=TranslationOutWithLesson)
def get_lesson_translation(lesson_id: int, language: str, db: Session = Depends(get_db)) -> TranslationOutWithLesson:
    lesson = db.get(Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if language not in {"sat", "unr", "hoc", "kru"}:
        raise HTTPException(status_code=400, detail="Unsupported language")
    translation = db.query(Translation).filter_by(lesson_id=lesson_id, language=language).first()
    if translation is None:
        translation = Translation(lesson_id=lesson_id, language=language, translated_text=translate(lesson.source_text, language))
        db.add(translation)
        db.commit()
        db.refresh(translation)
    return TranslationOutWithLesson(lesson_id=lesson.id, lesson_title=lesson.title, language=translation.language, translated_text=translation.translated_text)


@router.get("/lessons", response_model=list[LessonOut])
def list_lessons(db: Session = Depends(get_db)) -> list[Lesson]:
    return db.query(Lesson).order_by(Lesson.created_at.desc()).all()


@router.get("/lessons/{lesson_id}", response_model=LessonOut)
def get_lesson(lesson_id: int, db: Session = Depends(get_db)) -> Lesson:
    lesson = db.get(Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


async def broadcast(room: str, message: dict) -> None:
    disconnected = set()
    for connection in rooms[room]:
        try:
            await connection.send_text(json.dumps(message))
        except Exception:
            disconnected.add(connection)
    rooms[room] -= disconnected


@router.websocket("/classroom/{room_id}")
async def classroom(websocket: WebSocket, room_id: str) -> None:
    await websocket.accept()
    rooms[room_id].add(websocket)
    await broadcast(room_id, {"type": "presence", "count": len(rooms[room_id])})
    try:
        while True:
            message = await websocket.receive_json()
            if message.get("type") == "speech" and message.get("text"):
                translated, audio, provider = translate_with_audio(message["text"], message.get("language", "sat"))
                await broadcast(room_id, {"type": "translation", "source_text": message["text"], "text": translated, "language": message.get("language", "sat"), "audio_base64": audio, "provider": provider})
            else:
                await broadcast(room_id, message)
    except WebSocketDisconnect:
        rooms[room_id].discard(websocket)
        await broadcast(room_id, {"type": "presence", "count": len(rooms[room_id])})


@router.websocket("/classroom/{room_id}/deepgram")
async def deepgram_classroom(websocket: WebSocket, room_id: str) -> None:
    await websocket.accept()
    language = websocket.query_params.get("language", "sat")
    try:
        deepgram = await connect_realtime("hi")
    except RuntimeError as error:
        await websocket.send_json({"type": "error", "message": str(error)})
        await websocket.close(code=1013)
        return
    except Exception:
        await websocket.send_json({"type": "error", "message": "Deepgram realtime connection failed"})
        await websocket.close(code=1013)
        return

    async def send_audio() -> None:
        while True:
            message = await websocket.receive()
            if message.get("type") == "websocket.disconnect":
                break
            audio = message.get("bytes")
            if audio:
                await deepgram.send(audio)

    async def receive_transcripts() -> None:
        async for raw_message in deepgram:
            payload = json.loads(raw_message)
            alternative = payload.get("channel", {}).get("alternatives", [{}])[0]
            transcript = alternative.get("transcript", "").strip()
            if not transcript:
                continue
            is_final = payload.get("is_final", False)
            translated = await asyncio.to_thread(translate_with_audio, transcript, language)
            await websocket.send_json({"type": "translation", "source_text": transcript, "text": translated[0], "language": language, "provider": "deepgram", "is_final": is_final})

    try:
        await asyncio.gather(send_audio(), receive_transcripts())
    except (WebSocketDisconnect, RuntimeError):
        pass
    finally:
        await deepgram.close()
