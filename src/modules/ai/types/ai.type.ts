import { GeminiModel } from '@constants/gemini-model.constant';
import { Content } from '@google/genai';

export interface ChatMessage {
  role: 'user' | 'system' | 'assistant';
  content: string;
}

export interface HistoryResultText {
  history: Content[];
  latestMessage: string;
}

export interface ImageGenerationOptions {
  prompt: string;
  model?: string;
}

export interface ChatOptions {
  model?: GeminiModel;
  temperature?: number;
  maxTokens?: number;
}

export interface VisionOptions extends ChatOptions {
  // base64 encoded images hoặc URLs
  images?: string[];
}
