#!/usr/bin/env node
/**
 * Quick MongoDB connectivity check.
 * Usage: node scripts/check-mongo.mjs
 * Loads .env.local from repo root, then backend-user/.env for any missing keys.
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(root, '.env.local'));
loadEnvFile(resolve(root, 'backend-user/.env'));

const uri = process.env.MONGODB_URI?.trim();
const dbName = process.env.MONGODB_DB_NAME?.trim();

if (!uri || !dbName) {
  console.error('Missing MONGODB_URI or MONGODB_DB_NAME.');
  console.error('Set them in .env.local and backend-user/.env');
  process.exit(1);
}

function buildNonSrvFallbackUri(srvUri) {
  if (!srvUri.startsWith('mongodb+srv://')) return null;
  try {
    const parsed = new URL(srvUri);
    const auth = parsed.username
      ? `${encodeURIComponent(parsed.username)}:${encodeURIComponent(parsed.password)}@`
      : '';
    const dbPath = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '';
    const params = new URLSearchParams(parsed.search);
    if (!params.has('tls')) params.set('tls', 'true');
    const query = params.toString();
    return `mongodb://${auth}${parsed.host}${dbPath}${query ? `?${query}` : ''}`;
  } catch {
    return null;
  }
}

function validateUri(uri, dbName) {
  try {
    const parsed = new URL(uri);
    const host = parsed.hostname;
    if (dbName && host.startsWith(`${dbName}.`) && host.endsWith('.mongodb.net')) {
      console.error('\nURI problem: the database name appears in the hostname.');
      console.error(`  Host:     ${host}`);
      console.error(`  DB name:  ${dbName}`);
      console.error('  Fix: In Atlas → Connect → Drivers, copy the host (e.g. cluster0.xxxxx.mongodb.net).');
      console.error('  Put the database name only in MONGODB_DB_NAME, not in the hostname.\n');
      return false;
    }
    return true;
  } catch {
    console.error('MONGODB_URI is not a valid URL.');
    return false;
  }
}

async function tryConnect(candidateUri) {
  const client = new MongoClient(candidateUri, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
    family: 4,
  });
  await withTimeout(
    client.connect(),
    10000,
    'MongoDB connection timed out. Check Atlas IP allowlist, DNS/network access, and MONGODB_URI.',
  );
  const db = client.db(dbName);
  const collections = await db.listCollections().toArray();
  await client.close();
  return collections.map((c) => c.name).sort();
}

function withTimeout(promise, timeoutMs, message) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

async function main() {
  console.log('Testing MongoDB...');
  console.log('Database:', dbName);
  console.log('URI type:', uri.startsWith('mongodb+srv://') ? 'Atlas (SRV)' : 'Standard');

  try {
    const host = new URL(uri).hostname;
    console.log('Host:', host);
  } catch {
    /* ignore */
  }

  if (!validateUri(uri, dbName)) {
    process.exit(2);
  }

  try {
    const collections = await tryConnect(uri);
    console.log('OK — connected with primary URI');
    console.log('Collections:', collections.length ? collections.join(', ') : '(none yet)');
    process.exit(0);
  } catch (primaryError) {
    const fallback = buildNonSrvFallbackUri(uri);
    const message = String(primaryError?.message || primaryError);
    console.warn('Primary URI failed:', message.split('\n')[0]);

    if (!fallback) {
      console.error('\nFix: verify Atlas IP allowlist, user/password (URL-encode special chars), or use local:');
      console.error('  MONGODB_URI=mongodb://127.0.0.1:27017');
      process.exit(2);
    }

    try {
      const collections = await tryConnect(fallback);
      console.log('OK — connected with non-SRV fallback URI');
      console.log('Tip: you can put this style of URI in .env.local if SRV keeps failing.');
      console.log('Collections:', collections.length ? collections.join(', ') : '(none yet)');
      process.exit(0);
    } catch (fallbackError) {
      console.error('Fallback URI also failed:', String(fallbackError?.message || fallbackError).split('\n')[0]);
      process.exit(2);
    }
  }
}

main();
