import base64

import httpx

from ..config import get_settings

GOOGLE_TRANSLATION_URL = "https://translation.googleapis.com/language/translate/v2"
GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize"

# Google TTS does not currently expose voices for every Jharkhand language.
# The closest Hindi/Indian English voice keeps the audio path working while text stays vernacular.
TTS_LANGUAGE_CODES = {"hi": "hi-IN", "en": "en-IN", "sat": "hi-IN", "unr": "hi-IN", "hoc": "hi-IN", "kru": "hi-IN"}
MYMEMORY_CODES = {"hi": "hi", "en": "en"}


def google_translate(text: str, target_language: str, source_language: str = "en") -> str | None:
    key = get_settings().google_api_key
    if not key:
        return None
    response = httpx.post(GOOGLE_TRANSLATION_URL, params={"key": key}, json={"q": text, "source": source_language, "target": target_language, "format": "text"}, timeout=12)
    response.raise_for_status()
    return response.json()["data"]["translations"][0]["translatedText"]


def google_tts(text: str, target_language: str) -> str | None:
    key = get_settings().google_api_key
    if not key:
        return None
    response = httpx.post(GOOGLE_TTS_URL, params={"key": key}, json={"input": {"text": text}, "voice": {"languageCode": TTS_LANGUAGE_CODES.get(target_language, "hi-IN"), "ssmlGender": "NEUTRAL"}, "audioConfig": {"audioEncoding": "MP3"}}, timeout=12)
    response.raise_for_status()
    return response.json().get("audioContent")


def translate_and_speak(text: str, target_language: str, fallback_translate) -> tuple[str, str | None, str]:
    try:
        translated = google_translate(text, target_language) or fallback_translate(text, target_language)
        audio = google_tts(translated, target_language)
        return translated, audio, "google" if audio else "offline"
    except (httpx.HTTPError, KeyError, ValueError):
        return fallback_translate(text, target_language), None, "offline"


def free_translate(text: str, target_language: str) -> str | None:
    """Use MyMemory's no-key public endpoint for Hindi/English when configured providers are absent."""
    target = MYMEMORY_CODES.get(target_language)
    if target_language == "en":
        return text
    if target is None:
        return None
    try:
        response = httpx.get("https://api.mymemory.translated.net/get", params={"q": text, "langpair": f"en|{target}"}, timeout=10)
        response.raise_for_status()
        translated = response.json().get("responseData", {}).get("translatedText")
        if translated and "PLEASE SELECT TWO DISTINCT LANGUAGES" in translated.upper():
            return text
        if translated:
            try:
                translated = translated.encode("latin1").decode("utf-8")
            except UnicodeError:
                pass
        return translated if translated else None
    except (httpx.HTTPError, KeyError, ValueError):
        return None


def audio_data_uri(audio_base64: str | None) -> str | None:
    return f"data:audio/mpeg;base64,{audio_base64}" if audio_base64 else None