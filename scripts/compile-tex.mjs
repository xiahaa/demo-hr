#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve, basename } from 'node:path';

const input = process.argv[2];

if (!input) {
  console.error('Usage: node scripts/compile-tex.mjs <path/to/resume.tex>');
  process.exit(1);
}

const texPath = resolve(process.cwd(), input);
if (!existsSync(texPath)) {
  console.error(`TeX file not found: ${texPath}`);
  process.exit(1);
}

const outputDir = dirname(texPath);
const fileName = basename(texPath);

const has = (bin) => spawnSync('bash', ['-lc', `command -v ${bin}`], { stdio: 'ignore' }).status === 0;

const run = (cmd, args) => spawnSync(cmd, args, { stdio: 'inherit', cwd: outputDir });

if (has('tectonic')) {
  const r = run('tectonic', ['--keep-logs', '--outdir', outputDir, texPath]);
  process.exit(r.status ?? 1);
}

if (has('pdflatex')) {
  const r1 = run('pdflatex', ['-interaction=nonstopmode', '-halt-on-error', fileName]);
  if (r1.status !== 0) process.exit(r1.status ?? 1);
  const r2 = run('pdflatex', ['-interaction=nonstopmode', '-halt-on-error', fileName]);
  process.exit(r2.status ?? 1);
}

console.error('No TeX engine found. Install one of: tectonic, pdflatex.');
process.exit(1);
