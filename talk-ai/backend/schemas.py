from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class HistoryTurn(BaseModel):
    sender: str
    text: str

class ChatRequest(BaseModel):
    conversation_id: Optional[UUID] = None
    message: str = Field(..., min_length=1)
    history: List[HistoryTurn] = []
    persona: str = "emma"
    user_level: str = "intermediate"
    scenario: str = "casual"

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
