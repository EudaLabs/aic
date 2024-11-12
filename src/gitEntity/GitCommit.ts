import { execSync } from 'node:child_process';
import { GitCommitError } from '../errors/AICError';

export interface GitCommitData {
  hash: string;
  author: string;
  email: string;
  date: Date;
  message: string;
  parentHashes: string[];
}

export class GitCommit {
  private hash: string;
  private author: string;
  private email: string;
  private date: Date;
  private message: string;
  private parentHashes: string[];
  private diff?: string;

  constructor(data: GitCommitData) {
    this.hash = data.hash;
    this.author = data.author;
    this.email = data.email;
    this.date = data.date;
    this.message = data.message;
    this.parentHashes = data.parentHashes;
  }

  public getHash(): string {
    return this.hash;
  }

  public getAuthor(): string {
    return this.author;
  }

  public getEmail(): string {
    return this.email;
  }

  public getDate(): Date {
    return this.date;
  }

  public getMessage(): string {
    return this.message;
  }

  public getParentHashes(): string[] {
    return [...this.parentHashes];
  }

  public getDiff(): string {
    if (!this.diff) {
      this.diff = this.loadDiff();
    }
    return this.diff;
  }

  private loadDiff(): string {
    try {
      const output = execSync(
        `git diff-tree -p --binary --no-color --compact-summary ${this.hash}`,
        { encoding: 'utf-8' }
      );
      if (!output) {
        throw new GitCommitError(this.hash);
      }
      return output;
    } catch (error) {
      throw new GitCommitError(this.hash);
    }
  }

  public toString(): string {
    return `Commit ${this.hash}
Author: ${this.author} <${this.email}>
Date: ${this.date.toISOString()}

${this.message}`;
  }
}

// Factory function instead of static methods
export async function createGitCommit(sha: string): Promise<GitCommit> {
  const isValidCommit = async (sha: string): Promise<void> => {
    try {
      const output = execSync(`git cat-file -t ${sha}`, { encoding: 'utf-8' });
      if (output.trim() !== 'commit') {
        throw new GitCommitError(sha);
      }
    } catch (error) {
      throw new GitCommitError(sha);
    }
  };

  const getFullHash = async (sha: string): Promise<string> => {
    const output = execSync(`git rev-parse ${sha}`, { encoding: 'utf-8' });
    return output.trim();
  };

  const getMessage = async (sha: string): Promise<string> => {
    const output = execSync(
      `git log --format=%B -n 1 ${sha}`,
      { encoding: 'utf-8' }
    );
    return output.trim();
  };

  const getAuthorName = async (sha: string): Promise<string> => {
    const output = execSync(
      `git log --format=%an -n 1 ${sha}`,
      { encoding: 'utf-8' }
    );
    return output.trim();
  };

  const getAuthorEmail = async (sha: string): Promise<string> => {
    const output = execSync(
      `git log --format=%ae -n 1 ${sha}`,
      { encoding: 'utf-8' }
    );
    return output.trim();
  };

  const getDate = async (sha: string): Promise<string> => {
    const output = execSync(
      `git log --format=%cd --date=format:%Y-%m-%d %H:%M:%S -n 1 ${sha}`,
      { encoding: 'utf-8' }
    );
    return output.trim();
  };

  await isValidCommit(sha);
  
  return new GitCommit({
    hash: await getFullHash(sha),
    author: await getAuthorName(sha),
    email: await getAuthorEmail(sha),
    date: new Date(await getDate(sha)),
    message: await getMessage(sha),
    parentHashes: [], // TODO: Implement if needed
  });
} 