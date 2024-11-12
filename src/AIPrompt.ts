import type { GitEntity } from './gitEntity/GitEntity';

export interface ExplainCommand {
  gitEntity: GitEntity;
  query?: string;
}

export interface DraftCommand {
  gitEntity: GitEntity;
  context?: string;
}

export class AIPrompt {
  constructor(
    public readonly systemPrompt: string,
    public readonly userPrompt: string
  ) {}

  static buildExplainPrompt(command: ExplainCommand): AIPrompt {
    const systemPrompt = 
      'You are a helpful assistant that explains Git changes in a concise way. ' +
      'Focus only on the most significant changes and their direct impact. ' +
      'When answering specific questions, address them directly and precisely. ' +
      'Keep explanations brief but informative and don\'t ask for further explanations. ' +
      'Use markdown for clarity.';

    let baseContent: string;
    if (command.gitEntity.type === 'commit') {
      baseContent = `Context - Commit:

Message: ${command.gitEntity.data.getMessage()}
Changes:
\`\`\`diff
${command.gitEntity.data.getDiff()}
\`\`\``;
    } else {
      baseContent = `Context - Changes:

\`\`\`diff
${command.gitEntity.data.diff}
\`\`\``;
    }

    const userPrompt = command.query 
      ? `${baseContent}\n\nQuestion: ${command.query}\nProvide a focused answer to the question based on the changes shown above.`
      : `${baseContent}\n\nProvide a short explanation covering:\n1. Core changes made\n2. Direct impact`;

    return new AIPrompt(systemPrompt, userPrompt);
  }

  static buildDraftPrompt(command: DraftCommand): AIPrompt {
    if (command.gitEntity.type !== 'diff') {
      throw new Error('`draft` is only supported for diffs');
    }

    const systemPrompt = 
      'You are a git commit message generator. Your task is to generate a SINGLE conventional commit message.\n' +
      'Rules:\n' +
      '1. Generate ONLY ONE commit message\n' +
      '2. Use present tense\n' +
      '3. Follow format: <type>(<optional scope>): <description>\n' +
      '4. Keep under 72 characters\n' +
      '5. NO explanations, NO comments, NO additional text\n' +
      '6. If multiple changes are present, choose the most significant one\n' +
      '7. Your entire response should be just one line of text\n' +
      '8. NO markdown formatting (no **, __, #, etc.)\n' +
      '9. NO special characters except those in the format\n' +
      '10. Output raw text only';

    const conventionalTypes = {
      feat: "A new feature",
      fix: "A bug fix",
      docs: "Documentation only changes",
      style: "Changes that do not affect the meaning of the code",
      refactor: "A code change that neither fixes a bug nor adds a feature",
      perf: "A code change that improves performance",
      test: "Adding missing tests or correcting existing tests",
      build: "Changes that affect the build system or external dependencies",
      ci: "Changes to our CI configuration files and scripts",
      chore: "Other changes that don't modify src or test files",
      revert: "Reverts a previous commit"
    };

    const context = command.context 
      ? `Intent context: ${command.context}\n`
      : '';

    const userPrompt = `${context}
Generate a SINGLE commit message for the following changes:

\`\`\`diff
${command.gitEntity.data.diff}
\`\`\`

Available types: ${Object.keys(conventionalTypes).join(', ')}

Remember:
- Output ONLY ONE commit message
- Format: <type>(<optional scope>): <description>
- 72 characters maximum
- If multiple changes, focus on the most significant one
- NO markdown formatting (no **, __, #, etc.)
- NO special characters except those in the format
- Output raw text only
- Your entire response should be a single line`;

    return new AIPrompt(systemPrompt, userPrompt);
  }
} 