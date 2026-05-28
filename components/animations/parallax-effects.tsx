"use client";

import { useRef, ReactNode } from "react";
import { motion, useScroll, useTransform, useSpring, MotionValue } from "framer-motion";

interface ParallaxSectionProps {
  children: ReactNode;
  speed?: number; // -1 to 1, negative = slower, positive = faster
  className?: string;
  direction?: "vertical" | "horizontal";
}

export function ParallaxSection({
  children,
  speed = 0.5,
  className = "",
  direction = "vertical",
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };
  
  const yRange = useTransform(scrollYProgress, [0, 1], [100 * speed, -100 * speed]);
  const xRange = useTransform(scrollYProgress, [0, 1], [50 * speed, -50 * speed]);
  
  const y = useSpring(yRange, springConfig);
  const x = useSpring(xRange, springConfig);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div
        style={{
          y: direction === "vertical" ? y : 0,
          x: direction === "horizontal" ? x : 0,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

interface ParallaxLayerProps {
  children: ReactNode;
  depth?: number; // 0 = no movement, 1 = full movement
  className?: string;
}

export function ParallaxLayer({
  children,
  depth = 0.5,
  className = "",
}: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [depth * 200, depth * -200]);
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ y: smoothY }}
    >
      {children}
    </motion.div>
  );
}

interface ParallaxContainerProps {
  children: ReactNode;
  className?: string;
}

export function ParallaxContainer({ children, className = "" }: ParallaxContainerProps) {
  return (
    <div className={`relative ${className}`} style={{ perspective: "1000px" }}>
      {children}
    </div>
  );
}

// Multi-layer parallax background
interface ParallaxBackgroundProps {
  layers: {
    content: ReactNode;
    speed: number;
    opacity?: number;
    blur?: number;
    scale?: number;
  }[];
  className?: string;
}

export function ParallaxBackground({ layers, className = "" }: ParallaxBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {layers.map((layer, index) => {
        const y = useTransform(
          scrollYProgress,
          [0, 1],
          [layer.speed * 150, layer.speed * -150]
        );
        const smoothY = useSpring(y, { stiffness: 100, damping: 30 });

        return (
          <motion.div
            key={index}
            className="absolute inset-0"
            style={{
              y: smoothY,
              opacity: layer.opacity ?? 1,
              filter: layer.blur ? `blur(${layer.blur}px)` : undefined,
              scale: layer.scale ?? 1,
              zIndex: index,
            }}
          >
            {layer.content}
          </motion.div>
        );
      })}
    </div>
  );
}

// Parallax text that reveals on scroll
interface ParallaxTextRevealProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

export function ParallaxTextReveal({
  text,
  className = "",
  as: Component = "p",
}: ParallaxTextRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "start 0.3"],
  });

  const words = text.split(" ");

  return (
    <div ref={ref} className={className}>
      <Component className="flex flex-wrap">
        {words.map((word, i) => {
          const start = i / words.length;
          const end = start + 1 / words.length;
          
          return (
            <ParallaxWord
              key={i}
              progress={scrollYProgress}
              range={[start, end]}
            >
              {word}
            </ParallaxWord>
          );
        })}
      </Component>
    </div>
  );
}

interface ParallaxWordProps {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
}

function ParallaxWord({ children, progress, range }: ParallaxWordProps) {
  const opacity = useTransform(progress, range, [0, 1]);
  const y = useTransform(progress, range, [20, 0]);

  return (
    <span className="relative mr-2 mt-1">
      <motion.span
        style={{ opacity, y }}
        className="inline-block"
      >
        {children}
      </motion.span>
    </span>
  );
}

// Floating elements with parallax
interface FloatingParallaxElementProps {
  children: ReactNode;
  amplitude?: number;
  frequency?: number;
  delay?: number;
  className?: string;
}

export function FloatingParallaxElement({
  children,
  amplitude = 20,
  frequency = 3,
  delay = 0,
  className = "",
}: FloatingParallaxElementProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [-amplitude, amplitude]);
  const smoothY = useSpring(y, { stiffness: 50, damping: 20 });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ y: smoothY }}
      animate={{
        y: [0, -amplitude / 2, 0],
      }}
      transition={{
        duration: frequency,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}

// Parallax scale effect
interface ParallaxScaleProps {
  children: ReactNode;
  scaleRange?: [number, number];
  className?: string;
}

export function ParallaxScale({
  children,
  scaleRange = [0.8, 1.1],
  className = "",
}: ParallaxScaleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [scaleRange[0], 1, scaleRange[1]]);
  const smoothScale = useSpring(scale, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ scale: smoothScale }}
    >
      {children}
    </motion.div>
  );
}

// Parallax rotation effect
interface ParallaxRotateProps {
  children: ReactNode;
  rotateRange?: [number, number];
  className?: string;
}

export function ParallaxRotate({
  children,
  rotateRange = [-5, 5],
  className = "",
}: ParallaxRotateProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const rotate = useTransform(scrollYProgress, [0, 1], rotateRange);
  const smoothRotate = useSpring(rotate, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotate: smoothRotate }}
    >
      {children}
    </motion.div>
  );
}
