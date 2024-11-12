import type { GitCommit } from './GitCommit';
import type { GitDiff } from './GitDiff';

export type GitEntity = {
  type: 'commit';
  data: GitCommit;
} | {
  type: 'diff';
  data: GitDiff;
};

export function formatStaticDetails(entity: GitEntity): string {
  switch (entity.type) {
    case 'commit':
      return `# Entity: Commit
\`commit ${entity.data.getHash()}\` | ${entity.data.getAuthor()} <${entity.data.getEmail()}> | ${entity.data.getDate().toISOString()}

${entity.data.getMessage()}
-----
`;
    case 'diff':
      return `# Entity: Diff${entity.data.staged ? ' (staged)' : ''}\n`;
  }
} 