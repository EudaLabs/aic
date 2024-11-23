import type { Command } from 'commander';

export interface ExplainOptions {
  diff?: boolean;
  staged?: boolean;
  query?: string;
}

export interface DraftOptions {
  context?: string;
}

export type BatchOptions = Record<string, never>;

export type ListOptions = Record<string, never>;

export interface CommandContext {
  cmd: Command;
}

export interface FileChange {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed';
}

export interface ChangeGroup {
  files: FileChange[];
  category: string;
} 