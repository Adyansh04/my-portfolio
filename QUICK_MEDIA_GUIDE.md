# Quick Reference: Adding Media

## The One-Line Answer
Drop files in `public/projects/ai-robotics/` with number prefix, reload browser. Done!

---

## Example Workflow

### Adding a new video to AI+Robotics project:

```bash
# Have your video ready
# video.mp4

# Add it with the next number (you have 01-06, so use 07):
cp video.mp4 public/projects/ai-robotics/07-my-new-video.mp4

# Reload browser
# Counter updates: 1/7 ✨
```

---

## File Naming Rules

✅ **DO THIS:**
- `07-obstacle-demo.mp4`
- `08-grasp-sequence.jpg`
- `09-perception.png`

❌ **DON'T DO THIS:**
- `video.mp4` (no number)
- `my video.mp4` (spaces - use hyphens)
- `MyVideo.MP4` (use lowercase `.mp4`)

---

## Current Files (6 total)

```
01-robot-task.jpg           → Physical robot picking
02-robot-setup.mp4          → Lab setup video
03-lab-workspace.jpg        → Dev environment
04-obstacle-avoidance.mp4   → Dynamic avoidance demo
05-3d-visualization.png     → NvBlox visualization
06-isaac-sim.png            → Isaac Sim validation
```

Add more with `07-`, `08-`, etc.

---

## What Happens When You Add a File

1. You copy file to `public/projects/ai-robotics/`
2. User reloads browser
3. Carousel fetches from `/api/projects/media?project=ai-robotics`
4. API scans directory, finds your new file
5. Counter updates automatically (1/7, 1/8, etc.)
6. File appears in thumbnail grid
7. User can view it in carousel

**No code changes needed.**

---

## Supported Formats

| Type | Formats |
|------|---------|
| **Image** | `.jpg` `.jpeg` `.png` `.gif` `.webp` `.svg` |
| **Video** | `.mp4` `.webm` `.mov` `.avi` `.mkv` |

**Recommended:**
- Images: `.jpg` or `.png`
- Videos: `.mp4` (best browser support)

---

## Directory Structure

```
your-project/
└── public/projects/
    └── ai-robotics/          ← Your media folder
        ├── 01-robot-task.jpg
        ├── 02-robot-setup.mp4
        ├── 03-lab-workspace.jpg
        ├── 04-obstacle-avoidance.mp4
        ├── 05-3d-visualization.png
        ├── 06-isaac-sim.png
        └── 07-your-new-file.mp4  ← Add here
```

---

## Pro Tips

1. **Keep files under 5MB** (images) or 50MB (videos) for fast loading
2. **Use descriptive names**: `07-grasp-success` not `07-video1`
3. **Number sequentially**: 07, 08, 09 (not 7, 8, 9)
4. **Videos in MP4**: Better than WebM for browser compatibility
5. **Reload hard**: Ctrl+Shift+R or Cmd+Shift+R (not soft refresh)

---

## Adding to Different Project

### Create new project folder:
```bash
mkdir -p public/projects/omni-wheel-robot
```

### Add media:
```bash
cp image.jpg public/projects/omni-wheel-robot/01-overview.jpg
cp video.mp4 public/projects/omni-wheel-robot/02-demo.mp4
```

### Update code (one-time):
In `components/projects-grid.tsx`, find your project card:
```tsx
<MediaCarousel project="omni-wheel-robot" primaryColor={colors.primary} />
```

---

## What Works Automatically

- ✅ File discovery (API scans directory)
- ✅ Type detection (image vs video)
- ✅ Sorting (by filename, respects numbers)
- ✅ Title generation (filename → "Title Case")
- ✅ Counter update (1/6 → 1/7 when you add files)
- ✅ Thumbnail generation (auto from first frame)
- ✅ Video autoplay
- ✅ Responsive layout

---

## What You Do

1. Add file to folder
2. Reload page
3. See it in carousel

That's it! 🎉
