import { execSync } from 'node:child_process';
import { GitDiffError } from '../errors/AICError';

export class GitDiff {
  public readonly staged: boolean;
  public readonly diff: string;

  constructor(staged: boolean) {
    this.staged = staged;
    this.diff = this.getDiff(staged);
  }

  private getDiff(staged: boolean): string {
    const args = staged ? ['diff', '--staged'] : ['diff'];
    
    try {
      const diff = execSync(
        `git -c core.autocrlf=false -c core.safecrlf=false ${args.join(' ')}`,
        { encoding: 'utf-8' }
      );
      if (!diff) {
        throw new GitDiffError(staged);
      }
      return diff;
    } catch (error) {
      if (error instanceof GitDiffError) {
        throw error;
      }
      throw new Error(`Failed to get git diff: ${error}`);
    }
  }
} 