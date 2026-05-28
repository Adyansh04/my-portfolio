'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';

interface MediaItem {
  type: 'image' | 'video';
  src: string;
  alt: string;
  title: string;
  filename: string;
  size: number;
}

interface MediaCarouselProps {
  project: string;
  primaryColor?: string;
}

export function MediaCarousel({ project, primaryColor = '#00ffff' }: MediaCarouselProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/projects/media-manifest.json`);
        if (!response.ok) throw new Error('Failed to fetch media');
        const manifest = await response.json();
        const data = manifest[project];
        if (!data) throw new Error('Project not found in manifest');
        setMedia(data.media);
        setError(null);
      } catch (err) {
        console.error('[v0] Error fetching media:', err);
        setError('Could not load media files');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedia();
  }, [project]);

  if (isLoading) {
    return (
      <div className="aspect-video rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/60 animate-spin"
            style={{ borderTopColor: primaryColor }}
          />
          <span className="text-white/40 text-sm">Loading media...</span>
        </div>
      </div>
    );
  }

  if (error || media.length === 0) {
    return (
      <div className="aspect-video rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex items-center justify-center">
        <span className="text-white/40 text-sm">{error || 'No media files found'}</span>
      </div>
    );
  }

  const currentItem = media[currentIndex];
  const isVideo = currentItem.type === 'video';

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="space-y-4">
      {/* Media Display Container */}
      <div className="relative group">
        <div className="aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-black/50 to-black/30 border border-white/10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full"
            >
              {!isVideo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentItem.src}
                  alt={currentItem.alt}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={currentItem.src}
                  className="w-full h-full object-cover"
                  controls
                  muted={isMuted}
                  autoPlay
                  controlsList="nodownload"
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          {media.length > 1 && (
            <>
              <motion.button
                whileHover={{ scale: 1.1, x: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Previous media"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1, x: 4 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Next media"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </motion.button>
            </>
          )}

          {/* Volume Toggle for Videos */}
          {isVideo && media.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMuted(!isMuted)}
              className="absolute bottom-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-white" />
              ) : (
                <Volume2 className="w-4 h-4 text-white" />
              )}
            </motion.button>
          )}

          {/* Media Counter */}
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
            <span className="text-white/60 text-sm font-mono">
              {currentIndex + 1} / {media.length}
            </span>
          </div>

          {/* Media Type Badge */}
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
            <span className="text-white/60 text-xs font-mono uppercase tracking-wider">
              {currentItem.type}
            </span>
          </div>
        </div>
      </div>

      {/* Thumbnails Navigation */}
      {media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scroll-smooth">
          {media.map((item, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => goToIndex(index)}
              className={`relative h-16 min-w-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                index === currentIndex
                  ? 'border-white/40 ring-2 ring-white/20'
                  : 'border-white/10 hover:border-white/20'
              }`}
              title={item.title}
            >
              {item.type === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.src}
                  alt={item.alt}
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <video
                    src={item.src}
                    className="w-full h-full object-cover"
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="w-3 h-3 rounded-full bg-white/60" />
                  </div>
                </>
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Media Title & Info */}
      <div className="space-y-2">
        <h4 className="text-white/80 font-medium text-sm">{currentItem.title}</h4>
        <p className="text-white/40 text-xs font-mono">
          {currentItem.filename} • {(currentItem.size / (1024 * 1024)).toFixed(2)} MB
        </p>
      </div>
    </div>
  );
}
