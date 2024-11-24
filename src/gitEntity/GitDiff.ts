import { execSync } from 'node:child_process';
import { GitDiffError } from '../errors/AICError';
import { GIT_CONFIG, GIT_ENV } from '../utils/git-config';

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
      const command = `git ${GIT_CONFIG} ${args.join(' ')}`;
      
      if (process.env.DEBUG) {
        console.log('\nDebug: Executing git command:', command);
      }

      const diff = execSync(command, { 
        encoding: 'utf-8',
        env: {
          ...process.env,
          ...GIT_ENV
        }
      });

      if (process.env.DEBUG) {
        console.log('\nDebug: Git diff output length:', diff.length);
        console.log('Debug: First 100 characters of diff:', diff.substring(0, 100));
      }

      if (!diff) {
        if (process.env.DEBUG) {
          console.log('Debug: No diff found');
          const stagedFiles = execSync('git -c core.autocrlf=false -c core.safecrlf=false diff --staged --name-only', { encoding: 'utf-8' });
          console.log('Debug: Staged files:', stagedFiles || 'None');
        }
        throw new GitDiffError(staged);
      }

      return diff;
    } catch (error) {
      if (process.env.DEBUG) {
        console.error('Debug: Error getting diff:', error);
      }
      if (error instanceof GitDiffError) {
        throw error;
      }
      throw new Error(`Failed to get git diff: ${error}`);
    }
  }
} 