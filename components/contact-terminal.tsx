"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Github, Linkedin, Terminal, ChevronRight, Zap, Download, FileText } from "lucide-react";
import { useColorTheme } from "./color-theme-provider";
import { GlitchText, ScrambleText } from "@/components/animations";

const contactData = [
  {
    command: "cat contact.json | jq '.email'",
    output: '"gupta.adyansh@gmail.com"',
    icon: Mail,
    link: "mailto:gupta.adyansh@gmail.com",
    label: "Email",
  },
  {
    command: "git remote get-url origin",
    output: "https://github.com/Adyansh04",
    icon: Github,
    link: "https://github.com/Adyansh04",
    label: "GitHub",
  },
  {
    command: "curl -s api.linkedin.com/profile",
    output: '"linkedin.com/in/adyanshgupta"',
    icon: Linkedin,
    link: "https://linkedin.com/in/adyanshgupta",
    label: "LinkedIn",
  },
];

function TypewriterText({ text, delay = 0, speed = 30, className = "", onComplete, cursorColor }: { text: string; delay?: number; speed?: number; className?: string; onComplete?: () => void; cursorColor?: string }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayedText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(interval);
          setIsComplete(true);
          onComplete?.();
        }
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, delay, speed, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-2 h-4 ml-0.5 align-middle"
          style={{ backgroundColor: cursorColor }}
        />
      )}
    </span>
  );
}

function TerminalLine({ data, index, isActive, onComplete, colors }: { data: typeof contactData[0]; index: number; isActive: boolean; onComplete: () => void; colors: { primary: string; primaryRgb: string } }) {
  const [showOutput, setShowOutput] = useState(false);
  const baseDelay = index * 2000;

  const handleCommandComplete = useCallback(() => {
    setShowOutput(true);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: baseDelay / 1000, duration: 0.3 }}
      className="mb-4"
    >
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color: colors.primary }} className="font-mono text-sm">adyansh@portfolio</span>
        <span className="text-white/40 font-mono text-sm">:</span>
        <span style={{ color: colors.primary }} className="font-mono text-sm">~</span>
        <span className="text-white/40 font-mono text-sm">$</span>
        {isActive && (
          <TypewriterText
            text={data.command}
            delay={100}
            speed={25}
            className="text-white/80 font-mono text-sm"
            onComplete={handleCommandComplete}
            cursorColor={colors.primary}
          />
        )}
      </div>

      <AnimatePresence>
        {showOutput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
            className="ml-4 flex items-center gap-2"
          >
            <ChevronRight className="w-3 h-3" style={{ color: `${colors.primary}99` }} />
            <a
              href={data.link}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm transition-colors duration-300 hover:underline"
              style={{ color: colors.primary }}
            >
              <TypewriterText
                text={data.output}
                delay={200}
                speed={20}
                onComplete={onComplete}
                cursorColor={colors.primary}
              />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CyberButton({ icon: Icon, label, href, index, colors }: { icon: React.ElementType; label: string; href: string; index: number; colors: { primary: string; primaryRgb: string } }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 6 + index * 0.2, duration: 0.5 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative"
    >
      <motion.div
        animate={{
          boxShadow: isHovered
            ? `0 0 30px ${colors.primary}66, 0 0 60px ${colors.primary}33`
            : `0 0 0px ${colors.primary}00`,
        }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 rounded-lg"
      />

      <div 
        className="relative flex items-center gap-3 px-6 py-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden transition-all duration-300"
        style={{
          borderColor: isHovered ? `${colors.primary}80` : undefined,
          backgroundColor: isHovered ? `${colors.primary}0d` : undefined,
        }}
      >
        <motion.div
          animate={{
            x: isHovered ? ["-100%", "200%"] : "-100%",
          }}
          transition={{
            duration: 1,
            repeat: isHovered ? Infinity : 0,
            ease: "linear",
          }}
          className="absolute inset-y-0 w-1/3"
          style={{
            background: `linear-gradient(to right, transparent, ${colors.primary}33, transparent)`,
          }}
        />

        {/* Corner brackets */}
        {[
          "top-0 left-0 border-t-2 border-l-2 rounded-tl",
          "top-0 right-0 border-t-2 border-r-2 rounded-tr",
          "bottom-0 left-0 border-b-2 border-l-2 rounded-bl",
          "bottom-0 right-0 border-b-2 border-r-2 rounded-br",
        ].map((classes, i) => (
          <motion.div
            key={i}
            animate={{
              opacity: isHovered ? [0.5, 1, 0.5] : 0.3,
              scale: isHovered ? [1, 1.1, 1] : 1,
            }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.25 }}
            className={`absolute w-3 h-3 ${classes}`}
            style={{ borderColor: colors.primary }}
          />
        ))}

        <div className="relative">
          <motion.div
            animate={{
              rotate: isHovered ? 360 : 0,
            }}
            transition={{ duration: 2, repeat: isHovered ? Infinity : 0, ease: "linear" }}
            className="absolute -inset-1 rounded-full border border-dashed"
            style={{ borderColor: `${colors.primary}4d` }}
          />
          <Icon
            className={`relative z-10 w-5 h-5 transition-all duration-300`}
            style={{ 
              color: isHovered ? colors.primary : "rgba(255,255,255,0.6)",
              filter: isHovered ? `drop-shadow(0 0 8px ${colors.primary}cc)` : undefined,
            }}
          />
        </div>

        <span
          className={`font-mono text-sm font-medium transition-all duration-300`}
          style={{ color: isHovered ? colors.primary : "rgba(255,255,255,0.7)" }}
        >
          {label}
        </span>

        <motion.div
          animate={{ x: isHovered ? 0 : -10, opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-auto"
        >
          <Zap className="w-4 h-4" style={{ color: colors.primary }} />
        </motion.div>
      </div>
    </motion.a>
  );
}

function ResumeDownloadButton({ colors }: { colors: { primary: string; primaryRgb: string } }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    setIsDownloading(true);
    // Simulate download start, then reset
    setTimeout(() => setIsDownloading(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 7.5, duration: 0.6 }}
      className="mt-12"
    >
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex items-center gap-2"
        >
          <div className="h-px w-8" style={{ backgroundColor: `${colors.primary}4d` }} />
          <span className="font-mono text-xs text-white/40 uppercase tracking-widest">Download Resume</span>
          <div className="h-px w-8" style={{ backgroundColor: `${colors.primary}4d` }} />
        </motion.div>

        <motion.a
          href="/my-portfolio/resume.pdf"
          download="Adyansh_Gupta_Resume.pdf"
          onClick={handleDownload}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group relative cursor-pointer"
        >
          {/* Animated glow background */}
          <motion.div
            animate={{
              boxShadow: isHovered
                ? `0 0 40px ${colors.primary}66, 0 0 80px ${colors.primary}33, inset 0 0 20px ${colors.primary}1a`
                : `0 0 20px ${colors.primary}33`,
            }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 rounded-xl"
          />

          {/* Main button container */}
          <div 
            className="relative flex items-center gap-4 px-8 py-5 rounded-xl border-2 bg-black/60 backdrop-blur-xl overflow-hidden transition-all duration-300"
            style={{
              borderColor: isHovered ? colors.primary : `${colors.primary}4d`,
              backgroundColor: isHovered ? `${colors.primary}0d` : "rgba(0,0,0,0.6)",
            }}
          >
            {/* Scanning line effect */}
            <motion.div
              animate={{
                y: isHovered ? ["-100%", "200%"] : "-100%",
              }}
              transition={{
                duration: 1.5,
                repeat: isHovered ? Infinity : 0,
                ease: "linear",
              }}
              className="absolute inset-x-0 h-1/4"
              style={{
                background: `linear-gradient(to bottom, transparent, ${colors.primary}26, transparent)`,
              }}
            />

            {/* Particle effects on hover */}
            {isHovered && [...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: (i % 2 === 0 ? 1 : -1) * (20 + i * 10),
                  y: -30 - i * 15,
                }}
                transition={{ duration: 1, delay: i * 0.1, repeat: Infinity }}
                className="absolute w-1 h-1 rounded-full"
                style={{ backgroundColor: colors.primary, left: "50%" }}
              />
            ))}

            {/* Corner brackets with animation */}
            {[
              "top-0 left-0 border-t-2 border-l-2 rounded-tl-lg",
              "top-0 right-0 border-t-2 border-r-2 rounded-tr-lg",
              "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg",
              "bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg",
            ].map((classes, i) => (
              <motion.div
                key={i}
                animate={{
                  opacity: isHovered ? [0.6, 1, 0.6] : 0.4,
                  scale: isHovered ? [1, 1.15, 1] : 1,
                }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                className={`absolute w-4 h-4 ${classes}`}
                style={{ borderColor: colors.primary }}
              />
            ))}

            {/* Icon with orbit ring */}
            <div className="relative">
              <motion.div
                animate={{
                  rotate: isHovered ? 360 : 0,
                  scale: isHovered ? 1.1 : 1,
                }}
                transition={{ duration: 3, repeat: isHovered ? Infinity : 0, ease: "linear" }}
                className="absolute -inset-2 rounded-full border border-dashed"
                style={{ borderColor: `${colors.primary}4d` }}
              />
              <motion.div
                animate={{
                  rotate: isHovered ? -360 : 0,
                }}
                transition={{ duration: 2, repeat: isHovered ? Infinity : 0, ease: "linear" }}
                className="absolute -inset-3 rounded-full border border-dotted opacity-50"
                style={{ borderColor: `${colors.primary}33` }}
              />
              <motion.div
                animate={{ 
                  rotate: isDownloading ? [0, 10, -10, 0] : 0,
                }}
                transition={{ duration: 0.3, repeat: isDownloading ? Infinity : 0 }}
              >
                <FileText
                  className="relative z-10 w-7 h-7 transition-all duration-300"
                  style={{ 
                    color: isHovered ? colors.primary : "rgba(255,255,255,0.7)",
                    filter: isHovered ? `drop-shadow(0 0 12px ${colors.primary})` : undefined,
                  }}
                />
              </motion.div>
            </div>

            {/* Text content */}
            <div className="flex flex-col">
              <span
                className="font-mono text-base font-semibold transition-all duration-300"
                style={{ color: isHovered ? colors.primary : "rgba(255,255,255,0.9)" }}
              >
                {isDownloading ? "Downloading..." : "Resume.pdf"}
              </span>
              <span className="font-mono text-xs text-white/40">
                {isDownloading ? "Please wait..." : "Click to download"}
              </span>
            </div>

            {/* Download icon with animation */}
            <motion.div
              animate={{ 
                y: isHovered ? [0, 3, 0] : 0,
                opacity: isHovered ? 1 : 0.6,
              }}
              transition={{ duration: 0.6, repeat: isHovered ? Infinity : 0 }}
              className="ml-2"
            >
              <Download 
                className="w-6 h-6 transition-all duration-300" 
                style={{ 
                  color: colors.primary,
                  filter: isHovered ? `drop-shadow(0 0 8px ${colors.primary})` : undefined,
                }}
              />
            </motion.div>

            {/* Data transfer visualization */}
            {isDownloading && (
              <motion.div
                className="absolute bottom-0 left-0 h-1 rounded-full"
                style={{ backgroundColor: colors.primary }}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, ease: "linear" }}
              />
            )}
          </div>
        </motion.a>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 8 }}
          className="font-mono text-xs text-white/30 text-center"
        >
          PDF format • Updated May 2026
        </motion.p>
      </div>
    </motion.div>
  );
}

function ContactParticles({ colors }: { colors: { primary: string; primaryRgb: string } }) {
  const [mounted, setMounted] = useState(false);
  const particles = useRef(
    Array.from({ length: 20 }, () => ({
      x: Math.random() * 1000,
      y: Math.random() * 800,
      yTarget: Math.random() * -200 - 100,
      duration: Math.random() * 5 + 5,
      delay: Math.random() * 5,
    }))
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {particles.current.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{ backgroundColor: `${colors.primary}4d` }}
          initial={{ x: p.x, y: p.y }}
          animate={{
            y: [null, p.yTarget],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
          }}
        />
      ))}
    </>
  );
}

export function ContactTerminal() {
  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const [completedLines, setCompletedLines] = useState<number[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const terminalRef = useRef<HTMLDivElement>(null);
  const { colors } = useColorTheme();

  const handleLineComplete = useCallback((index: number) => {
    setCompletedLines((prev) => [...prev, index]);
    if (index < contactData.length - 1) {
      setTimeout(() => setActiveLineIndex(index + 1), 500);
    }
  }, []);

  return (
    <section id="contact" className="relative min-h-screen bg-[#09090B] px-4 py-20 md:px-8 lg:px-16 overflow-hidden">
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at center, ${colors.primary}0d 0%, transparent 60%)`,
        }}
      />
      
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(${colors.primary} 1px, transparent 1px),
            linear-gradient(90deg, ${colors.primary} 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      <ContactParticles colors={colors} />

      <div className="relative z-10 mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <div 
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 mb-4"
            style={{
              borderColor: `${colors.primary}4d`,
              backgroundColor: `${colors.primary}1a`,
            }}
          >
            <Terminal className="w-4 h-4" style={{ color: colors.primary }} />
            <span className="font-mono text-sm" style={{ color: colors.primary }}>
              <ScrambleText text="ESTABLISH_CONNECTION" scrambleSpeed={40} />
            </span>
          </div>
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            <GlitchText intensity="low">Get In</GlitchText> <span style={{ color: colors.primary }}>Touch</span>
          </h2>
        </motion.div>

        <motion.div
          ref={terminalRef}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative mb-12 overflow-hidden rounded-xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <motion.div
                whileHover={{ scale: 1.2 }}
                className="h-3 w-3 rounded-full bg-[#FF5F57] shadow-[0_0_8px_rgba(255,95,87,0.5)]"
              />
              <motion.div
                whileHover={{ scale: 1.2 }}
                className="h-3 w-3 rounded-full bg-[#FEBC2E] shadow-[0_0_8px_rgba(254,188,46,0.5)]"
              />
              <motion.div
                whileHover={{ scale: 1.2 }}
                className="h-3 w-3 rounded-full bg-[#28C840] shadow-[0_0_8px_rgba(40,200,64,0.5)]"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-white/40">adyansh@portfolio:~$</span>
              <motion.div
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="h-3 w-1.5"
                style={{ backgroundColor: colors.primary }}
              />
            </div>

            <div className="flex items-center gap-1">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                />
              ))}
            </div>
          </div>

          <div className="relative p-6 min-h-[320px]">
            <motion.div
              animate={{ y: ["0%", "100%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-px"
              style={{
                background: `linear-gradient(to right, transparent, ${colors.primary}4d, transparent)`,
              }}
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 pb-4 border-b border-white/5"
            >
              <p className="font-mono text-xs text-white/30 mb-1">
                Last login: {mounted ? new Date().toLocaleDateString() : "..."} on ttys001
              </p>
              <p className="font-mono text-sm" style={{ color: colors.primary }}>
                Welcome! Initializing contact protocols...
              </p>
            </motion.div>

            {contactData.map((data, index) => (
              <TerminalLine
                key={index}
                data={data}
                index={index}
                isActive={index <= activeLineIndex}
                onComplete={() => handleLineComplete(index)}
                colors={colors}
              />
            ))}

            <AnimatePresence>
              {completedLines.length === contactData.length && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 pt-4 border-t border-white/5"
                >
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-t-transparent rounded-full"
                      style={{ borderColor: colors.primary, borderTopColor: "transparent" }}
                    />
                    <span className="font-mono text-sm" style={{ color: colors.primary }}>
                      Connection established. Ready for transmission.
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="absolute inset-0 rounded-xl pointer-events-none">
            <div 
              className="absolute inset-0 rounded-xl border"
              style={{ borderColor: `${colors.primary}33` }}
            />
            <motion.div
              animate={{
                left: ["-50%", "100%"],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 h-px w-1/2"
              style={{ 
                background: `linear-gradient(90deg, transparent, ${colors.primary}80, transparent)` 
              }}
            />
          </div>
        </motion.div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
          {contactData.map((data, index) => (
            <CyberButton
              key={index}
              icon={data.icon}
              label={data.label}
              href={data.link}
              index={index}
              colors={colors}
            />
          ))}
        </div>

        <ResumeDownloadButton colors={colors} />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 7 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/20" />
            <span className="font-mono text-xs text-white/30">EOF</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/20" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
