'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface MediaCollageProps {
  projectFolder: string;
  primaryColor?: string;
}

interface MediaItem {
  src: string;
  type: 'image' | 'video';
}

export function MediaCollage({ projectFolder, primaryColor = '#00ffff' }: MediaCollageProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy load - only fetch media when collage is visible in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const fetchMedia = async () => {
      try {
        const response = await fetch(`/projects/media-manifest.json`);
        if (response.ok) {
          const manifest = await response.json();
          const data = manifest[projectFolder];
          // Only use images in background (no videos to reduce lag)
          const imageMedia = data?.media?.filter((item: MediaItem) => item.type === 'image') || [];
          setMedia(imageMedia);
        }
      } catch (error) {
        console.error('[v0] Error fetching media for collage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedia();
  }, [projectFolder, isVisible]);

  if (!isVisible || isLoading || media.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden rounded-2xl">
      {/* Grid of 2x2 images only (images are lighter than videos) */}
      <div className="grid grid-cols-2 grid-rows-2 h-full w-full">
        {media.slice(0, 4).map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            className="relative overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.src}
              alt=""
              className="w-full h-full object-cover"
              style={{
                filter: 'blur(4px) brightness(0.5) saturate(0.8)',
                transform: 'scale(1.1)',
              }}
              loading="lazy"
            />
          </motion.div>
        ))}
      </div>

      {/* Subtle color gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, rgba(0,0,0,0.3) 0%, transparent 50%, ${primaryColor}10 100%)`,
        }}
      />
    </div>
  );
}
