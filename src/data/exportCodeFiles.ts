export interface ProjectFile {
  path: string;
  category: 'fastapi' | 'nextjs' | 'database' | 'docker' | 'docs';
  language: string;
  description: string;
  content: string;
}

export const EXPORT_FILES: ProjectFile[] = [
  {
    path: 'docker-compose.yml',
    category: 'docker',
    language: 'yaml',
    description: 'One-click launch for PostgreSQL, FastAPI backend, and Next.js frontend.',
    content: `version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: talkcraft_postgres
    restart: always
    environment:
      POSTGRES_USER: talkcraft_user
      POSTGRES_PASSWORD: talkcraft_password
      POSTGRES_DB: talkcraft_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U talkcraft_user -d talkcraft_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: talkcraft_fastapi
    restart: always
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://talkcraft_user:talkcraft_password@postgres:5432/talkcraft_db
      - GEMINI_API_KEY=\${GEMINI_API_KEY}
      - CORS_ORIGINS=http://localhost:3000
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: talkcraft_nextjs
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend

volumes:
  postgres_data:
`
  },
  {
    path: 'database/init.sql',
    category: 'database',
    language: 'sql',
    description: 'PostgreSQL database schema, tables, indexes, and initial seed data.',
    content: `-- PostgreSQL Schema for TalkCraft English AI Conversational Practice
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    preferred_persona VARCHAR(50) DEFAULT 'emma',
    english_level VARCHAR(50) DEFAULT 'intermediate',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Conversation Sessions Table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'New Conversation',
    persona VARCHAR(50) DEFAULT 'emma',
    scenario VARCHAR(100) DEFAULT 'casual',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'ai')),
    text TEXT NOT NULL,
    accuracy_score INT,
    audio_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Grammar Mistakes & Corrections Table
CREATE TABLE IF NOT EXISTS grammar_corrections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    original_phrase TEXT NOT NULL,
    corrected_phrase TEXT NOT NULL,
    error_type VARCHAR(100) NOT NULL,
    explanation TEXT NOT NULL,
    tamil_explanation TEXT,
    better_framing_casual TEXT,
    better_framing_professional TEXT,
    reviewed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_grammar_user ON grammar_corrections(user_id);
CREATE INDEX IF NOT EXISTS idx_grammar_error_type ON grammar_corrections(error_type);
`
  },
  {
    path: 'backend/main.py',
    category: 'fastapi',
    language: 'python',
    description: 'FastAPI application entry point with CORS, REST routes, and Gemini integration.',
    content: `from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
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
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    await init_db()

@app.get("/health")
async def health_check():
    return {"status": "ok", "app": "TalkCraft English AI Tutor"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_tutor(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """
    Main real-time chat endpoint:
    1. Evaluates user grammar, framing, and vocabulary.
    2. Generates conversational reply in the specified female persona.
    3. Persists message and grammar feedback to PostgreSQL.
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
            # 1. User message
            user_msg = Message(
                conversation_id=request.conversation_id,
                sender="user",
                text=request.message,
                accuracy_score=analysis.get("overallScore", 100)
            )
            db.add(user_msg)
            await db.flush()

            # 2. Store individual grammar corrections
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

            # 3. AI message
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
    """Returns saved grammar and phrasing mistakes for spaced repetition drill."""
    result = await db.execute(select(GrammarCorrection).order_by(GrammarCorrection.created_at.desc()).limit(100))
    mistakes = result.scalars().all()
    return mistakes

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
`
  },
  {
    path: 'backend/models.py',
    category: 'fastapi',
    language: 'python',
    description: 'SQLAlchemy declarative models for PostgreSQL persistence.',
    content: `from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(100), nullable=True)
    preferred_persona = Column(String(50), default="emma")
    english_level = Column(String(50), default="intermediate")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(255), default="English Practice")
    persona = Column(String(50), default="emma")
    scenario = Column(String(100), default="casual")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"))
    sender = Column(String(20), nullable=False)  # 'user' or 'ai'
    text = Column(Text, nullable=False)
    accuracy_score = Column(Integer, nullable=True)
    audio_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    conversation = relationship("Conversation", back_populates="messages")
    corrections = relationship("GrammarCorrection", back_populates="message", cascade="all, delete-orphan")

class GrammarCorrection(Base):
    __tablename__ = "grammar_corrections"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    original_phrase = Column(Text, nullable=False)
    corrected_phrase = Column(Text, nullable=False)
    error_type = Column(String(100), nullable=False)
    explanation = Column(Text, nullable=False)
    tamil_explanation = Column(Text, nullable=True)
    better_framing_casual = Column(Text, nullable=True)
    better_framing_professional = Column(Text, nullable=True)
    reviewed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    message = relationship("Message", back_populates="corrections")
`
  },
  {
    path: 'backend/schemas.py',
    category: 'fastapi',
    language: 'python',
    description: 'Pydantic V2 schemas for request validation and serialization.',
    content: `from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

class HistoryTurn(BaseModel):
    sender: str
    text: str

class ChatRequest(BaseModel):
    conversation_id: Optional[UUID] = None
    message: str = Field(..., min_length=1, description="Spoken or typed sentence by user")
    history: List[HistoryTurn] = []
    persona: str = Field(default="emma", description="Selected female persona")
    user_level: str = Field(default="intermediate")
    scenario: str = Field(default="casual")

class CorrectionItem(BaseModel):
    original: str
    corrected: str
    errorType: str
    explanation: str
    tamilExplanation: Optional[str] = None

class BetterFraming(BaseModel):
    casual: str
    professional: str
    nativeIdiomOrPhrase: Optional[str] = None

class VocabularyBooster(BaseModel):
    word: str
    meaning: str
    example: str

class GrammarAnalysis(BaseModel):
    overallScore: int
    hasErrors: bool
    summary: str
    corrections: List[CorrectionItem] = []
    betterFraming: BetterFraming
    vocabularyBoosters: List[VocabularyBooster] = []
    pronunciationTips: Optional[List[str]] = None

class ChatResponse(BaseModel):
    reply: str
    grammar_analysis: GrammarAnalysis
    audio_base64: Optional[str] = None

class GrammarMistakeItem(BaseModel):
    id: UUID
    original_phrase: str
    corrected_phrase: str
    error_type: str
    explanation: str
    tamil_explanation: Optional[str]
    better_framing_casual: Optional[str]
    better_framing_professional: Optional[str]
    reviewed: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationCreate(BaseModel):
    persona: str = "emma"
    scenario: str = "casual"
    title: Optional[str] = "English Practice"

class ConversationResponse(BaseModel):
    id: UUID
    title: str
    persona: str
    scenario: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserStatsResponse(BaseModel):
    total_sentences: int
    average_accuracy: float
    total_mistakes_fixed: int
`
  },
  {
    path: 'backend/database.py',
    category: 'fastapi',
    language: 'python',
    description: 'PostgreSQL asynchronous engine and session manager.',
    content: `from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from models import Base
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql+asyncpg://talkcraft_user:talkcraft_password@localhost:5432/talkcraft_db"
)

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=20
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
`
  },
  {
    path: 'backend/gemini_service.py',
    category: 'fastapi',
    language: 'python',
    description: 'Google GenAI SDK service providing grammar analysis, conversational replies, and female TTS audio.',
    content: `from google import genai
from google.genai import types
import os
import json

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def get_ai_client():
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY environment variable is required")
    return genai.Client(api_key=GEMINI_API_KEY, http_options={"headers": {"User-Agent": "aistudio-build"}})

PERSONA_PROMPTS = {
    "emma": "You are Emma Watson, a warm, supportive, friendly British conversational partner (Oxford English). Keep replies conversational, concise (2-3 sentences), encouraging the user to speak more naturally.",
    "sophia": "You are Sophia Chen, a sharp, encouraging American career coach. Speak in articulate, polished professional English suitable for meetings and interviews.",
    "chloe": "You are Chloe Rivera, an expressive world traveler and creative storyteller. Speak with enthusiasm and engaging questions.",
    "priya": "You are Dr. Priya Sharma, an IELTS & TOEFL Master Trainer. Focus on lexical variety, formal grammatical accuracy, and idiomatic phrasing."
}

SYSTEM_INSTRUCTION = """
You are the world's finest real-time Spoken English Coach.
The user speaks to you in English (often native Tamil/South Asian speakers learning spoken English).
For EVERY user input:
1. Provide a natural, friendly conversational reply in your persona (keep it brief, 2-3 sentences).
2. Deeply analyze the user's sentence for:
   - Grammar errors (tenses, prepositions, singular/plural, subject-verb agreement, articles).
   - Sentence framing & naturalness (how native speakers actually say it).
   - Provide a clear English explanation AND a friendly Tamil explanation (தமிழ் விளக்கம்) so they immediately understand the reason.
   - Provide two natural alternative framings: Casual conversational and Professional/formal.
   - Provide 2 vocabulary booster words suitable for this context.
   - Calculate an overall accuracy score (0-100).
"""

async def evaluate_and_reply_english(user_text: str, history: list, persona: str = "emma", user_level: str = "intermediate", scenario: str = "casual"):
    client = get_ai_client()
    persona_intro = PERSONA_PROMPTS.get(persona, PERSONA_PROMPTS["emma"])

    prompt = f"""
Persona context: {persona_intro}
Conversation Scenario: {scenario}
Learner Level: {user_level}
Recent history: {history[-4:] if history else 'None'}

User said: "{user_text}"

Return a single JSON object strictly matching this schema:
{{
  "reply": "Your conversational reply in English",
  "grammarAnalysis": {{
    "overallScore": 85,
    "hasErrors": true,
    "summary": "Good effort! Just a small past-tense verb agreement to fix.",
    "corrections": [
      {{
        "original": "exact wrong words",
        "corrected": "exact corrected words",
        "errorType": "tense | preposition | article | subject_verb_agreement | word_choice | sentence_framing",
        "explanation": "Clear English explanation",
        "tamilExplanation": "Clear Tamil explanation of why this grammar rule applies"
      }}
    ],
    "betterFraming": {{
      "casual": "How a native speaker says this informally",
      "professional": "How to say this in an office/formal meeting",
      "nativeIdiomOrPhrase": "Optional idiom"
    }},
    "vocabularyBoosters": [
      {{
        "word": "eloquent",
        "meaning": "fluent or persuasive in speaking",
        "example": "She gave an eloquent presentation."
      }}
    ],
    "pronunciationTips": ["phonetic tip if any difficult word"]
  }}
}}
"""

    response = client.models.generate_content(
        model="gemini-3.8-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            response_mime_type="application/json",
            temperature=0.7
        )
    )

    data = json.loads(response.text)
    ai_reply = data.get("reply", "That sounds interesting! Tell me more.")
    analysis = data.get("grammarAnalysis", {})

    # Generate speech with Gemini TTS (Voice: Kore - natural female voice)
    tts_audio_base64 = None
    try:
        tts_res = client.models.generate_content(
            model="gemini-3.1-flash-tts-preview",
            contents=ai_reply,
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Kore")
                    )
                )
            )
        )
        if tts_res.candidates and tts_res.candidates[0].content.parts:
            part = tts_res.candidates[0].content.parts[0]
            if part.inline_data:
                tts_audio_base64 = part.inline_data.data
    except Exception as tts_err:
        print(f"TTS skipped/fallback to Web Speech: {tts_err}")

    return analysis, ai_reply, tts_audio_base64
`
  },
  {
    path: 'backend/requirements.txt',
    category: 'fastapi',
    language: 'text',
    description: 'Python package dependencies for the FastAPI server.',
    content: `fastapi==0.110.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.29
asyncpg==0.29.0
psycopg2-binary==2.9.9
google-genai==2.4.0
pydantic==2.6.4
python-dotenv==1.0.1
`
  },
  {
    path: 'backend/Dockerfile',
    category: 'docker',
    language: 'dockerfile',
    description: 'Production Dockerfile for FastAPI backend.',
    content: `FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
`
  },
  {
    path: 'backend/.dockerignore',
    category: 'docker',
    language: 'text',
    description: 'Docker ignore file for backend image optimization.',
    content: `__pycache__
*.pyc
*.pyo
*.pyd
.env
.venv
env/
venv/
.git
.gitignore
`
  },
  {
    path: 'frontend/Dockerfile',
    category: 'docker',
    language: 'dockerfile',
    description: 'Production Dockerfile for Next.js 14 frontend.',
    content: `FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs
EXPOSE 3000
CMD ["npm", "start"]
`
  },
  {
    path: 'frontend/.dockerignore',
    category: 'docker',
    language: 'text',
    description: 'Docker ignore file for Next.js frontend.',
    content: `node_modules
.next
out
.git
.gitignore
.env*.local
`
  },
  {
    path: 'frontend/next.config.js',
    category: 'nextjs',
    language: 'javascript',
    description: 'Next.js configuration file.',
    content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;
`
  },
  {
    path: 'frontend/app/page.tsx',
    category: 'nextjs',
    language: 'typescript',
    description: 'Next.js 14 App Router conversational voice UI with speech recognition and live grammar cards.',
    content: `'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, CheckCircle2, AlertCircle, Send, Globe, Award } from 'lucide-react';

export default function TalkCraftPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<any>(null);
  const [showTamil, setShowTamil] = useState(true);

  // Web Speech recognition hookup
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
          setInputText(transcript);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return alert('Speech recognition not supported in this browser.');
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setInputText('');
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleSend = async (textToSend = inputText) => {
    if (!textToSend.trim() || isLoading) return;
    const userMsg = { id: Date.now().toString(), sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch(\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/chat\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages.map((m) => ({ sender: m.sender, text: m.text })),
          persona: 'emma',
          user_level: 'intermediate',
          scenario: 'casual'
        })
      });
      const data = await res.json();
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.reply,
        grammarAnalysis: data.grammar_analysis
      };
      setMessages((prev) => [...prev, aiMsg]);
      setActiveAnalysis(data.grammar_analysis);

      // Play female voice
      speakFemaleVoice(data.reply);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const speakFemaleVoice = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(
      (v) =>
        v.name.includes('Google UK English Female') ||
        v.name.includes('Samantha') ||
        v.name.includes('Zira') ||
        v.name.includes('Victoria')
    );
    if (femaleVoice) utterance.voice = femaleVoice;
    utterance.pitch = 1.05;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      {/* Main Conversation Stream */}
      <div className="flex-1 flex flex-col border-r border-slate-800">
        <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold">EW</div>
            <div>
              <h2 className="font-semibold text-sm">Emma Watson</h2>
              <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Spoken English Tutor (Female Voice)
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowTamil(!showTamil)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white flex items-center gap-2"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            {showTamil ? 'தமிழ் விளக்கம்: On' : 'Tamil Explanation: Off'}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={\`flex \${m.sender === 'user' ? 'justify-end' : 'justify-start'}\`}>
              <div
                className={\`max-w-xl rounded-2xl p-4 \${
                  m.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                }\`}
              >
                <p className="text-sm leading-relaxed">{m.text}</p>
                {m.sender === 'ai' && (
                  <button
                    onClick={() => speakFemaleVoice(m.text)}
                    className="mt-2 text-xs flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Re-listen in Female Voice
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && <div className="text-xs text-indigo-400 animate-pulse">Emma is thinking and analyzing grammar...</div>}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleRecording}
              className={\`w-12 h-12 rounded-full flex items-center justify-center transition-all \${
                isRecording ? 'bg-rose-500 animate-bounce text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }\`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Speak with microphone or type your sentence..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => handleSend()}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> Send
            </button>
          </div>
        </div>
      </div>

      {/* Grammar & Sentence Framing Sidebar */}
      <div className="w-96 p-6 overflow-y-auto bg-slate-950">
        <h3 className="font-bold text-base flex items-center gap-2 text-indigo-300 mb-4">
          <Sparkles className="w-5 h-5" /> Instant Grammar & Framing
        </h3>

        {activeAnalysis ? (
          <div className="space-y-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Fluency Score</p>
                <p className="text-2xl font-bold text-emerald-400">{activeAnalysis.overallScore}%</p>
              </div>
              <Award className="w-8 h-8 text-amber-400" />
            </div>

            {activeAnalysis.corrections?.map((c: any, i: number) => (
              <div key={i} className="bg-slate-900 p-4 rounded-xl border border-rose-900/40">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mb-1">
                  <AlertCircle className="w-4 h-4" /> {c.errorType}
                </div>
                <p className="text-xs text-slate-400 line-through">You said: {c.original}</p>
                <p className="text-sm font-medium text-emerald-400 mt-1">Correct: {c.corrected}</p>
                <p className="text-xs text-slate-300 mt-2">{c.explanation}</p>
                {showTamil && c.tamilExplanation && (
                  <p className="text-xs text-amber-200/90 mt-2 p-2 bg-amber-950/30 rounded border border-amber-800/30 font-serif">
                    தமிழ் விளக்கம்: {c.tamilExplanation}
                  </p>
                )}
              </div>
            ))}

            <div className="bg-slate-900 p-4 rounded-xl border border-indigo-900/40">
              <h4 className="text-xs font-semibold text-indigo-400 mb-2">Native Speaker Framing:</h4>
              <p className="text-xs text-slate-300 mb-1"><span className="text-slate-400 font-medium">Casual:</span> {activeAnalysis.betterFraming?.casual}</p>
              <p className="text-xs text-slate-300"><span className="text-slate-400 font-medium">Professional:</span> {activeAnalysis.betterFraming?.professional}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-sm">
            Speak or send a message to receive real-time grammar checks, sentence framing fixes, and Tamil explanations!
          </div>
        )}
      </div>
    </div>
  );
}
`
  },
  {
    path: 'frontend/app/layout.tsx',
    category: 'nextjs',
    language: 'typescript',
    description: 'Next.js 14 root layout with meta tags and styling.',
    content: `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TalkCraft - Real-Time English AI Tutor',
  description: 'Practice real-time spoken English with female AI voices, live grammar correction, and native sentence framing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
`
  },
  {
    path: 'frontend/package.json',
    category: 'nextjs',
    language: 'json',
    description: 'Next.js 14 frontend dependencies.',
    content: `{
  "name": "talkcraft-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.364.0"
  },
  "devDependencies": {
    "@types/node": "^20.12.7",
    "@types/react": "^18.2.79",
    "@types/react-dom": "^18.2.25",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "typescript": "^5.4.5"
  }
}
`
  },
  {
    path: 'README.md',
    category: 'docs',
    language: 'markdown',
    description: 'Full setup and deployment instructions for Next.js, FastAPI, and PostgreSQL.',
    content: `# TalkCraft - English Conversational Partner & Grammar Coach
**Next.js 14 + FastAPI + PostgreSQL + Google Gemini AI**

A production-ready full-stack application built for real-time spoken English practice, live grammar corrections, native speaker sentence framing, and natural female voice synthesis.

---

## 🚀 Quick Start with Docker Compose (Recommended)

1. **Clone or Extract the Project**:
   \`\`\`bash
   unzip english-voice-ai-nextjs-fastapi-postgres.zip
   cd english-voice-ai
   \`\`\`

2. **Add Your Gemini API Key**:
   Create a \`.env\` file in the root directory:
   \`\`\`env
   GEMINI_API_KEY=your_gemini_api_key_here
   \`\`\`

3. **Start All Services**:
   \`\`\`bash
   docker compose up --build
   \`\`\`

4. **Open in Browser**:
   - **Frontend (Next.js)**: [http://localhost:3000](http://localhost:3000)
   - **Backend API (FastAPI Swagger Docs)**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Database (PostgreSQL)**: \`localhost:5432\` (User: \`talkcraft_user\`, DB: \`talkcraft_db\`)

---

## 🛠 Manual Local Development

### 1. Database Setup (PostgreSQL)
\`\`\`bash
psql -U postgres -c "CREATE USER talkcraft_user WITH PASSWORD 'talkcraft_password';"
psql -U postgres -c "CREATE DATABASE talkcraft_db OWNER talkcraft_user;"
psql -U talkcraft_user -d talkcraft_db -f init.sql
\`\`\`

### 2. Backend (FastAPI)
\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt
export GEMINI_API_KEY="your_api_key"
export DATABASE_URL="postgresql+asyncpg://talkcraft_user:talkcraft_password@localhost:5432/talkcraft_db"
uvicorn main:app --reload --port 8000
\`\`\`

### 3. Frontend (Next.js)
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
`
  }
];
