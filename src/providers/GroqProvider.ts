import type { AIProvider, ProviderType } from './types';
import type { AIPrompt } from '../AIPrompt';
import { ProviderError } from '../errors/AICError';

interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

export interface GroqConfig {
  apiKey: string;
  model: string;
  apiBaseUrl: string;
}

export class GroqProvider implements AIProvider {
  constructor(
    private readonly client: typeof fetch,
    private readonly config: GroqConfig
  ) {}

  static create(apiKey: string, model?: string): GroqProvider {
    return new GroqProvider(fetch, {
      apiKey,
      model: model ?? 'mixtral-8x7b-32768',
      apiBaseUrl: 'https://api.groq.com/openai/v1/chat/completions'
    });
  }

  async complete(prompt: AIPrompt): Promise<string> {
    const payload = {
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content: prompt.systemPrompt
        },
        {
          role: 'user',
          content: prompt.userPrompt
        }
      ]
    };

    const response = await this.client(this.config.apiBaseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json() as GroqResponse;
      throw new ProviderError(
        error.error?.message ?? 'Unknown error',
        response.status
      );
    }

    const data = await response.json() as GroqResponse;
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new ProviderError('No completion choice available');
    }

    return content;
  }

  getType(): ProviderType {
    return 'groq';
  }
} 