import type { AIPrompt } from '../AIPrompt';

export type ProviderType = 'openai' | 'claude' | 'groq' | 'phind' | 'ollama';

export interface AIProvider {
  complete(prompt: AIPrompt, stream?: boolean): Promise<string>;
  getType(): ProviderType;
}

export interface ProviderConfig {
  apiKey?: string;
  model?: string;
  apiBaseUrl: string;
}