import type { AIProvider, ProviderType } from './types';
import type { AIPrompt } from '../AIPrompt';
import { ProviderError, OllamaConnectionError } from '../errors/AICError';

interface OllamaResponse {
  response?: string;
  error?: string;
}

export interface OllamaConfig {
  model: string;
  apiBaseUrl: string;
  maxTokens: number;
}

export class OllamaProvider implements AIProvider {
  constructor(
    private readonly client: typeof fetch,
    private readonly config: OllamaConfig
  ) {}

  static create(model: string, maxTokens = 100): OllamaProvider {
    return new OllamaProvider(fetch, {
      model,
      apiBaseUrl: 'http://localhost:11434/api/generate',
      maxTokens
    });
  }

  async complete(prompt: AIPrompt, stream = false): Promise<string> {
    const payload = {
      model: this.config.model,
      prompt: `${prompt.systemPrompt}\n\n${prompt.userPrompt}`,
      stream,
      max_tokens: this.config.maxTokens
    };

    try {
      const response = await this.client(this.config.apiBaseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const text = await response.text();
        throw new ProviderError(text, response.status);
      }

      if (stream) {
        // Handle streaming response
        const reader = response.body?.getReader();
        let result = '';

        if (!reader) {
          throw new ProviderError('Stream not available');
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            try {
              const json = JSON.parse(chunk);
              if (json.response) {
                result += json.response;
                process.stdout.write(json.response);
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
          return result;
        } finally {
          reader.releaseLock();
        }
      } else {
        const data = await response.json() as OllamaResponse;
        const content = data.response;

        if (!content) {
          throw new ProviderError('No completion choice available');
        }

        return content;
      }
    } catch (error) {
      // Check if the error is a connection refused error
      if (error instanceof Error && 
          (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed'))) {
        throw new OllamaConnectionError();
      }
      throw error;
    }
  }

  getType(): ProviderType {
    return 'ollama';
  }
} 