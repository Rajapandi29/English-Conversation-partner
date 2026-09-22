-- TalkCraft English AI Conversational & Grammar Practice Database Schema
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
    title VARCHAR(255) DEFAULT 'English Practice Session',
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

-- Grammar Mistakes & Sentence Framing Corrections Table
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

-- Query Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_grammar_user ON grammar_corrections(user_id);
CREATE INDEX IF NOT EXISTS idx_grammar_error_type ON grammar_corrections(error_type);

-- Seed Initial Default User
INSERT INTO users (id, email, full_name, preferred_persona, english_level)
VALUES ('00000000-0000-0000-0000-000000000001', 'learner@talkcraft.ai', 'English Learner', 'emma', 'intermediate')
ON CONFLICT (email) DO NOTHING;
