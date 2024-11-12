import type { Command } from './Command';
import type { AICProvider } from '../providers';
import { createGitCommit } from '../gitEntity/GitCommit';
import { ExplainCommand } from './ExplainCommand';
import { getShaFromFzf } from '../utils/git';

export class ListCommand implements Command {
  async execute(provider: AICProvider): Promise<void> {
    const sha = await getShaFromFzf();
    const commit = await createGitCommit(sha);

    const explainCommand = new ExplainCommand({
      type: 'commit',
      data: commit
    });

    await explainCommand.execute(provider);
  }
} 