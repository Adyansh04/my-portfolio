"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Award, 
  BadgeCheck, 
  ChevronRight,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { useColorTheme } from "./color-theme-provider";
import { GlitchText, TextRevealOnScroll, ScrambleText } from "@/components/animations";

const credentialsData = [
  {
    id: "publications",
    title: "Publications",
    icon: Award,
    items: [
      {
        title: "Detection and Classification of Bleeding and Non-Bleeding Frames in Wireless Capsule Endoscopy",
        id: "Medical AI Publication",
        year: "2024",
        status: "Published",
        description: "Novel approach for detecting and classifying bleeding frames in wireless capsule endoscopy images using computer vision.",
        highlights: ["Medical Imaging", "CNN", "Healthcare AI"],
        link: "https://drive.google.com/file/d/1FePNRh9wq2w9w4O51xjMNVf6DGS1LUKM/view?usp=drive_link"
      }
    ]
  },
  {
    id: "patents",
    title: "Patents",
    icon: FileText,
    items: [
      {
        title: "Advanced 3D Printed Remote-Controlled All-Terrain Rocker-Bogie Robot",
        id: "Patent Filed",
        year: "2024",
        status: "Filed",
        description: "A novel design for an all-terrain robot utilizing rocker-bogie suspension mechanism with 3D printed components for remote exploration applications.",
        highlights: ["Rocker-Bogie", "3D Printing", "All-Terrain"],
        link: "https://drive.google.com/file/d/1BeKOU9QsQ0hL8qVrjmmeqLIBbmG4J3RW/view?usp=drive_link"
      },
      {
        title: "An Omni Directional Mobile Robot",
        id: "Patent Filed",
        year: "2024",
        status: "Filed",
        description: "Patent for an innovative omnidirectional mobile robot design enabling movement in any direction without changing orientation.",
        highlights: ["Omnidirectional", "Mobile Robot", "Mecanum Drive"],
        link: "https://drive.google.com/file/d/1BeKOU9QsQ0hL8qVrjmmeqLIBbmG4J3RW/view?usp=drive_link"
      }
    ]
  },
  {
    id: "certifications",
    title: "Certifications",
    icon: BadgeCheck,
    items: [
      {
        title: "Advanced Certification in Data Science and AI",
        id: "IIT Madras, Intellipaat",
        year: "2024",
        status: "Active",
        description: "Comprehensive certification covering advanced data science techniques, machine learning algorithms, and AI applications from IIT Madras.",
        highlights: ["Machine Learning", "Deep Learning", "Predictive Modeling"],
        link: "https://drive.google.com/file/d/1KLEyAVWOMpfkilnTiJqKpG8NTFEPOcDT/view?usp=drive_link"
      },
      {
        title: "ROS2 MoveIt, Gazebo, Navigation and Advanced Concepts",
        id: "Udemy Certification",
        year: "2024",
        status: "Active",
        description: "Advanced ROS2 certification covering MoveIt motion planning, Gazebo simulation, and navigation stack implementation.",
        highlights: ["MoveIt", "Gazebo", "Nav2", "ROS2"],
        link: "https://drive.google.com/file/d/1glprtXE1YV5y1_LlZmUKI2IFx1-LucRs/view?usp=drive_link"
      },
      {
        title: "Autodesk Fusion 360 CAD/CAM/CAE and Generative Design Specialization",
        id: "Coursera Certification",
        year: "2023",
        status: "Active",
        description: "Specialization in CAD/CAM/CAE design tools with focus on generative design principles using Autodesk Fusion 360.",
        highlights: ["CAD/CAM/CAE", "Generative Design", "Fusion 360"],
        link: "https://drive.google.com/drive/folders/1xUfs95T5NZ-3d5trjKRCzu4LOs6S8328?usp=drive_link"
      }
    ]
  }
];

function AccordionHeader({ section, isOpen, onClick, index }: { section: typeof credentialsData[0]; isOpen: boolean; onClick: () => void; index: number }) {
  const Icon = section.icon;
  const { colors } = useColorTheme();
  
  return (
    <motion.button
      onClick={onClick}
      className="group relative w-full"
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div 
        className={`
          relative flex items-center justify-between px-6 py-5
          bg-gradient-to-r from-black/80 via-black/60 to-black/80
          border border-white/10 rounded-lg
          backdrop-blur-xl overflow-hidden
          transition-all duration-500
        `}
        style={{
          borderColor: isOpen ? `${colors.primary}80` : undefined,
          boxShadow: isOpen 
            ? `0 0 30px ${colors.primary}33, inset 0 1px 0 ${colors.primary}1a` 
            : undefined,
        }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to right, transparent, ${colors.primary}1a, transparent)` }}
          initial={{ x: "-100%" }}
          animate={{ x: isOpen ? "100%" : "-100%" }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        
        <div 
          className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 transition-colors duration-300`}
          style={{ borderColor: isOpen ? colors.primary : "rgba(255,255,255,0.2)" }}
        />
        <div 
          className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 transition-colors duration-300`}
          style={{ borderColor: isOpen ? colors.primary : "rgba(255,255,255,0.2)" }}
        />
        <div 
          className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 transition-colors duration-300`}
          style={{ borderColor: isOpen ? colors.primary : "rgba(255,255,255,0.2)" }}
        />
        <div 
          className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 transition-colors duration-300`}
          style={{ borderColor: isOpen ? colors.primary : "rgba(255,255,255,0.2)" }}
        />

        <div className="relative z-10 flex items-center gap-4">
          <div 
            className="relative flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-500"
            style={{
              backgroundColor: isOpen ? `${colors.primary}33` : "rgba(255,255,255,0.05)",
              boxShadow: isOpen ? `0 0 20px ${colors.primary}66` : undefined,
            }}
          >
            <Icon 
              className="w-6 h-6 transition-all duration-300"
              style={{ 
                color: isOpen ? colors.primary : "rgba(255,255,255,0.6)",
                filter: isOpen ? `drop-shadow(0 0 8px ${colors.primary}cc)` : undefined,
              }}
            />
            
            <motion.div
              className="absolute inset-0 rounded-lg border transition-colors duration-300"
              style={{ borderColor: isOpen ? `${colors.primary}66` : "transparent" }}
              animate={{ rotate: isOpen ? 360 : 0 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
          </div>
          
          <div className="text-left">
            <h3 
              className="text-lg font-semibold tracking-wide transition-colors duration-300"
              style={{ color: isOpen ? colors.primary : "white" }}
            >
              {section.title}
            </h3>
            <p className="text-xs text-white/40 font-mono uppercase tracking-widest">
              {section.id.toUpperCase()}_REGISTRY
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-sm transition-all duration-300"
            style={{
              backgroundColor: isOpen ? `${colors.primary}33` : "rgba(255,255,255,0.05)",
              color: isOpen ? colors.primary : "rgba(255,255,255,0.6)",
              borderColor: isOpen ? `${colors.primary}66` : "rgba(255,255,255,0.1)",
              borderWidth: "1px",
              borderStyle: "solid",
            }}
          >
            <span 
              className={`w-2 h-2 rounded-full ${isOpen ? "animate-pulse" : ""}`}
              style={{ backgroundColor: isOpen ? colors.primary : "rgba(255,255,255,0.4)" }}
            />
            <span>{section.items.length}</span>
            <span className="text-xs opacity-60">ITEMS</span>
          </div>

          <motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <ChevronRight 
              className="w-5 h-5 transition-colors duration-300"
              style={{ color: isOpen ? colors.primary : "rgba(255,255,255,0.4)" }}
            />
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5"
          style={{ background: `linear-gradient(to right, transparent, ${colors.primary}, transparent)` }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: isOpen ? 1 : 0, opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </motion.button>
  );
}

function AccordionItem({ item, index }: { item: typeof credentialsData[0]["items"][0]; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const { colors } = useColorTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20, height: 0 }}
      animate={{ opacity: 1, x: 0, height: "auto" }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative pl-6"
    >
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-0.5"
        style={{ background: `linear-gradient(to bottom, ${colors.primary}99, ${colors.primary}4d, transparent)` }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
      />
      
      <motion.div
        className="absolute left-[-4px] top-6 w-2 h-2 rounded-full"
        style={{ backgroundColor: colors.primary }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: colors.primary }}
          animate={{ scale: isHovered ? 2 : 1, opacity: isHovered ? 0 : 1 }}
          transition={{ duration: 0.5 }}
        />
      </motion.div>

      <div 
        className="relative p-5 ml-4 rounded-lg bg-black/40 border border-white/5 backdrop-blur-sm transition-all duration-300"
        style={{
          borderColor: isHovered ? `${colors.primary}4d` : undefined,
          boxShadow: isHovered ? `0 0 20px ${colors.primary}1a` : undefined,
        }}
      >
        <motion.div
          className="absolute inset-0 rounded-lg"
          style={{ background: `linear-gradient(to right, ${colors.primary}08, transparent, transparent)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <h4 className="text-white font-medium mb-1 leading-tight">
                {item.title}
              </h4>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-xs" style={{ color: `${colors.primary}cc` }}>{item.id}</span>
                <span className="text-xs text-white/30">|</span>
                <span className="font-mono text-xs text-white/50">{item.year}</span>
              </div>
            </div>
            
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium"
              style={{
                backgroundColor: item.status === "Published" || item.status === "Active"
                  ? `${colors.primary}33`
                  : item.status === "Filed"
                  ? "rgba(16, 185, 129, 0.2)"
                  : "rgba(255,255,255,0.1)",
                color: item.status === "Published" || item.status === "Active"
                  ? colors.primary
                  : item.status === "Filed"
                  ? "#34d399"
                  : "rgba(255,255,255,0.6)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: item.status === "Published" || item.status === "Active"
                  ? `${colors.primary}4d`
                  : item.status === "Filed"
                  ? "rgba(16, 185, 129, 0.3)"
                  : "rgba(255,255,255,0.1)",
              }}
            >
              {(item.status === "Published" || item.status === "Active") && (
                <Sparkles className="w-3 h-3" />
              )}
              {item.status}
            </div>
          </div>

          <p className="text-sm text-white/50 leading-relaxed mb-4">
            {item.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {item.highlights.map((highlight, i) => (
              <motion.span
                key={highlight}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 + i * 0.05 + 0.2 }}
                className="inline-flex items-center px-2.5 py-1 rounded font-mono text-xs bg-white/5 text-white/60 border border-white/10 transition-all duration-300 hover:text-white/80"
                style={{
                  ["--hover-border" as string]: `${colors.primary}66`,
                  ["--hover-color" as string]: colors.primary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${colors.primary}66`;
                  e.currentTarget.style.color = colors.primary;
                  e.currentTarget.style.backgroundColor = `${colors.primary}08`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                }}
              >
                <span 
                  className="w-1 h-1 rounded-full mr-2"
                  style={{ backgroundColor: `${colors.primary}99` }}
                />
                {highlight}
              </motion.span>
            ))}
          </div>

          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs transition-colors"
              style={{ color: `${colors.primary}b3` }}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.primary}
              onMouseLeave={(e) => e.currentTarget.style.color = `${colors.primary}b3`}
            >
              <ExternalLink className="w-3 h-3" />
              View Document
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function AccordionSection({ section, index }: { section: typeof credentialsData[0]; index: number }) {
  const [isOpen, setIsOpen] = useState(index === 0);

  return (
    <div className="space-y-3">
      <AccordionHeader
        section={section}
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        index={index}
      />
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-4 py-2 pl-4">
              {section.items.map((item, i) => (
                <AccordionItem key={item.title} item={item} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CredentialParticles({ colors }: { colors: { primary: string; primaryRgb: string } }) {
  const [mounted, setMounted] = useState(false);
  const particles = useRef(
    Array.from({ length: 15 }, () => ({
      x: Math.random() * 100 + "%",
      y: Math.random() * 100 + "%",
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5,
    }))
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.current.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{ backgroundColor: `${colors.primary}4d` }}
          initial={{ x: p.x, y: p.y }}
          animate={{
            y: [null, "-100%"],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

export function CredentialsAccordion() {
  const { colors } = useColorTheme();
  
  return (
    <section className="relative min-h-screen bg-[#09090B] px-4 py-20 md:px-8 lg:px-16 overflow-hidden">
      <div 
        className="absolute inset-0"
        style={{ background: `radial-gradient(ellipse at top, ${colors.primary}0d 0%, transparent 50%)` }}
      />
      
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(${colors.primary}4d 1px, transparent 1px),
            linear-gradient(90deg, ${colors.primary}4d 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px"
        }}
      />

      <CredentialParticles colors={colors} />

      <div className="relative z-10 mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-4"
            style={{
              borderColor: `${colors.primary}33`,
              backgroundColor: `${colors.primary}0d`,
            }}
          >
            <div 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: colors.primary }}
            />
            <span 
              className="font-mono text-xs uppercase tracking-widest"
              style={{ color: colors.primary }}
            >
              <ScrambleText text="Credentials Registry" scrambleSpeed={50} />
            </span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            <GlitchText intensity="low">Publications, Patents &</GlitchText>{" "}
            <span 
              style={{ 
                color: colors.primary,
                filter: `drop-shadow(0 0 20px ${colors.primary}80)`,
              }}
            >
              Certifications
            </span>
          </h2>
          
          <TextRevealOnScroll direction="up" delay={0.2}>
            <p className="text-white/50 max-w-xl mx-auto">
              Academic contributions and professional credentials in robotics and AI
            </p>
          </TextRevealOnScroll>
        </motion.div>

        <div className="space-y-4">
          {credentialsData.map((section, index) => (
            <AccordionSection key={section.id} section={section} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 flex items-center justify-center gap-4"
        >
          <div 
            className="h-px w-16"
            style={{ background: `linear-gradient(to right, transparent, ${colors.primary}4d)` }}
          />
          <ExternalLink className="w-4 h-4" style={{ color: `${colors.primary}66` }} />
          <div 
            className="h-px w-16"
            style={{ background: `linear-gradient(to left, transparent, ${colors.primary}4d)` }}
          />
        </motion.div>
      </div>
    </section>
  );
}
