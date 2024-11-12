export class AICError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AICError';
  }
}

export class GitCommitError extends AICError {
  constructor(sha: string) {
    super(`Commit '${sha}' not found`);
    this.name = 'GitCommitError';
  }
}

export class GitDiffError extends AICError {
  constructor(staged: boolean) {
    super(`diff${staged ? ' (staged)' : ''} is empty`);
    this.name = 'GitDiffError';
  }
}

export class CommandError extends AICError {
  constructor(message: string, hint?: string) {
    super(`${message}${hint ? ` (hint: ${hint})` : ''}`);
    this.name = 'CommandError';
  }
}

export class ProviderError extends AICError {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class MissingApiKeyError extends AICError {
  constructor(provider: string) {
    super(`Missing API key for ${provider}, use --api-key or AIC_API_KEY env variable`);
    this.name = 'MissingApiKeyError';
  }
}

export class MissingModelError extends AICError {
  constructor(provider: string) {
    super(`Missing Model for ${provider}, use --model or AIC_MODEL env variable`);
    this.name = 'MissingModelError';
  }
}

export class UnexpectedResponseError extends AICError {
  constructor(message = 'Unexpected response from provider') {
    super(message);
    this.name = 'UnexpectedResponseError';
  }
} 