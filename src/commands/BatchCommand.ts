import type { Command } from './Command';
import type { AICProvider } from '../providers';
import type { FileChange, ChangeGroup } from './types';
import { AIPrompt } from '../AIPrompt';
import { execSync } from 'node:child_process';
import { createSpinner } from '../utils/spinner';
import { GitDiff } from '../gitEntity/GitDiff';
import { DraftCommand } from './DraftCommand';
import { AICError } from '../errors/AICError';
import { setTimeout } from 'node:timers/promises';
import { GIT_CONFIG, GIT_ENV } from '../utils/git-config';
import { existsSync } from 'node:fs';

export class BatchCommand implements Command {
  private processedFiles: Set<string> = new Set();
  private readonly MAX_RETRIES = 3;

  constructor(
    private readonly provider: AICProvider,
    private readonly debug = false
  ) {}

  private getActualChangedFiles(): FileChange[] {
    try {
      // Get list of changed files using git status
      const command = `git ${GIT_CONFIG} status --porcelain`;
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
          const status = line.substring(0, 2);
          const path = line.substring(3);
          
          // Only include files that actually exist
          if (!existsSync(path) && !status.includes('D')) { // Allow deleted files
            if (this.debug) {
              console.log(`Debug: Skipping non-existent file: ${path}`);
            }
            return null;
          }

          return {
            path,
            status: this.parseGitStatus(status.trim())
          };
        })
        .filter((file): file is FileChange => file !== null);
    } catch (error) {
      if (this.debug) {
        console.error('Debug: Error getting changed files:', error);
      }
      throw new Error('Failed to get list of changed files');
    }
  }

  private parseGitStatus(status: string): 'modified' | 'added' | 'deleted' | 'renamed' {
    if (status.includes('A')) return 'added';
    if (status.includes('D')) return 'deleted';
    if (status.includes('R')) return 'renamed';
    return 'modified';
  }

  private async categorizeChangesWithAI(changes: FileChange[]): Promise<ChangeGroup[]> {
    let attempts = 0;
    
    while (attempts < this.MAX_RETRIES) {
      attempts++;
      
      if (this.debug && attempts > 1) {
        console.log(`\nDebug: Retry attempt ${attempts} of ${this.MAX_RETRIES}`);
      }

      try {
        const response = await this.provider.categorizeFiles(changes);

        if (this.debug) {
          console.log('\nDebug: Received AI response:');
          console.log(response);
        }

        // Clean the response
        const cleanResponse = response
          .replace(/```json\s*/g, '')
          .replace(/```\s*$/g, '')
          .replace(/^json\s*/g, '')
          .trim();

        const jsonMatch = cleanResponse.match(/\[\s*{[\s\S]*}\s*\]/);
        if (!jsonMatch) {
          throw new Error('No JSON array found in response');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Validate the response format
        if (!Array.isArray(parsed) || !parsed.every(group => 
          group.category && 
          Array.isArray(group.files) && 
          group.files.every((file: unknown) => 
            typeof file === 'object' && 
            file !== null &&
            'path' in file && 
            'status' in file
          )
        )) {
          throw new Error('Invalid response format');
        }

        return parsed;
      } catch (error) {
        if (this.debug) {
          console.error(`\nDebug: Attempt ${attempts} failed:`);
          console.error(error);
        }

        if (attempts === this.MAX_RETRIES) {
          throw new AICError('Failed to get proper response format after maximum retries. Please try again.');
        }

        // Wait a bit before retrying
        await setTimeout(1000);
      }
    }

    throw new AICError('Unexpected error in categorization');
  }

  private groupChangesByDirectory(changes: FileChange[]): ChangeGroup[] {
    const groups: Map<string, FileChange[]> = new Map();

    for (const change of changes) {
      const directory = change.path.split('/')[0];
      if (!groups.has(directory)) {
        groups.set(directory, []);
      }
      groups.get(directory)?.push(change);
    }

    return Array.from(groups.entries()).map(([category, files]) => ({
      category,
      files
    }));
  }

  private async executeGitCommand(command: string, timeout = 5000): Promise<string> {
    try {
      return execSync(command, {
        encoding: 'utf-8',
        timeout,
        env: {
          ...process.env,
          ...GIT_ENV
        }
      });
    } catch (error) {
      if (this.debug) {
        console.error(`Debug: Git command failed: ${command}`);
        console.error(error);
      }
      
      if (error instanceof Error) {
        // Check for specific GPG errors
        if (error.message.includes('gpg: waiting for lock')) {
          throw new Error('Git signing is enabled but GPG agent is not responding. Try running without commit signing.');
        }
        throw new Error(`Git operation failed: ${error.message}`);
      }
      
      throw new Error('Git operation failed: Unknown error');
    }
  }

  async execute(): Promise<void> {
    if (this.provider.getType() === 'phind') {
      throw new AICError('Batch command is not available with Phind provider due to API limitations');
    }

    const mainSpinner = await createSpinner('Analyzing changes');
    mainSpinner.start();

    try {
      const actualChanges = this.getActualChangedFiles();
      
      if (actualChanges.length === 0) {
        mainSpinner.fail('No changes found');
        return;
      }

      if (this.debug) {
        mainSpinner.stop();
        console.log('\nDebug: Actual changed files:', actualChanges);
        mainSpinner.start();
      }

      mainSpinner.text = 'Categorizing changes';
      const groups = await this.categorizeChangesWithAI(actualChanges);
      mainSpinner.succeed(`Found ${groups.length} groups of changes`);

      // Process each group
      for (const group of groups) {
        // Skip empty groups
        if (group.files.length === 0) {
          if (this.debug) {
            console.log(`\nDebug: Skipping ${group.category} - no files`);
          }
          continue;
        }

        // Skip if all files in this group have been processed
        if (group.files.every(file => this.processedFiles.has(file.path))) {
          if (this.debug) {
            console.log(`\nDebug: Skipping ${group.category} - files already processed`);
          }
          continue;
        }

        const groupSpinner = await createSpinner(`Processing ${group.category}...`);
        groupSpinner.start();

        try {
          // Get unprocessed files
          const unprocessedFiles = group.files.filter(file => !this.processedFiles.has(file.path));

          // First reset any staged changes
          await this.executeGitCommand(`git ${GIT_CONFIG} reset`);

          // Stage files for this group
          for (const file of unprocessedFiles) {
            groupSpinner.text = `Staging ${file.path}`;
            await this.executeGitCommand(
              `git ${GIT_CONFIG} add "${file.path}"`,
              10000
            );
            this.processedFiles.add(file.path);
          }

          // Verify we have staged changes
          const stagedDiff = await this.executeGitCommand(`git ${GIT_CONFIG} diff --staged`);
          if (!stagedDiff) {
            if (this.debug) {
              console.log(`\nDebug: No staged changes for ${group.category}, skipping`);
            }
            groupSpinner.stop();
            continue;
          }

          // Get commit message for staged changes
          groupSpinner.text = 'Generating commit message';
          const result = await this.provider.draft({
            gitEntity: {
              type: 'diff' as const,
              data: new GitDiff(true)
            },
            context: `Category: ${group.category}\nFiles: ${unprocessedFiles.map(f => f.path).join(', ')}`
          });

          // Create commit
          groupSpinner.text = 'Creating commit';
          await this.executeGitCommand(
            `git ${GIT_CONFIG} commit --no-gpg-sign -m "${result.replace(/"/g, '\\"')}"`,
            15000
          );
          
          groupSpinner.succeed(`Committed changes in ${group.category}`);
        } catch (error) {
          groupSpinner.fail(`Failed to process ${group.category}`);
          if (this.debug) {
            console.error('Debug: Group processing error:', error);
          }
          throw error;
        }
      }

      console.log('\n✨ All changes have been committed successfully!');
    } catch (error) {
      mainSpinner.fail('Failed to process changes');
      if (error instanceof Error) {
        console.error('\nError:', error.message);
      }
      throw error;
    }
  }
} 