"use client";

import { motion } from "framer-motion";
import { GraduationCap, Cpu } from "lucide-react";
import { useColorTheme } from "./color-theme-provider";
import { GlitchText, TextRevealOnScroll, WordStagger } from "@/components/animations";

const educationData = [
  {
    school: "RWTH Aachen University",
    degree: "M.Sc. Robotic Systems Engineering",
    years: "Oct 2025 - Present",
    flag: "DE",
    country: "Aachen, Germany",
  },
  {
    school: "Vishwakarma Institute of Information Technology",
    degree: "B.Tech. Mechanical Engineering - CGPA: 9.4/10 (German Grade: 1.3)",
    years: "Jan 2022 - June 2025",
    flag: "IN",
    country: "Pune, India",
  },
];

const techStack = [
  "C++",
  "Python",
  "ROS/ROS2",
  "Micro-ROS",
  "CUDA",
  "HPC",
  "AVX-512 SIMD",
  "Isaac ROS",
  "Nav2",
  "SLAM",
  "MoveIt",
  "Gazebo",
  "Isaac Sim",
  "OpenCV",
  "PyTorch",
  "TensorFlow",
  "YOLO",
  "Docker",
  "Linux",
  "Git",
  "Fusion 360",
  "CATIA",
  "SolidWorks",
  "3D Experience",
  "Ansys",
];

function CircuitLogo() {
  const { colors } = useColorTheme();
  
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      style={{ color: colors.primary }}
    >
      <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" />
      <path d="M16 12V4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 28V20" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 16H4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M28 16H20" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="4" r="2" fill="currentColor" />
      <circle cx="16" cy="28" r="2" fill="currentColor" />
      <circle cx="4" cy="16" r="2" fill="currentColor" />
      <circle cx="28" cy="16" r="2" fill="currentColor" />
      <path d="M19.5 12.5L24 8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12.5 19.5L8 24" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="24" cy="8" r="2" fill="currentColor" />
      <circle cx="8" cy="24" r="2" fill="currentColor" />
    </svg>
  );
}

function EducationCard() {
  const { colors } = useColorTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl md:col-span-2"
    >
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom right, ${colors.primary}0d, transparent, transparent)`,
        }}
      />
      
      <div className="relative z-10">
        <div className="mb-6 flex items-center gap-3">
          <div 
            className="flex h-10 w-10 items-center justify-center rounded-lg border"
            style={{
              borderColor: `${colors.primary}4d`,
              backgroundColor: `${colors.primary}1a`,
            }}
          >
            <GraduationCap className="h-5 w-5" style={{ color: colors.primary }} />
          </div>
          <h3 className="text-lg font-semibold text-white">Education</h3>
        </div>

        <div className="relative space-y-6">
          <div 
            className="absolute left-[7px] top-2 h-[calc(100%-16px)] w-px"
            style={{
              background: `linear-gradient(to bottom, ${colors.primary}, ${colors.primary}80, transparent)`,
            }}
          />

          {educationData.map((edu, index) => (
            <motion.div
              key={edu.school}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="relative pl-8"
            >
              <div 
                className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 bg-[#09090B]"
                style={{ borderColor: colors.primary }}
              >
                <div 
                  className="absolute inset-1 animate-pulse rounded-full"
                  style={{ backgroundColor: colors.primary }}
                />
              </div>

              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-mono text-white/60">
                      {edu.flag}
                    </span>
                    <span className="text-xs text-zinc-500">{edu.country}</span>
                  </div>
                  <h4 className="font-medium text-white">{edu.school}</h4>
                  <p className="text-sm text-zinc-400">{edu.degree}</p>
                </div>
                <span className="shrink-0 text-xs" style={{ color: colors.primary }}>{edu.years}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function MissionCard() {
  const { colors } = useColorTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border bg-black/60 p-8 text-center backdrop-blur-xl"
      style={{
        borderColor: `${colors.primary}66`,
        boxShadow: `0 0 30px ${colors.primary}26`,
      }}
    >
      <div 
        className="absolute inset-0 opacity-80"
        style={{
          background: `linear-gradient(to bottom right, ${colors.primary}26, ${colors.primary}0d, transparent)`,
        }}
      />
      
      <div className="relative z-10">
        <div className="mb-6 flex justify-center">
          <div 
            className="relative rounded-full border-2 p-4"
            style={{
              borderColor: `${colors.primary}99`,
              backgroundColor: `${colors.primary}33`,
              boxShadow: `0 0 25px ${colors.primary}66`,
            }}
          >
            <CircuitLogo />
            <div 
              className="absolute inset-0 rounded-full border animate-pulse"
              style={{ borderColor: `${colors.primary}33` }}
            />
          </div>
        </div>

        <blockquote className="relative">
          <span className="text-4xl font-light" style={{ color: `${colors.primary}80` }}>&quot;</span>
          <p className="text-balance px-4 py-2 text-sm font-medium leading-relaxed text-white md:text-base">
            <WordStagger 
              text="Transforming theoretical AI models into robust, real-world hardware deployments for Autonomous Mobile Robots in dynamic environments."
              staggerDelay={0.04}
              highlightWords={["ai", "autonomous", "robots"]}
            />
          </p>
          <span className="text-4xl font-light" style={{ color: `${colors.primary}80` }}>&quot;</span>
        </blockquote>

        <div className="mt-8 flex items-center justify-center gap-3">
          <div 
            className="h-px w-12"
            style={{
              background: `linear-gradient(to right, transparent, ${colors.primary}, transparent)`,
            }}
          />
          <Cpu 
            className="h-5 w-5"
            style={{ 
              color: colors.primary,
              filter: `drop-shadow(0 0 8px ${colors.primary}99)`,
            }}
          />
          <div 
            className="h-px w-12"
            style={{
              background: `linear-gradient(to left, transparent, ${colors.primary}, transparent)`,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function TechStackCard() {
  const { colors } = useColorTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl md:col-span-3"
    >
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom right, transparent, transparent, ${colors.primary}0d)`,
        }}
      />
      
      <div className="relative z-10 p-6 pb-4">
        <div className="mb-4 flex items-center gap-3">
          <div 
            className="flex h-10 w-10 items-center justify-center rounded-lg border"
            style={{
              borderColor: `${colors.primary}4d`,
              backgroundColor: `${colors.primary}1a`,
            }}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ color: colors.primary }}
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white">Tech Stack</h3>
        </div>
      </div>

      <div className="relative overflow-hidden pb-6">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-[#09090B] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-[#09090B] to-transparent" />

        <div className="flex animate-marquee gap-3">
          {[...techStack, ...techStack].map((tech, index) => (
            <span
              key={`${tech}-${index}`}
              className="group relative shrink-0 cursor-default rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-400 transition-all duration-300"
              style={{
                ["--hover-border" as string]: `${colors.primary}80`,
                ["--hover-color" as string]: colors.primary,
                ["--hover-shadow" as string]: `0 0 20px ${colors.primary}4d`,
                ["--hover-bg" as string]: `${colors.primary}1a`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${colors.primary}80`;
                e.currentTarget.style.color = colors.primary;
                e.currentTarget.style.boxShadow = `0 0 20px ${colors.primary}4d`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = '#a1a1aa';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span className="relative z-10">{tech}</span>
            </span>
          ))}
        </div>

        <div className="mt-3 flex animate-marquee-reverse gap-3">
          {[...techStack.slice().reverse(), ...techStack.slice().reverse()].map(
            (tech, index) => (
              <span
                key={`${tech}-reverse-${index}`}
                className="group relative shrink-0 cursor-default rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-400 transition-all duration-300"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${colors.primary}80`;
                  e.currentTarget.style.color = colors.primary;
                  e.currentTarget.style.boxShadow = `0 0 20px ${colors.primary}4d`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = '#a1a1aa';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span className="relative z-10">{tech}</span>
              </span>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function BentoGrid() {
  const { colors } = useColorTheme();
  
  return (
    <section className="relative min-h-screen bg-[#09090B] px-4 py-16 md:px-8 lg:px-16">
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at center, ${colors.primary}14 0%, ${colors.primary}05 40%, transparent 70%)`,
        }}
      />
      
      <div className="relative z-10 mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-2 text-3xl font-bold text-white md:text-4xl">
            <GlitchText intensity="low">Profile</GlitchText>
          </h2>
          <TextRevealOnScroll direction="up" delay={0.2}>
            <p className="text-zinc-500">Background & Expertise</p>
          </TextRevealOnScroll>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          <EducationCard />
          <MissionCard />
          <TechStackCard />
        </div>
      </div>
    </section>
  );
}
