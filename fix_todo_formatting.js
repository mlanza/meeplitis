#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node fix_todo_formatting.js <file>');
  process.exit(1);
}

const content = readFileSync(filePath, 'utf8');

// Fix the formatting by ensuring each task item (A1, B1, etc.) starts on a new line
const fixed = content
  // Fix pattern: "text A1." -> "text\nA1." (match space before task number)
  .replace(/([^\n]) ([A-F]\d+\.)/g, '$1\n$2')
  // Run twice to catch consecutive items
  .replace(/([^\n]) ([A-F]\d+\.)/g, '$1\n$2');

writeFileSync(filePath, fixed, 'utf8');
console.log('Fixed formatting in', filePath);
