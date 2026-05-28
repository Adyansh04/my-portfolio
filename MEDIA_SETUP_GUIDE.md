# Media Management Guide

## How It Works

Your media system automatically scans the `/public/projects/[project-name]/` directory and displays all media files in the carousel. **No code changes needed** — just add files and they'll automatically appear.

### Directory Structure
```
public/projects/
├── ai-robotics/          ← Your AI+Robotics Hackathon media
│   ├── 01-robot-task.jpg
│   ├── 02-robot-setup.mp4
│   ├── 03-lab-workspace.jpg
│   ├── 04-obstacle-avoidance.mp4
│   ├── 05-3d-visualization.png
│   └── 06-isaac-sim.png
└── [other-project-name]/  ← Add other projects here
```

## Adding More Media

### Step 1: Prepare Your Files
- **Images**: Save as `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, or `.svg`
- **Videos**: Save as `.mp4`, `.webm`, `.mov`, `.avi`, or `.mkv`
- **Naming**: Use format `##-descriptive-name.ext` (e.g., `07-grasp-demo.mp4`)
  - Numbers help sort files in order (01, 02, 03...)
  - Descriptive names auto-convert to titles (hyphens → spaces, auto-capitalized)

### Step 2: Upload Files
Drop your files directly into `/public/projects/ai-robotics/`:
```bash
cp your-video.mp4 /public/projects/ai-robotics/07-grasp-demo.mp4
```

### Step 3: It's Done!
Reload the page and your new media appears automatically:
- If you had 6 items (1/6), adding 1 more makes it 1/7
- Files are sorted by filename
- Type is auto-detected (image vs video)

## Example: Adding a New Video

**Terminal:**
```bash
# Copy your video to the project directory
cp ~/Downloads/my-robot-demo.mp4 public/projects/ai-robotics/07-robot-demo.mp4
```

**Result in Browser:**
- Media counter updates to "1 / 7"
- New video appears in carousel with thumbnail
- Title auto-generates: "Robot Demo" (from filename)

## Adding Media for Other Projects

Create a new project folder and add files:

```bash
# Create new project directory
mkdir -p public/projects/my-new-project

# Add media files
cp image1.jpg public/projects/my-new-project/01-overview.jpg
cp video1.mp4 public/projects/my-new-project/02-demo.mp4
```

Then in `projects-grid.tsx`, update the carousel call:
```tsx
<MediaCarousel project="my-new-project" primaryColor={colors.primary} />
```

## Supported File Formats

### Images
- JPEG `.jpg` `.jpeg`
- PNG `.png`
- WebP `.webp`
- GIF `.gif`
- SVG `.svg`

### Videos
- MP4 `.mp4` (recommended - best browser support)
- WebM `.webm` (smaller file size)
- MOV `.mov`
- AVI `.avi`
- MKV `.mkv`

## API Details

The system uses an auto-scanning API route at:
```
GET /api/projects/media?project=ai-robotics
```

Returns:
```json
{
  "project": "ai-robotics",
  "total": 6,
  "media": [
    {
      "type": "image",
      "src": "/projects/ai-robotics/01-robot-task.jpg",
      "title": "Robot Task",
      "filename": "01-robot-task.jpg",
      "size": 2949120,
      "alt": "Robot Task"
    },
    ...
  ]
}
```

The API automatically:
- Filters only valid media files
- Sorts by filename
- Generates titles from filenames
- Detects file type (image/video)
- Calculates file size

## Troubleshooting

### New files not appearing?
1. Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Check file extension is correct (lowercase recommended)
3. File must be in `/public/projects/ai-robotics/` directory

### File shows but won't play?
1. Ensure video file is properly encoded
2. Try MP4 format (best browser compatibility)
3. Check file size isn't too large

### Wrong order of media?
- Files sort alphabetically by filename
- Use number prefix `01-`, `02-`, etc. to control order
- Rename as needed: `03-new-file.mp4` → `02b-new-file.mp4`

## Performance Tips

- **Image optimization**: Use `.webp` format for smaller file sizes
- **Video compression**: Use MP4 with H.264 codec
- **File sizes**: 
  - Images: Keep under 5MB each
  - Videos: Keep under 50MB each
- **Naming**: Keep filenames short (under 50 chars)

## Example Workflow

```bash
# 1. Edit your video file locally
# 2. Optimize and compress (optional)

# 3. Copy to project directory with proper naming
cp final-demo.mp4 public/projects/ai-robotics/07-final-demo.mp4

# 4. Reload browser - done! ✨
# Media counter shows: 1 / 7
```
