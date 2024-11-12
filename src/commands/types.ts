import type { Command } from 'commander';

export interface ExplainOptions {
  diff?: boolean;
  staged?: boolean;
  query?: string;
}

export interface DraftOptions {
  context?: string;
}

export type ListOptions = Record<string, never>;

export interface CommandContext {
  cmd: Command;
} 