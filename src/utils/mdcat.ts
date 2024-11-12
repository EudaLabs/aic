import { spawn } from 'node:child_process';

export async function printWithMdcat(content: string): Promise<void> {
  try {
    const mdcat = spawn('mdcat', [], {
      stdio: ['pipe', 'inherit', 'inherit']
    });

    mdcat.stdin.write(content);
    mdcat.stdin.end();

    await new Promise<void>((resolve, reject) => {
      mdcat.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`mdcat exited with code ${code}`));
        }
      });
      mdcat.on('error', (error) => reject(new Error(`mdcat failed: ${error.message}`)));
    });
  } catch (error) {
    // Fallback to console.log if mdcat is not available
    if (error instanceof Error && error.message.includes('ENOENT')) {
      console.log(content);
    } else {
      console.error('Warning: mdcat failed, falling back to plain text');
      console.log(content);
    }
  }
} 