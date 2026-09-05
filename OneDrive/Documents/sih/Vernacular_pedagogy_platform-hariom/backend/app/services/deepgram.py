import httpx
from urllib.parse import urlencode
from websockets.asyncio.client import connect

from ..config import get_settings


def transcribe_audio(content: bytes, content_type: str, language: str = "hi") -> str:
    settings = get_settings()
    if not settings.deepgram_api_key:
        raise RuntimeError("Deepgram is not configured")
    response = httpx.post(
        "https://api.deepgram.com/v1/listen",
        params={"model": settings.deepgram_model, "language": language, "smart_format": "true", "punctuate": "true"},
        headers={"Authorization": f"Token {settings.deepgram_api_key}", "Content-Type": content_type or "audio/webm"},
        content=content,
        timeout=45,
    )
    response.raise_for_status()
    payload = response.json()
    return payload["results"]["channels"][0]["alternatives"][0].get("transcript", "")


def realtime_url(language: str = "hi") -> str:
    settings = get_settings()
    query = urlencode({"model": settings.deepgram_model, "language": language, "smart_format": "true", "punctuate": "true", "interim_results": "true", "encoding": "opus", "container": "webm"})
    return f"wss://api.deepgram.com/v1/listen?{query}"


async def connect_realtime(language: str = "hi"):
    settings = get_settings()
    if not settings.deepgram_api_key:
        raise RuntimeError("Deepgram is not configured")
    return await connect(realtime_url(language), additional_headers={"Authorization": f"Token {settings.deepgram_api_key}"}, ping_interval=20, ping_timeout=20)