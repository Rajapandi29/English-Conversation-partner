import { Persona, PracticeScenario } from '../types';

export const PERSONAS: Persona[] = [
  {
    id: 'emma',
    name: 'Emma Watson',
    role: 'Friendly Oxford Conversation Partner',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    accent: 'British (Natural Oxford RP)',
    voiceGender: 'female',
    recommendedVoice: 'Google UK English Female',
    description: 'Warm, patient, and engaging. Perfect for casual chats, daily life, hobbies, and boosting spoken confidence without pressure.',
    systemStyle: 'Speak like Emma: warm, friendly, using natural British colloquial phrases gently, keeping answers concise (2-3 sentences), encouraging the learner to keep talking.'
  },
  {
    id: 'sophia',
    name: 'Sophia Chen',
    role: 'Executive & Career Coach',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
    accent: 'American (Professional Standard)',
    voiceGender: 'female',
    recommendedVoice: 'Google US English Female',
    description: 'Polished, structured, and articulate. Specializes in job interviews, workplace presentations, executive emails, and corporate discussions.',
    systemStyle: 'Speak like Sophia: articulate, motivating, professional, crisp American English, asking sharp conversational follow-ups suited for career growth.'
  },
  {
    id: 'chloe',
    name: 'Chloe Rivera',
    role: 'Storyteller & Cultural Traveler',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=250&q=80',
    accent: 'International English',
    voiceGender: 'female',
    recommendedVoice: 'Samantha',
    description: 'Energetic, expressive, and fun. Loves discussing travel, world cultures, movies, books, food, and creative storytelling.',
    systemStyle: 'Speak like Chloe: vibrant, enthusiastic, full of sensory words and curious questions about what the speaker thinks and feels.'
  },
  {
    id: 'priya',
    name: 'Dr. Priya Sharma',
    role: 'IELTS / TOEFL Master Trainer',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=250&q=80',
    accent: 'Global English & Academic Specialist',
    voiceGender: 'female',
    recommendedVoice: 'Victoria',
    description: 'Methodical, deeply supportive, and analytical. Focuses on Band 8+ grammar accuracy, lexical resource, and cohesive discourse markers.',
    systemStyle: 'Speak like Dr. Priya: encouraging yet rigorous, demonstrating rich vocabulary seamlessly while modeling grammatical precision.'
  }
];

export const SCENARIOS: PracticeScenario[] = [
  {
    id: 'casual_intro',
    title: 'Daily Casual Catch-up',
    category: 'Everyday Talk',
    prompt: 'Chat about how your day went, what you had for lunch, or what movie you watched recently.',
    starterUserText: 'Hi, today I am very busy in my office and worked a lot.',
    iconName: 'Coffee'
  },
  {
    id: 'job_interview',
    title: 'Job Interview Practice',
    category: 'Career & Work',
    prompt: 'Practice answering common interview questions like "Tell me about yourself" or "Why should we hire you?".',
    starterUserText: 'Hello sir, I have completed my engineering and I am searching for software job.',
    iconName: 'Briefcase'
  },
  {
    id: 'cafe_order',
    title: 'Ordering in a Cafe',
    category: 'Travel & Dining',
    prompt: 'Order coffee and breakfast, ask for customizations, and ask for the bill naturally.',
    starterUserText: 'I want one coffee and give me bill please.',
    iconName: 'CupSoda'
  },
  {
    id: 'express_opinion',
    title: 'Sharing Opinions & Debates',
    category: 'Fluency & Nuance',
    prompt: 'Express your thoughts on remote work vs office work or modern technology.',
    starterUserText: 'I think remote work is very good because people is not wasting travel time.',
    iconName: 'MessageSquareShare'
  },
  {
    id: 'tell_story',
    title: 'Telling a Past Story',
    category: 'Storytelling',
    prompt: 'Practice past tense verbs by describing an unforgettable trip or childhood memory.',
    starterUserText: 'Last year I go to mountain with friends and we was enjoy very much.',
    iconName: 'Sparkles'
  }
];
