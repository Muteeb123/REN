from model_loader import classifier

def analyze_text(text: str):
    if not isinstance(text, str) or not text.strip():
        raise ValueError("text must be a non-empty string")

    try:
        return classifier(text.strip(), top_k=None)
    except Exception as exc:
        raise RuntimeError("Sentiment model inference failed") from excs