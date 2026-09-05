from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

Language = Literal["hi", "en", "sat", "unr", "hoc", "kru"]


class TranslationOut(BaseModel):
    language: Language
    translated_text: str


class LessonOut(BaseModel):
    id: int
    title: str
    source_language: str
    source_text: str
    created_at: datetime | None = None
    translations: list[TranslationOut] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class TranslateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=10000)
    target_language: Language


class TranslateAllRequest(BaseModel):
    text: str = Field(min_length=1, max_length=10000)


class TranslateAllResponse(BaseModel):
    source_text: str
    translations: dict[Language, str]


class SpeechTranslateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=10000)
    target_language: Language


class SpeechTranslateResponse(BaseModel):
    source_text: str
    target_language: Language
    translated_text: str
    audio_base64: str | None = None
    audio_mime_type: str = "audio/mpeg"
    provider: str


class TranscriptionResponse(BaseModel):
    transcript: str
    provider: str = "deepgram"


class TranslateResponse(BaseModel):
    source_text: str
    target_language: Language
    translated_text: str


class TranslationCreate(BaseModel):
    target_language: Language


class TranslationOutWithLesson(TranslationOut):
    lesson_id: int
    lesson_title: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
