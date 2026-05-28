# 📸 How to Add More Videos and Images to Project Details

## Quick Summary
The AI+Robotics Hackathon project now includes a media carousel that displays images and videos with left/right navigation arrows. You can easily add more media by uploading files to Vercel Blob storage and updating the project data.

---

## Step-by-Step Guide to Add Media

### 1️⃣ **Upload Your File to Vercel Blob**
- Go to your project settings in v0
- Navigate to the "Vars" section
- Your Vercel Blob storage URLs will be available there
- You can upload files and get their public URLs

### 2️⃣ **Add Media Entry to Project Data**
Open `/components/projects-grid.tsx` and find the AI+Robotics project (id: 1). Look for the `media` array:

```typescript
media: [
  {
    type: "image" as const,
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSCF9576.JPG-UZsAHRnbgnJTN5sVfTQHmW5lUjt2SA.jpeg",
    alt: "Robot performing pick-and-place task",
    title: "Physical Robot - Pick & Place"
  },
  // ... more items
]
```

### 3️⃣ **Add Your New Media Item**
Choose the appropriate template:

**For Images:**
```typescript
{
  type: "image" as const,
  src: "YOUR_BLOB_URL_HERE",
  alt: "Brief description of what's in the image",
  title: "Display name in carousel"
}
```

**For Videos:**
```typescript
{
  type: "video" as const,
  src: "YOUR_BLOB_URL_HERE",
  alt: "Brief description of the video",
  title: "Display name in carousel"
}
```

### 4️⃣ **Example: Adding a New Image**
```typescript
media: [
  // ... existing items
  {
    type: "image" as const,
    src: "https://your-blob-storage.com/new-screenshot.png",
    alt: "Simulation environment with mesh visualization",
    title: "New Visualization"
  }
]
```

---

## Carousel Features

✅ **Left/Right Navigation Arrows** - Click to browse through media  
✅ **Indicator Dots** - Click dots at bottom to jump to specific media  
✅ **Media Counter** - Shows "X / Y" (e.g., "3 / 6") at top-right  
✅ **Auto-loop** - Wraps around when reaching the end  
✅ **Video Controls** - Built-in play/pause/volume for videos  
✅ **Responsive** - Works on desktop and mobile  

---

## File Structure Reference

**Where the project data lives:**
- `/components/projects-grid.tsx` - Line 10-67 (AI+Robotics project)

**Carousel component:**
- `/components/media-carousel.tsx` - The carousel UI logic

**The media object structure:**
```typescript
interface MediaItem {
  type: "image" | "video";        // File type
  src: string;                     // Blob storage URL
  alt?: string;                    // Accessibility text
  title?: string;                  // Display name in carousel
  videoType?: "mp4" | "webm";     // Optional video format hint
}
```

---

## Tips & Best Practices

### ✨ Naming & Organization
- Use descriptive `alt` text for accessibility
- Use clear, concise `title` values (visible in carousel)
- Organize media in a logical order (photos → videos → diagrams)

### 📋 Supported Formats
- **Images**: JPG, PNG, WebP, GIF
- **Videos**: MP4, WebM
- **Other**: All formats supported by `<img>` and `<video>` tags

### 🎯 URL Tips
- Use the full Vercel Blob URL (e.g., `https://hebbkx1anhila5yf.public.blob.vercel-storage.com/filename.mp4`)
- Don't worry about `.tsx` or `.png` extensions - the blob service handles them
- Keep URLs in the media array, not hardcoded elsewhere

### 🚀 Performance Tips
- Compress images before uploading (reduces load time)
- Use MP4 videos (better browser support than WebM)
- Limit to 8-10 media items per project for smooth performance

---

## Example: Full Updated Media Array

```typescript
details: {
  fullDescription: "...",
  media: [
    {
      type: "image" as const,
      src: "https://url-to-physical-robot.jpg",
      alt: "Robot with blue objects",
      title: "Physical Setup"
    },
    {
      type: "video" as const,
      src: "https://url-to-demo-video.mp4",
      alt: "Robot picking objects",
      title: "Pick & Place Demo"
    },
    {
      type: "image" as const,
      src: "https://url-to-sim-viz.png",
      alt: "3D visualization",
      title: "3D Mesh Visualization"
    }
  ],
  techStack: [...],
  challenges: [...]
}
```

---

## Troubleshooting

**Media not showing?**
- Check that the URL is correct and accessible
- Ensure `type` is set to `"image"` or `"video"`
- Clear browser cache and refresh

**Carousel not appearing?**
- Make sure `media` array has at least 1 item
- Verify the carousel component is imported in `projects-grid.tsx`

**Video won't play?**
- Confirm the video format is MP4 or WebM
- Check that the blob URL is publicly accessible
- Try a different video file to rule out file corruption

---

## Adding Media to Other Projects

To add the carousel to other projects, follow the same pattern:

1. Add a `media` array to `project.details`
2. Import `MediaCarousel` in the modal (already done in `projects-grid.tsx`)
3. Add the carousel section in the modal JSX (replace any placeholder media sections)

That's it! The carousel will automatically work with any project that has a properly formatted media array.
