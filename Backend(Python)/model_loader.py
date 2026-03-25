from transformers import pipeline
import os

HF_TOKEN = os.getenv("HF_TOKEN")
print("Loaded HF_TOKEN:", HF_TOKEN)

classifier = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    token=HF_TOKEN,
    return_all_scores=True
)