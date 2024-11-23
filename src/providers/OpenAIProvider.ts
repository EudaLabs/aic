import type { AIProvider, ProviderType } from './types';
import type { AIPrompt } from '../AIPrompt';
import { ProviderError } from '../errors/AICError';

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  apiBaseUrl: string;
}

export class OpenAIProvider implements AIProvider {
  constructor(
    private readonly client: typeof fetch,
    private readonly config: OpenAIConfig
  ) {}

  static create(apiKey: string, model?: string): OpenAIProvider {
    return new OpenAIProvider(fetch, {
      apiKey,
      model: model ?? 'gpt-4-turbo-preview',
      apiBaseUrl: 'https://api.openai.com/v1/chat/completions'
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
      const error = await response.json() as OpenAIResponse;
      throw new ProviderError(
        error.error?.message ?? 'Unknown error',
        response.status
      );
    }

    const data = await response.json() as OpenAIResponse;
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new ProviderError('No completion choice available');
    }

    return content;
  }

  getType(): ProviderType {
    return 'openai';
  }
} 