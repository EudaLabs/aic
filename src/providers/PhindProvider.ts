import type { AIProvider } from './types';
import type { AIPrompt } from '../AIPrompt';
import { ProviderError } from '../errors/AICError';

interface PhindResponse {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
  error?: string;
}

export interface PhindConfig {
  model: string;
  apiBaseUrl: string;
}

export class PhindProvider implements AIProvider {
  constructor(
    private readonly client: typeof fetch,
    private readonly config: PhindConfig
  ) {}

  static create(model?: string): PhindProvider {
    return new PhindProvider(fetch, {
      model: model ?? 'Phind-70B',
      apiBaseUrl: 'https://https.extension.phind.com/agent/'
    });
  }

  async complete(prompt: AIPrompt): Promise<string> {
    const payload = {
      additional_extension_context: '',
      allow_magic_buttons: true,
      is_vscode_extension: true,
      message_history: [{
        content: prompt.userPrompt,
        role: 'user'
      }],
      requested_model: this.config.model,
      user_input: prompt.userPrompt
    };

    const response = await this.client(this.config.apiBaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': '',
        'Accept': '*/*',
        'Accept-Encoding': 'Identity'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new ProviderError(await response.text(), response.status);
    }

    const text = await response.text();
    const content = this.parseStreamResponse(text);

    if (!content) {
      throw new ProviderError('No completion choice available');
    }

    return content;
  }

  private parseLine(line: string): string | undefined {
    if (!line.startsWith('data: ')) return undefined;
    
    try {
      const data = JSON.parse(line.slice(6));
      return data.choices?.[0]?.delta?.content;
    } catch {
      return undefined;
    }
  }

  private parseStreamResponse(text: string): string {
    return text
      .split('\n')
      .map(line => this.parseLine(line))
      .filter((content): content is string => content !== undefined)
      .join('');
  }
} 