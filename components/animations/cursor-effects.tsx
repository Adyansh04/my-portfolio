"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useColorTheme } from "../color-theme-provider";

// Cursor Trail Effect - Particles follow mouse movement
export function CursorTrail() {
  const { colors } = useColorTheme();
  const [trails, setTrails] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const trailIdRef = useRef(0);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Only add trail if mouse moved enough
      if (distance > 15) {
        lastPosRef.current = { x: e.clientX, y: e.clientY };
        const newTrail = {
          id: trailIdRef.current++,
          x: e.clientX,
          y: e.clientY,
        };

        setTrails((prev) => [...prev.slice(-15), newTrail]);

        // Remove after animation
        setTimeout(() => {
          setTrails((prev) => prev.filter((t) => t.id !== newTrail.id));
        }, 600);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      <AnimatePresence>
        {trails.map((trail, index) => (
          <motion.div
            key={trail.id}
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 0, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute rounded-full"
            style={{
              left: trail.x,
              top: trail.y,
              width: 8 - index * 0.3,
              height: 8 - index * 0.3,
              backgroundColor: colors.primary,
              boxShadow: `0 0 10px ${colors.primary}, 0 0 20px ${colors.primary}50`,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Cursor Glow Effect - Circular glow around cursor
export function CursorGlow() {
  const { colors } = useColorTheme();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    // Detect hoverable elements
    const handleElementHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive =
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.closest("button") ||
        target.closest("a") ||
        target.dataset.magnetic === "true";
      setIsHovering(isInteractive);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousemove", handleElementHover);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousemove", handleElementHover);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <motion.div
      className="pointer-events-none fixed z-[9998]"
      animate={{
        x: position.x - (isHovering ? 30 : 150),
        y: position.y - (isHovering ? 30 : 150),
        scale: isHovering ? 0.4 : 1,
      }}
      transition={{
        type: "spring",
        damping: 30,
        stiffness: 200,
        mass: 0.5,
      }}
    >
      <div
        className="rounded-full transition-all duration-300"
        style={{
          width: 300,
          height: 300,
          background: `radial-gradient(circle, ${colors.primary}15 0%, ${colors.primary}08 30%, transparent 70%)`,
          filter: "blur(1px)",
        }}
      />
    </motion.div>
  );
}

// Interactive Hover Ripples - Ripples on click
export function ClickRipples() {
  const { colors } = useColorTheme();
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const rippleIdRef = useRef(0);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const newRipple = {
        id: rippleIdRef.current++,
        x: e.clientX,
        y: e.clientY,
      };

      setRipples((prev) => [...prev, newRipple]);

      // Remove after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 1000);
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9997]">
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute rounded-full"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 50,
              height: 50,
              border: `2px solid ${colors.primary}`,
              transform: "translate(-50%, -50%)",
              boxShadow: `0 0 20px ${colors.primary}40`,
            }}
          />
        ))}
      </AnimatePresence>
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={`inner-${ripple.id}`}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute rounded-full"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 30,
              height: 30,
              backgroundColor: `${colors.primary}30`,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Magnetic Elements Hook - Elements move toward cursor
export function useMagnetic(strength: number = 0.3) {
  const ref = useRef<HTMLElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;

      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
      const maxDistance = 150;

      if (distance < maxDistance) {
        const factor = (1 - distance / maxDistance) * strength;
        setPosition({
          x: distanceX * factor,
          y: distanceY * factor,
        });
      } else {
        setPosition({ x: 0, y: 0 });
      }
    },
    [strength]
  );

  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  return { ref, position, handleMouseLeave };
}

// Magnetic Button Wrapper Component
export function MagneticElement({
  children,
  strength = 0.3,
  className = "",
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const { ref, position, handleMouseLeave } = useMagnetic(strength);

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", damping: 15, stiffness: 150 }}
      className={className}
      data-magnetic="true"
    >
      {children}
    </motion.div>
  );
}

// Combined Cursor Effects Provider
export function CursorEffectsProvider({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    // Check if device has fine pointer (mouse)
    const mediaQuery = window.matchMedia("(pointer: fine)");
    setIsMobile(!mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(!e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <>
      {children}
      {!isMobile && (
        <>
          <CursorGlow />
          <CursorTrail />
          <ClickRipples />
        </>
      )}
    </>
  );
}
