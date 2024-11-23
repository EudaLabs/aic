import type { AIProvider, ProviderType } from './types';
import type { ExplainCommand, DraftCommand } from '../AIPrompt';
import type { FileChange } from '../commands/types';
import { OpenAIProvider } from './OpenAIProvider';
import { ClaudeProvider } from './ClaudeProvider';
import { OllamaProvider } from './OllamaProvider';
import { PhindProvider } from './PhindProvider';
import { GroqProvider } from './GroqProvider';
import { AIPrompt } from '../AIPrompt';
import { MissingApiKeyError, MissingModelError } from '../errors/AICError';

export class AICProvider {
  private provider: AIProvider;
  private type: ProviderType;

  private constructor(provider: AIProvider, type: ProviderType) {
    this.provider = provider;
    this.type = type;
  }

  getType(): ProviderType {
    return this.type;
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
        return new AICProvider(OpenAIProvider.create(apiKey, model), providerType);
      
      case 'claude':
        if (!apiKey) throw new MissingApiKeyError('Claude');
        return new AICProvider(ClaudeProvider.create(apiKey, model), providerType);
      
      case 'ollama':
        if (!model) throw new MissingModelError('Ollama');
        return new AICProvider(OllamaProvider.create(model, maxTokens), providerType);

      case 'phind':
        return new AICProvider(PhindProvider.create(model), providerType);

      case 'groq':
        if (!apiKey) throw new MissingApiKeyError('Groq');
        return new AICProvider(GroqProvider.create(apiKey, model), providerType);
      
      default:
        throw new Error(`Unknown provider type: ${providerType}`);
    }
  }

  async explain(command: ExplainCommand, stream = false): Promise<string> {
    const prompt = new AIPrompt(
      'You are an AI assistant that explains code changes clearly and concisely.',
      command.query ?? JSON.stringify(command)
    );
    return this.provider.complete(prompt, stream);
  }

  async categorizeFiles(changes: FileChange[]): Promise<string> {
    const systemPrompt = 
      'You are a code change categorizer. Your ONLY task is to output a JSON array grouping related files.\n' +
      'Rules:\n' +
      '1. Output ONLY the JSON array, nothing else\n' +
      '2. NO explanations\n' +
      '3. NO markdown\n' +
      '4. NO comments\n' +
      '5. NO backticks\n' +
      '6. NO json keyword\n' +
      '7. Response MUST start with [ and end with ]\n' +
      '8. Use "category" NOT "purpose"\n' +
      '9. Each file must have path and status\n' +
      '10. NO additional text or formatting\n' +
      '11. Files array must contain full objects\n' +
      '12. NO shorthand array syntax\n' +
      '13. Use specific categories like:\n' +
      '    - "api-endpoints" for API-related files\n' +
      '    - "ai-providers" for AI provider implementations\n' +
      '    - "core-services" for main service files\n' +
      '    - "type-definitions" for type files\n' +
      '    - "project-config" for configuration files\n' +
      '    - "documentation" for docs and README\n' +
      '    - "database-services" for DB-related files\n' +
      '    - "utilities" for helper functions\n' +
      '14. Group files by their specific functionality';

    const userPrompt = `Categorize these files into specific logical groups:
${JSON.stringify(changes, null, 2)}

RESPOND ONLY WITH A JSON ARRAY IN THIS EXACT FORMAT:
[
  {
    "category": "documentation",
    "files": [
      {"path": "README.md", "status": "modified"}
    ]
  },
  {
    "category": "project-config",
    "files": [
      {"path": "package.json", "status": "modified"},
      {"path": ".env.example", "status": "modified"}
    ]
  }
]

IMPORTANT:
1. Use "category" NOT "purpose"
2. Each file must be a full object with path and status
3. NO backticks, NO json keyword
4. NO shorthand array syntax like ["file1", "file2"]
5. Output raw JSON only
6. Use specific categories based on functionality
7. Separate services, providers, APIs, and configurations
8. Every file must be in exactly one category
9. Every file must have both path and status properties`;

    const prompt = new AIPrompt(systemPrompt, userPrompt);
    return this.provider.complete(prompt);
  }

  async draft(command: DraftCommand): Promise<string> {
    const prompt = AIPrompt.buildDraftPrompt(command);
    return this.provider.complete(prompt, false);
  }
}

export type { ProviderType, AIProvider };
export * from './types';