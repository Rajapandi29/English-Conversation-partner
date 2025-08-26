
import { GoogleGenAI, Type } from "@google/genai";
import { type Message, type AIResponse } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey || apiKey.trim() === '') {
// ...existing code... {
  throw new Error("API_KEY environment variable not set or is empty.");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

const model = "gemini-2.5-flash";

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    correction: {
      type: Type.STRING,
      description: "The corrected version of the user's sentence. Should be null if the sentence is grammatically perfect.",
    },
    explanation: {
      type: Type.STRING,
      description: "A brief, simple explanation of the mistake. If the sentence is perfect, this should be a short, positive encouragement.",
    },
    followUpQuestion: {
      type: Type.STRING,
      description: "A friendly, open-ended question to continue the conversation."
    }
  },
  required: ["explanation", "followUpQuestion"],
};

const createSystemInstruction = (topic: string) => `You are Eva, an expert English language tutor. Your goal is to help a user practice their spoken English.
The current conversation topic is "${topic}".
1.  Analyze the user's most recent response for any grammatical errors, awkward phrasing, or mistakes.
2.  If there are errors, provide a corrected version of their sentence and a brief, simple explanation of the correction. Frame feedback positively.
3.  If their response is grammatically perfect, praise them with a short encouragement. Do not provide a correction if none is needed (correction should be null).
4.  ALWAYS ask a natural, follow-up question that is relevant to the topic of ${topic} to keep the conversation flowing.
5.  Keep all your responses concise and friendly.
6.  Your entire response MUST be in JSON format, adhering to the provided schema.
`;


export const getAIFeedback = async (userTranscript: string, history: Message[], topic: string): Promise<AIResponse> => {
  try {
    const chatHistory = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    // The Gemini API requires the conversation history to start with a 'user' role.
    // If the history starts with a 'model' role (e.g., the initial greeting), we remove it.
    if (chatHistory.length > 0 && chatHistory[0].role === 'model') {
      chatHistory.shift();
    }

    const contents = [
      ...chatHistory,
      { role: 'user', parts: [{ text: userTranscript }] }
    ];

    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: createSystemInstruction(topic),
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.8,
        topP: 0.95,
      }
    });

    const jsonText = response.text.trim();
    // It's already validated by the API to be JSON, so we can parse it.
    const parsedResponse: AIResponse = JSON.parse(jsonText);

    // Ensure correction is null if it's an empty string
    if (parsedResponse.correction === "") {
        parsedResponse.correction = null;
    }
    
    return parsedResponse;

  } catch (error) {
    console.error("Error generating content from Gemini:", error);
    // Provide a fallback response in case of an API error
    return {
      correction: null,
      explanation: "I seem to be having trouble connecting. Let's try that again.",
      followUpQuestion: "Can you please repeat what you said?"
    };
  }
};