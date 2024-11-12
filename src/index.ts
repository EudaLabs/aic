#!/usr/bin/env node

import { createCli } from './cli';

async function main() {
  const program = createCli();
  await program.parseAsync(process.argv);
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
}); 