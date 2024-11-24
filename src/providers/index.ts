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
      'You are an AI assistant that explains code changes clearly and concisely.\n' +
      'Analyze the changes and provide a detailed explanation of:\n' +
      '1. What files were modified\n' +
      '2. What changes were made\n' +
      '3. The purpose of these changes\n' +
      '4. Any potential impact on the codebase',
      command.query ?? JSON.stringify(command.gitEntity)
    );
    
    return this.provider.complete(prompt, stream);
  }

  async categorizeFiles(changes: FileChange[]): Promise<string> {
    const prompt = new AIPrompt(
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
      '13. IMPORTANT: ALL files must be included in the response\n' +
      '14. If a file doesn\'t fit existing categories, create a new appropriate category\n' +
      '15. Use specific categories like:\n' +
      '    - "commands" for command implementations\n' +
      '    - "core" for core functionality\n' +
      '    - "providers" for provider implementations\n' +
      '    - "utils" for utility functions\n' +
      '    - "config" for configuration files\n' +
      '    - "types" for type definitions\n' +
      '    - "git" for git-related functionality\n' +
      '16. Every file MUST be categorized\n' +
      '17. Empty categories should be omitted',

      `Categorize ALL of these files into logical groups:
${JSON.stringify(changes, null, 2)}

RESPOND ONLY WITH A JSON ARRAY IN THIS EXACT FORMAT:
[
  {
    "category": "commands",
    "files": [
      {"path": "src/commands/BatchCommand.ts", "status": "modified"},
      {"path": "src/commands/DraftCommand.ts", "status": "modified"}
    ]
  },
  {
    "category": "providers",
    "files": [
      {"path": "src/providers/index.ts", "status": "modified"}
    ]
  }
]

IMPORTANT:
1. Include ALL files in the response
2. Create appropriate categories if needed
3. NO empty categories
4. Every file must be in exactly one category
5. Use the example categories or create similar ones
6. Use "category" NOT "purpose"
7. Each file must be a full object with path and status
8. NO backticks, NO json keyword
9. NO shorthand array syntax like ["file1", "file2"]
10. Output raw JSON only
11. Use specific categories based on functionality
12. Separate services, providers, APIs, and configurations
13. Every file must be in exactly one category
14. Every file must have both path and status properties
`
    );

    return this.provider.complete(prompt);
  }

  async draft(command: DraftCommand): Promise<string> {
    const prompt = AIPrompt.buildDraftPrompt(command);
    return this.provider.complete(prompt, false);
  }
}

export type { ProviderType, AIProvider };
export * from './types';