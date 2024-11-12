import type { AIProvider, ProviderType } from './types';
import type { ExplainCommand, DraftCommand } from '../AIPrompt';
import { OpenAIProvider } from './OpenAIProvider';
import { ClaudeProvider } from './ClaudeProvider';
import { OllamaProvider } from './OllamaProvider';
import { PhindProvider } from './PhindProvider';
import { GroqProvider } from './GroqProvider';
import { AIPrompt } from '../AIPrompt';
import { MissingApiKeyError, MissingModelError } from '../errors/AICError';

export class AICProvider {
  private provider: AIProvider;

  private constructor(provider: AIProvider) {
    this.provider = provider;
  }

  static create(
    providerType: ProviderType,
    apiKey?: string,
    model?: string,
    maxTokens?: number
  ): AICProvider {
    switch (providerType) {
      case 'openai':
        if (!apiKey) throw new MissingApiKeyError('OpenAI');
        return new AICProvider(OpenAIProvider.create(apiKey, model));
      
      case 'claude':
        if (!apiKey) throw new MissingApiKeyError('Claude');
        return new AICProvider(ClaudeProvider.create(apiKey, model));
      
      case 'ollama':
        if (!model) throw new MissingModelError('Ollama');
        return new AICProvider(OllamaProvider.create(model, maxTokens));

      case 'phind':
        return new AICProvider(PhindProvider.create(model));

      case 'groq':
        if (!apiKey) throw new MissingApiKeyError('Groq');
        return new AICProvider(GroqProvider.create(apiKey, model));
      
      default:
        throw new Error(`Unknown provider type: ${providerType}`);
    }
  }

  async explain(command: ExplainCommand, stream = false): Promise<string> {
    const prompt = AIPrompt.buildExplainPrompt(command);
    return this.provider.complete(prompt, stream);
  }

  async draft(command: DraftCommand): Promise<string> {
    const prompt = AIPrompt.buildDraftPrompt(command);
    return this.provider.complete(prompt, false);
  }
}

export type { ProviderType, AIProvider };
export * from './types';