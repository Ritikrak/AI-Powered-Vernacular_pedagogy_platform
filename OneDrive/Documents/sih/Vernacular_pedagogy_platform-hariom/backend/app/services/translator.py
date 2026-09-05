from collections.abc import Iterable

LANGUAGE_NAMES = {"hi": "Hindi", "en": "English", "sat": "Santhali", "unr": "Mundari", "hoc": "Ho", "kru": "Kurukh"}

# Offline demo dictionaries make the product testable before an AI provider is configured.
DICTIONARY = {
    "hello": {"sat": "Johar", "unr": "Johar", "hoc": "Johar", "kru": "Johar"},
    "water": {"sat": "Da:", "unr": "Daa", "hoc": "Daka", "kru": "En"},
    "school": {"sat": "Iskul", "unr": "Iskul", "hoc": "School", "kru": "School"},
    "teacher": {"sat": "Guru", "unr": "Guru", "hoc": "Guru", "kru": "Guru"},
    "student": {"sat": "Cheda", "unr": "Cheda", "hoc": "Cheda", "kru": "Cheda"},
    "learn": {"sat": "Pora", "unr": "Pora", "hoc": "Pora", "kru": "Kechna"},
}


def translate(text: str, target_language: str) -> str:
    words: Iterable[str] = text.split()
    translated = []
    for word in words:
        clean = word.strip(".,!?;:").lower()
        replacement = DICTIONARY.get(clean, {}).get(target_language)
        translated.append(replacement or word)
    prefix = LANGUAGE_NAMES.get(target_language, target_language)
    return f"[{prefix}] " + " ".join(translated)
