import { spawn } from 'node:child_process';
import { CommandError } from '../errors/AICError';

export async function getShaFromFzf(): Promise<string> {
  const command = "git log --color=always --format='%C(auto)%h%d %s %C(black)%C(bold)%cr' | fzf --ansi --reverse --bind='enter:become(echo {1})' --wrap";

  try {
    const process = spawn('sh', ['-c', command], {
      stdio: ['inherit', 'pipe', 'pipe']
    });

    const output = await new Promise<string>((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          let hint: string | undefined;
          if (stderr.includes('fzf: command not found')) {
            hint = '`list` command requires fzf';
          }
          reject(new CommandError(stderr.trim(), hint));
        }
      });
    });

    return output;
  } catch (error) {
    if (error instanceof CommandError) {
      throw error;
    }
    throw new CommandError(`Failed to get commit SHA: ${error}`);
  }
} 