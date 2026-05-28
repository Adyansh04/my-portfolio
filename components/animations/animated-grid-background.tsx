"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useColorTheme } from "../color-theme-provider";

interface AnimatedGridBackgroundProps {
  gridSize?: number;
  lineOpacity?: number;
  pulseSpeed?: number;
  showPulse?: boolean;
  className?: string;
}

export function AnimatedGridBackground({
  gridSize = 60,
  lineOpacity = 0.08,
  pulseSpeed = 4,
  showPulse = true,
  className = "",
}: AnimatedGridBackgroundProps) {
  const { colors } = useColorTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const numCols = Math.ceil(dimensions.width / gridSize) + 1;
  const numRows = Math.ceil(dimensions.height / gridSize) + 1;

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    >
      {/* Static grid lines */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid-pattern"
            width={gridSize}
            height={gridSize}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
              fill="none"
              stroke={colors.primary}
              strokeOpacity={lineOpacity}
              strokeWidth="1"
            />
          </pattern>
          
          {/* Radial gradient for mouse glow */}
          <radialGradient id="mouse-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="0.3" />
            <stop offset="50%" stopColor={colors.primary} stopOpacity="0.1" />
            <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
          </radialGradient>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        
        {/* Mouse glow effect on grid */}
        <circle
          cx={mousePosition.x}
          cy={mousePosition.y}
          r="150"
          fill="url(#mouse-glow)"
          style={{ transition: "cx 0.1s ease-out, cy 0.1s ease-out" }}
        />
      </svg>

      {/* Animated pulse waves from intersections */}
      {showPulse && (
        <div className="absolute inset-0">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${20 + i * 30}%`,
                top: `${30 + i * 20}%`,
                width: 4,
                height: 4,
                backgroundColor: colors.primary,
              }}
              animate={{
                scale: [1, 40, 60],
                opacity: [0.6, 0.2, 0],
              }}
              transition={{
                duration: pulseSpeed,
                repeat: Infinity,
                delay: i * (pulseSpeed / 3),
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Scanning horizontal line */}
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${colors.primary}40, transparent)`,
        }}
        animate={{
          top: ["0%", "100%"],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Scanning vertical line */}
      <motion.div
        className="absolute top-0 bottom-0 w-px"
        style={{
          background: `linear-gradient(180deg, transparent, ${colors.primary}40, transparent)`,
        }}
        animate={{
          left: ["0%", "100%"],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Corner accents */}
      {[
        { top: 0, left: 0, rotate: 0 },
        { top: 0, right: 0, rotate: 90 },
        { bottom: 0, right: 0, rotate: 180 },
        { bottom: 0, left: 0, rotate: 270 },
      ].map((pos, i) => (
        <motion.div
          key={i}
          className="absolute w-20 h-20"
          style={{
            ...pos,
            transform: `rotate(${pos.rotate}deg)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
        >
          <svg viewBox="0 0 80 80" className="w-full h-full">
            <path
              d="M 0 30 L 0 0 L 30 0"
              fill="none"
              stroke={colors.primary}
              strokeWidth="2"
              strokeOpacity="0.5"
            />
            <circle
              cx="0"
              cy="0"
              r="4"
              fill={colors.primary}
              fillOpacity="0.8"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

// Floating grid dots that move slowly
export function FloatingGridDots({ count = 20 }: { count?: number }) {
  const { colors } = useColorTheme();
  const [mounted, setMounted] = useState(false);

  // Generate stable random values once on mount (client only)
  const dots = useRef(
    Array.from({ length: count }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      opacity: 0.2 + Math.random() * 0.3,
      xDrift: Math.random() * 20 - 10,
      duration: 5 + Math.random() * 5,
      delay: Math.random() * 5,
    }))
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="absolute inset-0 overflow-hidden pointer-events-none" />;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.current.map((dot, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            backgroundColor: colors.primary,
            left: `${dot.left}%`,
            top: `${dot.top}%`,
            opacity: dot.opacity,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, dot.xDrift, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: dot.duration,
            repeat: Infinity,
            delay: dot.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
