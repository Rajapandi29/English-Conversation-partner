from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List
import os
import uvicorn

from database import get_db, init_db
from models import User, Conversation, Message, GrammarCorrection
from schemas import (
    ChatRequest, 
    ChatResponse, 
    ConversationCreate, 
    ConversationResponse,
    GrammarMistakeItem,
    UserStatsResponse
)
from gemini_service import evaluate_and_reply_english

app = FastAPI(
    title="TalkCraft - English Conversational & Grammar AI API",
    description="Real-time conversational partner with instant grammar, sentence framing correction, and female voice synthesis",
    version="1.0.0"
)

# CORS setup
cors_env = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
origins = [origin.strip() for origin in cors_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    try:
        await init_db()
    except Exception as e:
        print(f"Warning: Database initialization deferred: {e}")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "TalkCraft English AI Tutor Backend",
        "version": "1.0.0"
    }

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_tutor(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """
    Main real-time chat endpoint:
    1. Evaluates user grammar, framing, and vocabulary using Google Gemini.
    2. Generates conversational reply in the specified female persona.
    3. Persists message and grammar feedback to PostgreSQL database.
    """
    try:
        # Call Google GenAI for analysis and response
        analysis, ai_reply, tts_audio = await evaluate_and_reply_english(
            user_text=request.message,
            history=request.history,
            persona=request.persona,
            user_level=request.user_level,
            scenario=request.scenario
        )
        
        # Save user message & feedback if conversation_id provided
        if request.conversation_id:
            user_msg = Message(
                conversation_id=request.conversation_id,
                sender="user",
                text=request.message,
                accuracy_score=analysis.get("overallScore", 100)
            )
            db.add(user_msg)
            await db.flush()

            for item in analysis.get("corrections", []):
                correction = GrammarCorrection(
                    message_id=user_msg.id,
                    original_phrase=item.get("original", ""),
                    corrected_phrase=item.get("corrected", ""),
                    error_type=item.get("errorType", "sentence_framing"),
                    explanation=item.get("explanation", ""),
                    tamil_explanation=item.get("tamilExplanation", ""),
                    better_framing_casual=analysis.get("betterFraming", {}).get("casual"),
                    better_framing_professional=analysis.get("betterFraming", {}).get("professional")
                )
                db.add(correction)

            ai_msg = Message(
                conversation_id=request.conversation_id,
                sender="ai",
                text=ai_reply
            )
            db.add(ai_msg)
            await db.commit()

        return ChatResponse(
            reply=ai_reply,
            grammar_analysis=analysis,
            audio_base64=tts_audio
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/mistakes", response_model=List[GrammarMistakeItem])
async def get_mistakes_bank(db: AsyncSession = Depends(get_db)):
    """Returns saved grammar and phrasing mistakes for spaced repetition review."""
    result = await db.execute(
        select(GrammarCorrection)
        .order_by(GrammarCorrection.created_at.desc())
        .limit(100)
    )
    mistakes = result.scalars().all()
    return mistakes

@app.delete("/api/mistakes/{mistake_id}")
async def delete_mistake(mistake_id: str, db: AsyncSession = Depends(get_db)):
    """Deletes a reviewed grammar mistake from the mistake bank."""
    await db.execute(delete(GrammarCorrection).where(GrammarCorrection.id == mistake_id))
    await db.commit()
    return {"message": "Mistake deleted successfully"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
