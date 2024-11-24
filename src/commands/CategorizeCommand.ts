import type { Command } from './Command';
import type { AICProvider } from '../providers';
import type { GitEntity } from '../gitEntity/GitEntity';
import type { FileChange } from './types';
import type { GitDiff } from '../gitEntity/GitDiff';
import { formatStaticDetails } from '../gitEntity/GitEntity';
import { execSync } from 'node:child_process';
import { GIT_CONFIG, GIT_ENV } from '../utils/git-config';
import { createSpinner } from '../utils/spinner';

interface CategoryGroup {
  category: string;
  files: FileChange[];
}

export class CategorizeCommand implements Command {
  constructor(
    private readonly gitEntity: GitEntity,
    private readonly debug = false
  ) {}

  private getChangedFiles(staged: boolean): FileChange[] {
    const command = staged
      ? `git ${GIT_CONFIG} diff --staged --name-status`
      : `git ${GIT_CONFIG} diff --name-status`;

    const output = execSync(command, { 
      encoding: 'utf-8',
      env: {
        ...process.env,
        ...GIT_ENV
      }
    });
    
    return output
      .split('\n')
      .filter(line => line.length > 0)
      .map(line => {
        const [status, ...pathParts] = line.split('\t');
        const path = pathParts.join('\t');
        
        return {
          path,
          status: this.parseGitStatus(status.trim())
        };
      });
  }

  private parseGitStatus(status: string): 'modified' | 'added' | 'deleted' | 'renamed' {
    if (status.startsWith('A')) return 'added';
    if (status.startsWith('D')) return 'deleted';
    if (status.startsWith('R')) return 'renamed';
    return 'modified';
  }

  async execute(provider: AICProvider): Promise<void> {
    const spinner = await createSpinner('Analyzing changes');
    spinner.start();

    try {
      if (this.debug) {
        spinner.stop();
        console.log('\nDebug: Starting categorization');
        spinner.start();
      }

      spinner.text = 'Categorizing changes';
      
      const changes = this.getChangedFiles(
        this.gitEntity.type === 'diff' && (this.gitEntity.data as GitDiff).staged
      );

      if (this.debug) {
        spinner.stop();
        console.log('\nDebug: Changed files:', JSON.stringify(changes, null, 2));
        spinner.start();
      }

      const result = await provider.categorizeFiles(changes);

      if (this.debug) {
        spinner.stop();
        console.log('\nDebug: Raw AI response:', result);
        spinner.start();
      }

      // Clean and parse the JSON response
      const cleanResult = result
        .replace(/```json\s*/g, '')
        .replace(/```\s*$/g, '')
        .replace(/^json\s*/g, '')
        .replace(/^\s*\[\s*/, '[')
        .replace(/\s*\]\s*$/, ']')
        .replace(/\]\s*[^[\]]*$/, ']')
        .trim();

      if (this.debug) {
        spinner.stop();
        console.log('\nDebug: Cleaned response:', cleanResult);
        spinner.start();
      }

      let parsedResult: CategoryGroup[];
      try {
        parsedResult = JSON.parse(cleanResult);
      } catch (parseError) {
        if (this.debug) {
          console.error('\nDebug: JSON parse error:', parseError);
          console.error('Debug: Failed to parse:', cleanResult);
        }
        throw new Error('Failed to parse AI response');
      }

      spinner.succeed('Changes categorized');
      console.log('\nSuggested file categorization:');
      
      for (const group of parsedResult) {
        console.log(`\n${group.category}:`);
        for (const file of group.files) {
          const statusSymbol = file.status === 'added' ? '+ ' 
            : file.status === 'deleted' ? '- '
            : file.status === 'renamed' ? '~ '
            : '• ';
          console.log(`  ${statusSymbol}${file.path}`);
        }
      }
    } catch (error) {
      spinner.fail('Failed to categorize changes');
      if (error instanceof Error) {
        console.error('\nError:', error.message);
      }
      throw error;
    }
  }
} 