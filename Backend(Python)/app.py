from fastapi import FastAPI
from routes.geminiRoutes import router as geminiRouter
from dotenv import load_dotenv
import uvicorn

load_dotenv()  # Load GEMINI_API_KEY from .env

app = FastAPI()

# Register routes
app.include_router(geminiRouter, prefix="/api/gemini")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
    print("Server is running on http://localhost:8000")
