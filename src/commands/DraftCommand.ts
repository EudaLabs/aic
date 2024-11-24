import type { Command } from './Command';
import type { GitEntity } from '../gitEntity/GitEntity';
import type { AICProvider } from '../providers';
import { createSpinner } from '../utils/spinner';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { GIT_CONFIG, GIT_ENV } from '../utils/git-config';

const execAsync = promisify(exec);

async function copyToClipboard(text: string): Promise<void> {
  const platform = process.platform;
  try {
    if (platform === 'win32') {
      // Windows
      await execAsync(`echo ${text.replace(/[<>]/g, '^$&')} | clip`, {
        env: {
          ...process.env,
          ...GIT_ENV
        }
      });
    } else if (platform === 'darwin') {
      // macOS
      await execAsync(`echo "${text.replace(/"/g, '\\"')}" | pbcopy`, {
        env: {
          ...process.env,
          ...GIT_ENV
        }
      });
    } else {
      // Linux (requires xclip)
      await execAsync(`echo "${text.replace(/"/g, '\\"')}" | xclip -selection clipboard`, {
        env: {
          ...process.env,
          ...GIT_ENV
        }
      });
    }
    return;
  } catch (error) {
    console.warn('Warning: Could not copy to clipboard');
  }
}

function cleanCommitMessage(message: string): string {
  return message
    .split('\n')[0] // Get first line only
    .trim()
    .replace(/[*_#`]/g, '') // Remove markdown characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

export class DraftCommand implements Command {
  constructor(
    private readonly gitEntity: GitEntity,
    private readonly context?: string
  ) {}

  async execute(provider: AICProvider, debug = false): Promise<void> {
    const spinner = await createSpinner('Analyzing changes');
    spinner.start();

    try {
      if (debug) {
        spinner.stop();
        console.log('Debug: Starting draft command with entity:', this.gitEntity);
        console.log('Debug: Context:', this.context);
        spinner.start();
      }

      spinner.text = 'Generating commit message';
      let result = await provider.draft({
        gitEntity: this.gitEntity,
        context: this.context
      });

      // Clean up the message
      spinner.text = 'Processing commit message';
      result = cleanCommitMessage(result);

      // Remove any trailing newlines before copying
      result = result.replace(/\n+$/, '');

      // Try to copy to clipboard
      spinner.text = 'Copying to clipboard';
      await copyToClipboard(result);
      
      spinner.succeed('✨ Commit message copied to clipboard');
      console.log(`\n${result}`);
    } catch (error) {
      spinner.fail('Failed to generate commit message');
      if (debug) {
        console.error('Debug: Error during draft command:', error);
      }
      throw error;
    }
  }
} 