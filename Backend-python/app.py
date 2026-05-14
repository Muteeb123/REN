from fastapi import FastAPI
from routes.geminiRoutes import router as geminiRouter
from fastapi.middleware.cors import CORSMiddleware
from routes.conversationRoutes import router as conversationRouter
from dotenv import load_dotenv
import uvicorn
from routes.sentimentRoutes import router as sentimentRouter

load_dotenv()  # Load GEMINI_API_KEY from .env

app = FastAPI()

origins = [
    "*",  # Allow all origins (can be restricted to your frontend URLs)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,           # or list of frontend URLs
    allow_credentials=True,
    allow_methods=["*"],             # Allow all HTTP methods
    allow_headers=["*"],             # Allow all headers
)
# Register routes
app.include_router(geminiRouter, prefix="/api")
app.include_router(conversationRouter, prefix="/api")
app.include_router(sentimentRouter)  # exposes POST /analyze


#command to run the server
# uvicorn app:app --reload --host 0.0.0.0 --port 8000

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
   
