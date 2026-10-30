// Generates the machine-derived part of docs/ENVIRONMENT.md and verifies it stays in sync with the code.
//
//   node scripts/env-doc.mjs --write   regenerate the block between the BEGIN/END markers
//   node scripts/env-doc.mjs --check   fail if the doc is stale or a dependency/variable is undocumented
//
// Sources of truth: package.json files, .nvmrc, .env.example, apps/api/src/env.ts and the CI workflow.
// Human-written purposes live in docs/dependency-notes.json.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const docPath = join(root, 'docs', 'ENVIRONMENT.md');
const BEGIN = '<!-- BEGIN GENERATED: scripts/env-doc.mjs -->';
const END = '<!-- END GENERATED -->';

const read = (path) => readFileSync(join(root, path), 'utf8');
const readJson = (path) => JSON.parse(read(path));
const cell = (text) => String(text).replaceAll('|', '\\|');
const table = (headers, rows) =>
  [headers, headers.map(() => '---'), ...rows]
    .map((row) => `| ${row.map(cell).join(' | ')} |`)
    .join('\n');

function loadWorkspaces() {
  const manifests = [{ label: 'root', pkg: readJson('package.json') }];
  for (const group of ['apps', 'packages']) {
    for (const entry of readdirSync(join(root, group), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      manifests.push({
        label: `${group}/${entry.name}`,
        pkg: readJson(`${group}/${entry.name}/package.json`),
      });
    }
  }
  return manifests;
}

// name -> { ranges: Set, users: Set } for third-party (non-workspace) packages of one dependency kind.
function collect(manifests, kind) {
  const found = new Map();
  for (const { label, pkg } of manifests) {
    for (const [name, range] of Object.entries(pkg[kind] ?? {})) {
      if (range.startsWith('workspace:')) continue;
      const entry = found.get(name) ?? { ranges: new Set(), users: new Set() };
      entry.ranges.add(range);
      entry.users.add(label);
      found.set(name, entry);
    }
  }
  return found;
}

function parseEnvExample() {
  const vars = [];
  for (const line of read('.env.example').split(/\r?\n/)) {
    const match = /^(#\s*)?([A-Z][A-Z0-9_]*)=(.*)$/.exec(line);
    if (match) vars.push({ name: match[2], value: match[3], active: match[1] === undefined });
  }
  return vars;
}

// Keys declared in the EnvSchema z.object({...}) block of the API.
function parseEnvSchemaKeys() {
  const block = /EnvSchema\s*=\s*z\.object\(\{([\s\S]*?)\n\}\);/.exec(read('apps/api/src/env.ts'));
  if (!block) throw new Error('Could not find the EnvSchema block in apps/api/src/env.ts');
  return [...block[1].matchAll(/^ {2}([A-Z][A-Z0-9_]*):/gm)].map((m) => m[1]);
}

function parseCi() {
  const ci = read('.github/workflows/ci.yml');
  const runner = /runs-on:\s*(\S+)/.exec(ci)?.[1] ?? 'unknown';
  const actions = [...ci.matchAll(/uses:\s*(\S+)/g)].map((m) => m[1]);
  return { runner, actions };
}

function build() {
  const problems = [];
  const notes = readJson('docs/dependency-notes.json');
  const manifests = loadWorkspaces();
  const rootPkg = manifests[0].pkg;
  const nvmrc = read('.nvmrc').trim();

  const sections = [];

  // Toolchain
  const pnpm = /^pnpm@(.+)$/.exec(rootPkg.packageManager ?? '')?.[1] ?? 'unspecified';
  const typescript = rootPkg.devDependencies?.typescript ?? 'unspecified';
  sections.push(
    '### Toolchain',
    table(
      ['Tool', 'Required', 'Pinned in'],
      [
        [
          'Node.js',
          `${rootPkg.engines?.node ?? 'unspecified'} (\`.nvmrc\`: ${nvmrc})`,
          '`package.json` engines, `.nvmrc`',
        ],
        ['pnpm', pnpm, '`package.json` packageManager'],
        ['TypeScript', typescript, '`package.json` devDependencies'],
      ],
    ),
  );

  // Dependencies
  for (const [kind, title] of [
    ['dependencies', 'Runtime dependencies'],
    ['devDependencies', 'Development dependencies'],
  ]) {
    const found = collect(manifests, kind);
    const rows = [...found.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, { ranges, users }]) => {
        const purpose = notes.packages?.[name];
        if (!purpose)
          problems.push(`No purpose for ${kind} package "${name}" in docs/dependency-notes.json`);
        return [`\`${name}\``, [...ranges].join(', '), [...users].join(', '), purpose ?? ''];
      });
    sections.push(`### ${title}`, table(['Package', 'Range', 'Used by', 'Purpose'], rows));
  }

  const used = new Set([
    ...collect(manifests, 'dependencies').keys(),
    ...collect(manifests, 'devDependencies').keys(),
  ]);
  for (const name of Object.keys(notes.packages ?? {})) {
    if (!used.has(name))
      problems.push(`docs/dependency-notes.json documents "${name}" but no package.json uses it`);
  }

  // Environment variables
  const envVars = parseEnvExample();
  const active = new Set(envVars.filter((v) => v.active).map((v) => v.name));
  for (const key of parseEnvSchemaKeys()) {
    if (!active.has(key))
      problems.push(`apps/api/src/env.ts reads ${key} but .env.example does not set it`);
  }
  const envRows = envVars.map(({ name, value, active: isActive }) => {
    const purpose = notes.env?.[name];
    if (!purpose)
      problems.push(`No purpose for environment variable "${name}" in docs/dependency-notes.json`);
    return [`\`${name}\``, `\`${value}\``, isActive ? 'in use' : 'planned', purpose ?? ''];
  });
  for (const name of Object.keys(notes.env ?? {})) {
    if (!envVars.some((v) => v.name === name)) {
      problems.push(
        `docs/dependency-notes.json documents env var "${name}" but .env.example does not list it`,
      );
    }
  }
  sections.push(
    '### Environment variables',
    table(['Variable', 'Default', 'Status', 'Purpose'], envRows),
  );

  // CI
  const { runner, actions } = parseCi();
  sections.push(
    '### CI',
    `Runner: \`${runner}\`. Node comes from \`.nvmrc\`; pnpm from \`packageManager\`.`,
    actions.map((action) => `- \`${action}\``).join('\n'),
  );

  return { block: `${BEGIN}\n\n${sections.join('\n\n')}\n\n${END}`, problems };
}

function splice(doc, block) {
  const start = doc.indexOf(BEGIN);
  const end = doc.indexOf(END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`docs/ENVIRONMENT.md must contain the markers:\n${BEGIN}\n${END}`);
  }
  return doc.slice(0, start) + block + doc.slice(end + END.length);
}

const mode = process.argv[2];
if (mode !== '--write' && mode !== '--check') {
  console.error('Usage: node scripts/env-doc.mjs --write | --check');
  process.exit(2);
}

const { block, problems } = build();
// Git on Windows may check the doc out with CRLF; compare and write LF so the check is line-ending agnostic.
const current = readFileSync(docPath, 'utf8').replaceAll('\r\n', '\n');
const next = splice(current, block);

if (mode === '--write') {
  writeFileSync(docPath, next);
  console.log(`Updated docs/ENVIRONMENT.md${problems.length ? ' (with problems below)' : ''}`);
}
if (problems.length) {
  console.error(problems.map((p) => `- ${p}`).join('\n'));
  process.exit(1);
}
if (mode === '--check' && next !== current) {
  console.error('docs/ENVIRONMENT.md is out of date. Run: pnpm env-doc');
  process.exit(1);
}
if (mode === '--check') console.log('docs/ENVIRONMENT.md is in sync.');
