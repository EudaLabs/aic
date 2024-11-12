import type { AIProvider } from './types';
import type { AIPrompt } from '../AIPrompt';
import { ProviderError } from '../errors/AICError';

interface ClaudeResponse {
  content?: Array<{
    text?: string;
  }>;
  error?: {
    message?: string;
  };
}

export interface ClaudeConfig {
  apiKey: string;
  model: string;
  apiBaseUrl: string;
}

export class ClaudeProvider implements AIProvider {
  constructor(
    private readonly client: typeof fetch,
    private readonly config: ClaudeConfig
  ) {}

  static create(apiKey: string, model?: string): ClaudeProvider {
    return new ClaudeProvider(fetch, {
      apiKey,
      model: model ?? 'claude-3-sonnet-20240229',
      apiBaseUrl: 'https://api.anthropic.com/v1/messages'
    });
  }

  async complete(prompt: AIPrompt): Promise<string> {
    const payload = {
      model: this.config.model,
      max_tokens: 4096,
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
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json() as ClaudeResponse;
      throw new ProviderError(
        error.error?.message ?? 'Unknown error',
        response.status
      );
    }

    const data = await response.json() as ClaudeResponse;
    const content = data.content?.[0]?.text;
    
    if (!content) {
      throw new ProviderError('No completion choice available');
    }

    return content;
  }
} 