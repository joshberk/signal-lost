import { readFile, writeFile } from 'node:fs/promises';

// Keep generated configuration beside wrangler.jsonc so relative asset and
// migration paths resolve identically. Never put authentication in this file.
const config = JSON.parse(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
const problems = [];
if (process.argv.includes('--ci')) {
  for (const name of ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID']) {
    if (!process.env[name]?.trim()) problems.push(`Add ${name} to GitHub repository Actions secrets.`);
  }
}
const binding = config.d1_databases?.find(item => item.binding === 'DB');
const id = process.env.CLOUDFLARE_D1_DATABASE_ID?.trim() || binding?.database_id;
if (!binding) problems.push('wrangler.jsonc must include the DB D1 binding.');
if (!id || id === '00000000-0000-4000-8000-000000000000' || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) {
  problems.push('Create a Cloudflare D1 database and set CLOUDFLARE_D1_DATABASE_ID in GitHub Actions variables, or replace the placeholder database_id in wrangler.jsonc.');
}
if (problems.length) {
  console.error('Deployment is not configured:\n' + problems.map(problem => `- ${problem}`).join('\n'));
  process.exitCode = 1;
} else {
  binding.database_id = id;
  await writeFile(new URL('../wrangler.deploy.json', import.meta.url), JSON.stringify(config, null, 2) + '\n');
  console.log('Deployment configuration ready. Credentials remain in the environment.');
}
