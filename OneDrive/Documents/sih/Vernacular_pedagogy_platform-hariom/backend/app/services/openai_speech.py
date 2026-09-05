import base64

import httpx

from ..config import get_settings

OPENAI_URL = "https://api.openai.com/v1"
LANGUAGE_NAMES = {"hi": "Hindi", "en": "English", "sat": "Santhali", "unr": "Mundari", "hoc": "Ho", "kru": "Kurukh"}


def _headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {get_settings().openai_api_key}", "Content-Type": "application/json"}


def openai_translate(text: str, target_language: str) -> str | None:
    settings = get_settings()
    if not settings.openai_api_key:
        return None
    language = LANGUAGE_NAMES.get(target_language, target_language)
    prompt = f"Translate the following classroom text into {language}. Preserve meaning and return only the translation. If the language is a low-resource language, provide the best supported translation without explanation.\n\n{text}"
    response = httpx.post(f"{OPENAI_URL}/chat/completions", headers=_headers(), json={"model": settings.openai_translation_model, "temperature": 0.2, "messages": [{"role": "system", "content": "You are a careful mother-tongue primary education translator."}, {"role": "user", "content": prompt}]}, timeout=30)
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"].strip()


def openai_tts(text: str) -> str | None:
    settings = get_settings()
    if not settings.openai_api_key:
        return None
    response = httpx.post(f"{OPENAI_URL}/audio/speech", headers=_headers(), json={"model": settings.openai_tts_model, "voice": settings.openai_tts_voice, "input": text, "response_format": "mp3"}, timeout=30)
    response.raise_for_status()
    return base64.b64encode(response.content).decode("ascii")


def translate_and_speak_openai(text: str, target_language: str, fallback_translate) -> tuple[str, str | None, str]:
    try:
        translated = openai_translate(text, target_language)
        if translated is None:
            return fallback_translate(text, target_language), None, "offline"
        return translated, openai_tts(translated), "openai"
    except (httpx.HTTPError, KeyError, ValueError):
        return fallback_translate(text, target_language), None, "offline"