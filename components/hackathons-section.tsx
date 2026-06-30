"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Award, Building2, Calendar } from "lucide-react";
import { useColorTheme } from "./color-theme-provider";
import {
  GlitchText,
  TextRevealOnScroll,
  ScrambleText,
  AnimatedGridBackground,
  FloatingGridDots,
} from "@/components/animations";

const hackathons = [
  {
    id: 1,
    rank: "1st Place",
    icon: Trophy,
    accent: "#fbbf24", // gold
    title: "Game AI Hackathon",
    organizer: "AI Club Aachen",
    date: "Jun 2026",
    description:
      "Developed an autonomous pathfinding agent for the Hex game, outmaneuvering competing bots through efficient search and adversarial strategy.",
    tags: ["Game AI", "Pathfinding", "Adversarial Search"],
  },
  {
    id: 2,
    rank: "2nd Place",
    icon: Medal,
    accent: "#d4d4d8", // silver
    title: "Bonding × Itestra Hackathon",
    organizer: "Itestra",
    date: "May 2026",
    description:
      "Built autonomous bots for a multiplayer Snake variant, fusing real-time pathfinding with on-the-fly resource management under tight latency constraints.",
    tags: ["Autonomous Agents", "Real-Time Pathfinding", "Resource Mgmt"],
  },
  {
    id: 3,
    rank: "Best Technical Implementation",
    icon: Award,
    accent: null, // falls back to the active theme accent
    title: "AI+Robotics Hackathon 2025",
    organizer: "RWTH Aachen",
    date: "Nov 2025",
    description:
      "Recognized for a flawless sim-to-real robotic manipulation pipeline — bridging spatial perception (NvBlox, FoundationPose) with collision-free MoveIt planning.",
    tags: ["Sim-to-Real", "Manipulation", "Perception"],
  },
];

function HackathonCard({
  hackathon,
  index,
}: {
  hackathon: (typeof hackathons)[0];
  index: number;
}) {
  const { colors } = useColorTheme();
  const [isHovered, setIsHovered] = useState(false);
  const Icon = hackathon.icon;
  // Medals carry their own rank colour (gold / silver); awards inherit the theme accent.
  const medal = hackathon.accent ?? colors.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: index * 0.15, ease: "easeOut" }}
      whileHover={{ y: -6 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative h-full"
    >
      <div
        className="relative flex h-full flex-col overflow-hidden rounded-xl border bg-black/50 p-6 backdrop-blur-xl transition-all duration-500"
        style={{
          borderColor: isHovered ? `${colors.primary}80` : "rgba(255,255,255,0.1)",
          boxShadow: isHovered ? `0 0 30px ${colors.primary}1f` : undefined,
        }}
      >
        {/* Corner accents */}
        <div
          className="pointer-events-none absolute left-0 top-0 h-4 w-4 border-l border-t"
          style={{ borderColor: `${colors.primary}66` }}
        />
        <div
          className="pointer-events-none absolute right-0 top-0 h-4 w-4 border-r border-t"
          style={{ borderColor: `${colors.primary}66` }}
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 h-4 w-4 border-b border-l"
          style={{ borderColor: `${colors.primary}66` }}
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 h-4 w-4 border-b border-r"
          style={{ borderColor: `${colors.primary}66` }}
        />

        {/* Hover shimmer sweep */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(115deg, transparent 30%, ${colors.primary}14 50%, transparent 70%)`,
          }}
          initial={{ x: "-120%" }}
          animate={{ x: isHovered ? "120%" : "-120%" }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
        />

        {/* Header: medal + rank label */}
        <div className="relative z-10 mb-5 flex items-center justify-between gap-3">
          <div className="relative flex h-14 w-14 items-center justify-center">
            {/* rotating dashed ring */}
            <motion.div
              className="absolute inset-0 rounded-full border border-dashed"
              style={{ borderColor: `${medal}59` }}
              animate={{ rotate: isHovered ? 360 : 0 }}
              transition={{
                duration: 6,
                repeat: isHovered ? Infinity : 0,
                ease: "linear",
              }}
            />
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300"
              style={{
                borderColor: `${medal}80`,
                backgroundColor: `${medal}1a`,
                boxShadow: isHovered ? `0 0 18px ${medal}66` : undefined,
              }}
            >
              <Icon
                className="h-5 w-5"
                style={{
                  color: medal,
                  filter: `drop-shadow(0 0 6px ${medal}99)`,
                }}
              />
            </div>
          </div>

          <span
            className="rounded-full border px-3 py-1 font-mono text-xs font-medium uppercase tracking-wide"
            style={{
              borderColor: `${medal}59`,
              backgroundColor: `${medal}14`,
              color: medal,
            }}
          >
            {hackathon.rank}
          </span>
        </div>

        {/* Title */}
        <h3 className="relative z-10 mb-2 text-xl font-bold leading-snug text-white">
          {hackathon.title}
        </h3>

        {/* Organizer + date */}
        <div className="relative z-10 mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1.5 text-white/50">
            <Building2 className="h-3.5 w-3.5" style={{ color: `${colors.primary}b3` }} />
            <span className="font-mono">{hackathon.organizer}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-white/40">
            <Calendar className="h-3.5 w-3.5" style={{ color: `${colors.primary}80` }} />
            <span className="font-mono">{hackathon.date}</span>
          </span>
        </div>

        {/* Divider */}
        <div
          className="relative z-10 mb-4 h-px w-full"
          style={{
            background: `linear-gradient(to right, ${colors.primary}40, transparent)`,
          }}
        />

        {/* Description */}
        <p className="relative z-10 mb-5 flex-1 text-sm leading-relaxed text-white/60">
          {hackathon.description}
        </p>

        {/* Tags */}
        <div className="relative z-10 flex flex-wrap gap-2">
          {hackathon.tags.map((tag) => (
            <span
              key={tag}
              className="rounded border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-white/60 transition-colors duration-300"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${colors.primary}66`;
                e.currentTarget.style.color = colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.color = "rgba(255,255,255,0.6)";
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Bottom scan line on hover */}
        <motion.div
          className="pointer-events-none absolute bottom-0 left-0 h-0.5 w-full origin-left"
          style={{
            background: `linear-gradient(to right, transparent, ${colors.primary}, transparent)`,
          }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0, opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </motion.div>
  );
}

export function HackathonsSection() {
  const { colors } = useColorTheme();

  return (
    <section
      id="achievements"
      className="relative bg-[#09090B] px-4 py-24 md:px-8 lg:px-16"
    >
      {/* Animated grid background */}
      <AnimatedGridBackground
        gridSize={55}
        lineOpacity={0.04}
        pulseSpeed={7}
        showPulse={true}
      />
      <FloatingGridDots count={10} />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at top, ${colors.primary}0d 0%, transparent 50%)`,
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5"
            style={{
              borderColor: `${colors.primary}4d`,
              backgroundColor: `${colors.primary}1a`,
            }}
          >
            <Trophy className="h-4 w-4" style={{ color: colors.primary }} />
            <span className="font-mono text-xs" style={{ color: colors.primary }}>
              <ScrambleText text="HACKATHONS & ACHIEVEMENTS" scrambleSpeed={40} />
            </span>
          </div>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
            <GlitchText intensity="low">Built to Win</GlitchText>
          </h2>
          <TextRevealOnScroll direction="up" delay={0.2}>
            <p className="mx-auto mt-4 max-w-2xl text-white/50">
              Rapid prototyping under pressure — autonomous agents, robotics
              pipelines, and AI systems engineered (and ranked) against the clock.
            </p>
          </TextRevealOnScroll>
        </motion.div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {hackathons.map((hackathon, index) => (
            <HackathonCard key={hackathon.id} hackathon={hackathon} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
