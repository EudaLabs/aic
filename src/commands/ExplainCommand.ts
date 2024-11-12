import type { Command } from './Command';
import type { GitEntity } from '../gitEntity/GitEntity';
import type { AICProvider } from '../providers';
import { formatStaticDetails } from '../gitEntity/GitEntity';
import { printWithMdcat } from '../utils/mdcat';
import { createSpinner } from '../utils/spinner';

export class ExplainCommand implements Command {
  constructor(
    private readonly gitEntity: GitEntity,
    private readonly query?: string
  ) {}

  async execute(provider: AICProvider): Promise<void> {
    await printWithMdcat(formatStaticDetails(this.gitEntity));
    
    if (this.query) {
      await printWithMdcat(`\`query\`: ${this.query}`);
    }

    const spinnerText = this.query ? 'Generating answer...' : 'Generating summary...';
    const spinner = await createSpinner(spinnerText);
    spinner.start();
    spinner.stop();

    try {
      await provider.explain({
        gitEntity: this.gitEntity,
        query: this.query
      }, true);
      console.log();
    } catch (error) {
      console.error('\nFailed to generate explanation');
      throw error;
    }
  }
} 