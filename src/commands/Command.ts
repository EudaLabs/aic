import type { AICProvider } from '../providers';

export interface Command {
  execute(provider: AICProvider): Promise<void>;
} 