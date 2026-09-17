import { readFileSync } from 'node:fs';

// RS School git convention
const TYPES = ['init', 'feat', 'fix', 'refactor', 'docs', 'style', 'test', 'chore'];
const COMMIT_PATTERN = new RegExp(`^(${TYPES.join('|')})(\\([a-z0-9-]+\\))?: [a-z].{0,70}$`);

const messageFile = process.argv[2];
const firstLine = readFileSync(messageFile, 'utf8').split('\n')[0] ?? '';

if (firstLine.startsWith('Merge ') || COMMIT_PATTERN.test(firstLine)) {
  process.exit(0);
}

process.stderr.write(
  `Invalid commit message: "${firstLine}"\n` +
    `Expected "<type>: <subject>" with type in [${TYPES.join(', ')}], e.g. "feat: add hamburger menu"\n`
);
process.exit(1);
