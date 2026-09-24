from google import genai
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
You are the world's finest real-time Spoken English Coach and conversational companion.
The user speaks to you in English (often non-native speakers seeking fluency, including native Tamil or South Asian learners).
For EVERY user input:
1. Provide a natural, friendly conversational reply in your persona (keep it brief, 2-3 sentences).
2. Deeply analyze the user's sentence for:
   - Grammar errors (tenses, prepositions, singular/plural, subject-verb agreement, articles).
   - Sentence framing & naturalness (how native speakers actually speak).
   - Provide a clear English explanation AND a friendly Tamil explanation (தமிழ் விளக்கம்) so they understand the grammatical nuance immediately.
   - Provide two natural alternative framings: Casual conversational and Professional/formal.
   - Provide 2 vocabulary booster words suitable for this context.
   - Calculate an overall accuracy score (0-100).
"""

async def evaluate_and_reply_english(
    user_text: str, 
    history: list, 
    persona: str = "emma", 
    user_level: str = "intermediate", 
    scenario: str = "casual"
):
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
        "tamilExplanation": "Clear Tamil explanation of why this grammar rule applies (தமிழ் விளக்கம்)"
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
        model="gemini-2.5-flash",
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

    # Generate speech with Gemini TTS Preview (Kore - warm natural female voice)
    tts_audio_base64 = None
    try:
        tts_res = client.models.generate_content(
            model="gemini-2.5-flash",
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
        # Graceful fallback: Frontend Web Speech API handles client-side female voice
        pass

    return analysis, ai_reply, tts_audio_base64
