#!/usr/bin/env node
/**
 * Fixes a common Atlas URI mistake: database name used as hostname.
 * Usage: node scripts/fix-mongo-host.mjs [clusterHostPrefix]
 * Example: node scripts/fix-mongo-host.mjs cluster0
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const clusterPrefix = process.argv[2] || 'cluster0';

const files = [resolve(root, '.env.local'), resolve(root, 'backend-user/.env')];

for (const file of files) {
  if (!existsSync(file)) {
    console.warn('Skip (missing):', file);
    continue;
  }

  let text = readFileSync(file, 'utf8');
  const dbMatch = text.match(/^MONGODB_DB_NAME=(.+)$/m);
  const uriMatch = text.match(/^MONGODB_URI=(.+)$/m);
  if (!dbMatch || !uriMatch) {
    console.warn('Skip (no MONGODB_*):', file);
    continue;
  }

  const dbName = dbMatch[1].trim();
  const uri = uriMatch[1].trim();
  const parsed = new URL(uri);
  const parts = parsed.hostname.split('.');
  const suffix = parts.length >= 3 ? parts.slice(-3).join('.') : parsed.hostname;

  if (!parsed.hostname.startsWith(`${dbName}.`)) {
    console.log('Already OK:', file, '→', parsed.hostname);
    continue;
  }

  parsed.hostname = `${clusterPrefix}.${suffix}`;
  parsed.pathname = '/';
  const fixed = parsed.toString();
  text = text.replace(/^MONGODB_URI=.+$/m, `MONGODB_URI=${fixed}`);
  writeFileSync(file, text);
  console.log('Updated:', file, '→', parsed.hostname);
}

console.log('\nRun: npm run check:mongo');
