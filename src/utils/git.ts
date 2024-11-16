import { spawn } from 'node:child_process';
import { CommandError } from '../errors/AICError';

export async function getShaFromFzf(): Promise<string> {
  const isWindows = process.platform === 'win32';
  const shell = isWindows ? 'cmd' : 'sh';
  const shellFlag = isWindows ? '/c' : '-c';
  
  const gitLogCommand = "git log --color=always --format='%C(auto)%h%d %s %C(black)%C(bold)%cr'";
  const fzfCommand = "fzf --ansi --reverse --bind='enter:become(echo {1})' --wrap";
  const command = `${gitLogCommand} | ${fzfCommand}`;

  try {
    const process = spawn(shell, [shellFlag, command], {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true
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
          let hint = '';
          if (stderr.includes('fzf: command not found')) {
            hint = '`list` command requires fzf';
          }
          reject(new CommandError(stderr.trim(), hint));
        }
      });

      process.on('error', (error) => {
        if (error.message.includes('ENOENT')) {
          reject(new CommandError('Required command not found', 'Make sure git and fzf are installed and in your PATH'));
        } else {
          reject(error);
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