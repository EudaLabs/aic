import type { AIPrompt } from '../AIPrompt';

export interface AIProvider {
  complete(prompt: AIPrompt, stream?: boolean): Promise<string>;
}

export interface ProviderConfig {
  apiKey?: string;
  model?: string;
  apiBaseUrl: string;
}

export type ProviderType = 'openai' | 'phind' | 'groq' | 'claude' | 'ollama';