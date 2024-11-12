import type { Command } from './Command';
import type { GitEntity } from '../gitEntity/GitEntity';
import type { AICProvider } from '../providers';
import { createSpinner } from '../utils/spinner';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

async function copyToClipboard(text: string): Promise<void> {
  const platform = process.platform;
  try {
    if (platform === 'win32') {
      // Windows
      await execAsync(`echo ${text.replace(/[<>]/g, '^$&')} | clip`);
    } else if (platform === 'darwin') {
      // macOS
      await execAsync(`echo "${text.replace(/"/g, '\\"')}" | pbcopy`);
    } else {
      // Linux (requires xclip)
      await execAsync(`echo "${text.replace(/"/g, '\\"')}" | xclip -selection clipboard`);
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
    const spinner = await createSpinner('Generating commit message...');
    spinner.start();

    try {
      if (debug) {
        console.log('Debug: Starting draft command with entity:', this.gitEntity);
        console.log('Debug: Context:', this.context);
      }

      let result = await provider.draft({
        gitEntity: this.gitEntity,
        context: this.context
      });

      // Clean up the message
      result = cleanCommitMessage(result);

      // Remove any trailing newlines before copying
      result = result.replace(/\n+$/, '');

      // Try to copy to clipboard
      await copyToClipboard(result);
      spinner.succeed('Done - Commit message copied to clipboard');
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