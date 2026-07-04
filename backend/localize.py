"""Helpers for resolving multi-language fields (uz=kirill, uzl=lotin, ru=rus)."""

LANGS = ("uz", "uzl", "ru")


def resolve(obj, field: str, lang: str) -> str:
    """Return the value of `{field}_{lang}` on obj, falling back to the
    other languages (in LANGS order) if empty."""
    lang = lang if lang in LANGS else LANGS[0]
    order = [lang] + [l for l in LANGS if l != lang]
    for l in order:
        val = getattr(obj, f"{field}_{l}", None)
        if val:
            return val
    return ""
