#!/usr/bin/env node
// Verifies that nothing from the pre-redesign components (git branch `main`) has been lost from
// content/*.ts, and that item counts match. Exit 1 on any miss.
//
// Verbatim was the original rule, and it still is for anything untouched. But the project copy was
// deliberately rewritten (2026-09-11) — long paragraphs split into a gist, scannable points and
// problem/solution pairs — so exact-match would now fail on prose that was *meant* to change. A
// string that no longer matches verbatim is therefore checked token-wise instead: every
// distinctive token in it (anything with a digit, an identifier, an acronym, a hyphenated
// technical term) must still appear somewhere in content/. That keeps the guarantee that matters
// — no fact silently disappeared in a rewrite — without freezing the wording.
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

/**
 * Words that carry a fact: numbers, acronyms, identifiers. Hyphenated adjectives are deliberately
 * not in here — "three-wheeled" becoming "three-wheel" is a wording change, and treating it as a
 * lost fact buries the two that actually were (a resolution written with the wrong multiplication
 * sign, and a dropped `zone_3` example).
 */
const facts = (s) =>
  [...new Set(
    s
      .split(/[\s,.;:()"'\u2014\u2013]+/)
      .map((w) => w.replace(/^[^\w%°-]+|[^\w%°-]+$/g, ''))
      .filter((w) => w.length >= 2)
      .filter((w) => /\d/.test(w) || /[A-Z]{2,}/.test(w) || /[a-z][A-Z]/.test(w) || w.includes('_')),
  )];

/**
 * A rewritten string passes if every fact in it survives somewhere in content/. A hyphenated
 * compound counts as kept when its parts are — "Microcontroller-to-ROS2" is carried by "ROS2".
 */
const kept = (f) => newSrc.includes(f) || (f.includes('-') && f.split('-').filter((x) => /\d/.test(x) || /[A-Z]{2,}/.test(x)).every((x) => newSrc.includes(x)));
const factsKept = (s) => {
  const lost = facts(s).filter((f) => !kept(f));
  return { ok: lost.length === 0, lost };
};

let missing = 0, checked = 0, rewritten = 0;
for (const [file, decl] of Object.entries(OLD)) {
  const src = execSync(`git show main:${file}`, { encoding: 'utf8' });
  const data = evalArr(sliceArray(src, decl));
  for (const s of strings(data)) {
    checked++;
    if (present(s)) continue;
    const { ok, lost } = factsKept(s);
    if (ok) { rewritten++; continue; }
    missing++;
    console.log(`LOST FACTS from ${file}: ${lost.join(', ')}\n   in: ${JSON.stringify(s).slice(0, 110)}`);
  }
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
console.log(`checked ${checked} strings, ${missing} missing, ${rewritten} rewritten with facts kept | counts ${JSON.stringify(counts)} ${countOk ? 'OK' : 'MISMATCH (expected ' + JSON.stringify(EXPECTED) + ')'}`);
process.exit(missing || !countOk ? 1 : 0);
