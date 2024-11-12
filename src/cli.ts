import { Command, Option } from 'commander';
import { AICProvider } from './providers';
import type { ProviderType } from './providers/types';
import type { ExplainOptions, DraftOptions, ListOptions, CommandContext } from './commands/types';
import { GitCommit, createGitCommit } from './gitEntity/GitCommit';
import { GitDiff } from './gitEntity/GitDiff';
import { ExplainCommand } from './commands/ExplainCommand';
import { ListCommand } from './commands/ListCommand';
import { DraftCommand } from './commands/DraftCommand';
import { AICError } from './errors/AICError';

interface GlobalOptions {
  provider: ProviderType;
  apiKey?: string;
  model?: string;
  debug?: boolean;
  maxTokens?: string;
}

export function createCli(): Command {
  const program = new Command()
    .name('aic')
    .description('AI-powered CLI tool for git commit summaries')
    .version('1.0.0');

  program
    .addOption(new Option('-p, --provider <type>', 'AI provider to use').env('AIC_AI_PROVIDER').default('phind'))
    .addOption(new Option('-k, --api-key <key>', 'API key for the provider').env('AIC_API_KEY'))
    .addOption(new Option('-m, --model <model>', 'Model to use with the provider').env('AIC_MODEL'))
    .option('--debug', 'Enable debug mode')
    .option('--max-tokens <number>', 'Maximum number of tokens to generate', '100');

  program
    .command('explain')
    .description('Explain the changes in a commit, or the current diff')
    .argument('[sha]', 'The commit hash to use')
    .option('-d, --diff', 'Explain current diff')
    .option('-s, --staged', 'Use staged diff')
    .option('-q, --query <query>', 'Ask a question instead of summary')
    .action(async (sha: string | undefined, options: ExplainOptions, cmd: Command) => {
      const globalOpts = program.opts() as GlobalOptions;
      const provider = AICProvider.create(
        globalOpts.provider as ProviderType,
        globalOpts.apiKey,
        globalOpts.model,
        globalOpts.maxTokens ? Number.parseInt(globalOpts.maxTokens, 10) : undefined
      );

      try {
        if (options.diff) {
          const gitEntity = {
            type: 'diff' as const,
            data: new GitDiff(options.staged ?? false)
          };
          await new ExplainCommand(gitEntity, options.query).execute(provider);
        } else if (sha) {
          const commit = await createGitCommit(sha);
          const gitEntity = {
            type: 'commit' as const,
            data: commit
          };
          await new ExplainCommand(gitEntity, options.query).execute(provider);
        } else {
          console.error('Error: `explain` expects SHA-1 or --diff to be present');
          process.exit(1);
        }
      } catch (error) {
        if (error instanceof AICError) {
          console.error('Error:', error.message);
        } else {
          console.error('Unexpected error:', error);
        }
        process.exit(1);
      }
    });

  program
    .command('list')
    .description('List all commits in an interactive fuzzy-finder, and summarize the changes')
    .action(async (_options: ListOptions, cmd: Command) => {
      const globalOpts = program.opts() as GlobalOptions;
      const provider = AICProvider.create(
        globalOpts.provider as ProviderType,
        globalOpts.apiKey,
        globalOpts.model,
        globalOpts.maxTokens ? Number.parseInt(globalOpts.maxTokens, 10) : undefined
      );

      try {
        await new ListCommand().execute(provider);
      } catch (error) {
        if (error instanceof AICError) {
          console.error('Error:', error.message);
        } else {
          console.error('Unexpected error:', error);
        }
        process.exit(1);
      }
    });

  program
    .command('draft')
    .description('Generate a commit message for the staged changes')
    .option('-c, --context <context>', 'Add context to communicate intent')
    .action(async (options: DraftOptions, cmd: Command) => {
      const globalOpts = program.opts() as GlobalOptions;
      const provider = AICProvider.create(
        globalOpts.provider as ProviderType,
        globalOpts.apiKey,
        globalOpts.model,
        globalOpts.maxTokens ? Number.parseInt(globalOpts.maxTokens, 10) : undefined
      );

      try {
        const gitEntity = {
          type: 'diff' as const,
          data: new GitDiff(true)
        };
        await new DraftCommand(gitEntity, options.context).execute(provider, globalOpts.debug);
      } catch (error) {
        if (error instanceof AICError) {
          console.error('Error:', error.message);
        } else {
          console.error('Unexpected error:', error);
        }
        process.exit(1);
      }
    });

  return program;
} 