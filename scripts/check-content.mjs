#!/usr/bin/env node
// Verifies that every content string from the pre-redesign components (git branch `main`)
// still appears verbatim in content/*.ts, and that item counts match. Exit 1 on any miss.
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';

const OLD = {
  'components/projects-grid.tsx': 'const projects =',
  'components/experience-timeline.tsx': 'const experiences =',
  'components/hackathons-section.tsx': 'const hackathons =',
  'components/credentials-accordion.tsx': 'const credentialsData =',
  'components/bento-grid.tsx': 'const educationData =',
  'components/contact-terminal.tsx': 'const contactData =',
};
const EXPECTED = { projects: 10, experiences: 6, hackathons: 3, credentials: [1, 2, 3], education: 2, techStack: 28, contact: 3 };

function sliceArray(src, decl) {
  const start = src.indexOf(decl); if (start < 0) throw new Error('decl not found: ' + decl);
  let i = src.indexOf('[', start), depth = 0, inStr = null, esc = false;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === inStr) inStr = null; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '/' && src[j + 1] === '/') { j = src.indexOf('\n', j); continue; }
    if (c === '[') depth++; else if (c === ']') { depth--; if (depth === 0) return src.slice(i, j + 1); }
  }
  throw new Error('unbalanced');
}
const evalArr = (lit) => new Function('return ' + lit.replace(/icon:\s*([A-Za-z0-9_]+)/g, 'icon: "$1"'))();
const strings = (v, out = []) => {
  if (typeof v === 'string') { if (v.length >= 4) out.push(v); }
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, out));
  return out;
};

const newSrc = readdirSync('content').filter((f) => f.endsWith('.ts')).map((f) => readFileSync(`content/${f}`, 'utf8')).join('\n');
// content files are JSON-stringified: compare against JSON-escaped forms too
const present = (s) => newSrc.includes(s) || newSrc.includes(JSON.stringify(s).slice(1, -1));

let missing = 0, checked = 0;
for (const [file, decl] of Object.entries(OLD)) {
  const src = execSync(`git show main:${file}`, { encoding: 'utf8' });
  const data = evalArr(sliceArray(src, decl));
  for (const s of strings(data)) { checked++; if (!present(s)) { missing++; console.log(`MISSING from ${file}: ${JSON.stringify(s).slice(0, 120)}`); } }
  if (file.includes('bento-grid')) {
    const ts = evalArr(sliceArray(src, 'const techStack ='));
    for (const s of ts) { checked++; if (!present(s)) { missing++; console.log(`MISSING techStack: ${s}`); } }
    const mission = src.match(/text="([^"]+)"/)[1]; checked++; if (!present(mission)) { missing++; console.log('MISSING mission quote'); }
  }
}
const { projects } = await import('../content/projects.ts');
const { experiences } = await import('../content/experience.ts');
const { hackathons } = await import('../content/hackathons.ts');
const { credentialGroups } = await import('../content/credentials.ts');
const { education } = await import('../content/education.ts');
const { techStack } = await import('../content/tech-stack.ts');
const { contactCommands } = await import('../content/contact.ts');
const counts = { projects: projects.length, experiences: experiences.length, hackathons: hackathons.length, credentials: credentialGroups.map((g) => g.items.length), education: education.length, techStack: techStack.length, contact: contactCommands.length };
const countOk = JSON.stringify(counts) === JSON.stringify(EXPECTED);
console.log(`checked ${checked} strings, ${missing} missing | counts ${JSON.stringify(counts)} ${countOk ? 'OK' : 'MISMATCH (expected ' + JSON.stringify(EXPECTED) + ')'}`);
process.exit(missing || !countOk ? 1 : 0);
