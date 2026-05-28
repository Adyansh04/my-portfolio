/**
 * Pre-build script: Scans public/projects/ and generates a static JSON manifest
 * at public/projects/media-manifest.json so client components can discover
 * project media without a server-side API route.
 *
 * Run before `next build`: node scripts/generate-media-manifest.mjs
 */

import { readdir, stat, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectsDir = join(__dirname, '..', 'public', 'projects');

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
const VIDEO_EXTS = ['mp4', 'webm', 'mov', 'avi', 'mkv'];

function getMediaType(filename) {
  const ext = filename.toLowerCase().split('.').pop();
  if (IMAGE_EXTS.includes(ext)) return 'image';
  if (VIDEO_EXTS.includes(ext)) return 'video';
  return null;
}

function generateTitle(filename) {
  return filename
    .replace(/^\d+-/, '')
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function main() {
  const manifest = {};

  const projects = await readdir(projectsDir);
  for (const project of projects) {
    const projectPath = join(projectsDir, project);
    const s = await stat(projectPath);
    if (!s.isDirectory()) continue;

    const files = (await readdir(projectPath)).sort();
    const mediaItems = [];

    for (const filename of files) {
      const mediaType = getMediaType(filename);
      if (!mediaType) continue;

      const filePath = join(projectPath, filename);
      const fileStats = await stat(filePath);

      mediaItems.push({
        type: mediaType,
        src: `/projects/${project}/${filename}`,
        alt: generateTitle(filename),
        title: generateTitle(filename),
        filename,
        size: fileStats.size,
      });
    }

    if (mediaItems.length > 0) {
      manifest[project] = { project, total: mediaItems.length, media: mediaItems };
    }
  }

  const outPath = join(projectsDir, 'media-manifest.json');
  await writeFile(outPath, JSON.stringify(manifest, null, 2));
  console.log(`✓ Generated media manifest with ${Object.keys(manifest).length} projects → ${outPath}`);
}

main().catch(console.error);
