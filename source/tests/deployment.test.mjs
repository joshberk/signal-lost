import { strict as assert } from 'node:assert';
import { mkdtemp, mkdir, copyFile, readFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = await mkdtemp(join(tmpdir(), 'signal-lost-deploy-'));
await mkdir(join(root, 'scripts'));
await copyFile('scripts/prepare-deploy.mjs', join(root, 'scripts/prepare-deploy.mjs'));
await copyFile('wrangler.jsonc', join(root, 'wrangler.jsonc'));
const baseEnv = {...process.env, CLOUDFLARE_API_TOKEN:'', CLOUDFLARE_ACCOUNT_ID:'', CLOUDFLARE_D1_DATABASE_ID:''};
function run(extra = {}) { return spawnSync(process.execPath, [join(root, 'scripts/prepare-deploy.mjs'), '--ci'], {env:{...baseEnv,...extra},encoding:'utf8'}); }
const missing = run();
assert.equal(missing.status, 1);
for (const name of ['CLOUDFLARE_API_TOKEN','CLOUDFLARE_ACCOUNT_ID','CLOUDFLARE_D1_DATABASE_ID']) assert(missing.stderr.includes(name));
await assert.rejects(access(join(root,'wrangler.deploy.json')));
const malformed = run({CLOUDFLARE_API_TOKEN:'test-only-token',CLOUDFLARE_ACCOUNT_ID:'test-account',CLOUDFLARE_D1_DATABASE_ID:'invalid'});
assert.equal(malformed.status, 1);
const id = '12345678-1234-4234-8234-123456789abc';
const ready = run({CLOUDFLARE_API_TOKEN:'test-only-token',CLOUDFLARE_ACCOUNT_ID:'test-account',CLOUDFLARE_D1_DATABASE_ID:id});
assert.equal(ready.status,0,ready.stderr);
const text = await readFile(join(root,'wrangler.deploy.json'),'utf8');
const config = JSON.parse(text);
assert.equal(config.d1_databases[0].database_id,id);
assert.equal(config.d1_databases[0].binding,'DB');
assert.equal(config.assets.directory,'./dist/client');
assert.equal(config.d1_databases[0].migrations_dir,'drizzle');
assert(!text.includes('test-only-token'));assert(!text.includes('test-account'));
console.log('Deployment preflight passed: reports all missing setup, rejects invalid database IDs, preserves paths and excludes credentials.');
