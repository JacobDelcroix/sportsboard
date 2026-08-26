import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const requiredMetadata = ['name', 'version', 'description', 'license', 'repository', 'homepage', 'bugs', 'exports'];

for (const key of requiredMetadata) {
  if (!manifest[key]) throw new Error(`package.json is missing required publication metadata: ${key}`);
}

for (const file of ['README.md', 'CONTRIBUTING.md', 'CHANGELOG.md', 'SECURITY.md', 'LICENSE']) {
  if (!existsSync(new URL(file, root))) throw new Error(`Required package file is missing: ${file}`);
}

const importable = [];
for (const [subpath, target] of Object.entries(manifest.exports)) {
  const targets = typeof target === 'string' ? [target] : Object.values(target);
  for (const file of targets) {
    if (typeof file !== 'string' || !file.startsWith('./')) throw new Error(`Invalid export target for ${subpath}`);
    if (!existsSync(new URL(file.slice(2), root))) throw new Error(`Missing export target for ${subpath}: ${file}`);
  }

  if (typeof target === 'object' && typeof target.import === 'string') {
    importable.push(subpath === '.' ? manifest.name : `${manifest.name}${subpath.slice(1)}`);
  }
}

for (const entryPoint of importable) {
  const module = await import(entryPoint);
  if (Object.keys(module).length === 0) throw new Error(`${entryPoint} does not expose any public API.`);
}

console.log(`Verified ${importable.length} JavaScript entry points, all export targets, and publication metadata.`);
