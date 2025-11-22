#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';

const file = process.argv[2];
if (!file) {
  console.error('Usage: fix-tasks.js <file>');
  process.exit(1);
}

const content = readFileSync(file, 'utf8');

// Split on task markers (A1., B2., etc.) and rejoin with newlines
const fixed = content.replace(/([A-Z]\d+\.)/g, '\n$1');

// Clean up any double newlines
const cleaned = fixed.replace(/\n{3,}/g, '\n\n');

writeFileSync(file, cleaned, 'utf8');
console.log(`Fixed task formatting in ${file}`);
