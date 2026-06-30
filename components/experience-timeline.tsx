"use client"

import { useEffect, useRef, useState } from "react"
import { Briefcase, Cpu, Rocket, Code, GraduationCap, Bot } from "lucide-react"
import { useColorTheme } from "./color-theme-provider"
import { GlitchText, TextRevealOnScroll, AnimatedGridBackground, FloatingGridDots, ParallaxLayer } from "@/components/animations"

const experiences = [
  {
    id: 6,
    title: "Robotics Software Developer",
    company: "Robotics Collective",
    location: "Aachen, Germany",
    period: "May 2026 - Present",
    icon: Bot,
    highlights: [
      { metric: "Unitree R1", label: "Humanoid" },
      { metric: "Vision", label: "Guided Arm" },
    ],
    badges: ["Robotic Arm", "RGB Vision", "Teleoperation", "Speech Recognition"],
    description: "Developing an automated cable insertion pipeline using a robotic arm and RGB cameras for precise, vision-guided manipulation. Integrated teleoperation and speech-recognition on a Unitree R1 humanoid to enable real-time human-robot interaction for live demonstrations.",
  },
  {
    id: 1,
    title: "Mobile Robotics Intern",
    company: "Addverb Technologies",
    location: "Noida, India",
    period: "April 2025 - August 2025",
    icon: Rocket,
    highlights: [
      { metric: "180% → 15%", label: "CPU Reduction" },
      { metric: "AVX-512", label: "SIMD Optimization" },
    ],
    badges: ["C++", "HPC", "AVX-512 SIMD", "LIO"],
    description: "Engineered a new C++ implementation of the WhyCode/Whycon fiducial marker system utilizing HPC techniques. Worked on camera drivers using shared memory and assisted in integrating Lidar-Inertial Odometry (LIO) for improved robot positioning.",
  },
  {
    id: 2,
    title: "Robotics Intern",
    company: "Sakar Robotics",
    location: "Pune, India",
    period: "August 2024 - April 2025",
    icon: Cpu,
    highlights: [
      { metric: "AMR", label: "Industrial Focus" },
      { metric: "Jetson", label: "GPU Platform" },
    ],
    badges: ["Isaac ROS", "NVIDIA Jetson", "Computer Vision", "Nav2"],
    description: "Collaborated on development of autonomous industrial AMRs with advanced navigation systems. Implemented computer vision using AI technologies and worked extensively with NVIDIA Jetson hardware and Isaac ROS.",
  },
  {
    id: 3,
    title: "Drone Systems Development Intern",
    company: "Avignon University",
    location: "Avignon, France",
    period: "June 2024 - July 2024",
    icon: Rocket,
    highlights: [
      { metric: "20/20", label: "Perfect Score" },
      { metric: "ROS2", label: "Framework" },
    ],
    badges: ["ROS2", "Drone Systems", "ArUco", "Indoor Nav"],
    description: "Developed drone systems for Indoor Navigation, Object Tracking, and ArUco-based Inventory Management using ROS2. Achieved a perfect score of 20/20, distinguishing myself among all students.",
  },
  {
    id: 4,
    title: "Engineering Design Intern",
    company: "Dassault Systems",
    location: "Pune, India",
    period: "Sept 2023 - Jan 2024",
    icon: Code,
    highlights: [
      { metric: "3D", label: "Digital Twin" },
      { metric: "CAE", label: "Simulation" },
    ],
    badges: ["3D Experience", "CATIA", "Simulation", "CAE"],
    description: "Led the conversion of a Pelton Wheel Turbine into a precise 3D digital twin and performed simulations for optimal performance.",
  },
  {
    id: 5,
    title: "Vice President, Mechatronics Engineer",
    company: "VIIT Robotics (College Club)",
    location: "Pune, India",
    period: "Aug 2022 - July 2024",
    icon: GraduationCap,
    highlights: [
      { metric: "Team", label: "Leadership" },
      { metric: "R&D", label: "Projects" },
    ],
    badges: ["Leadership", "Mechatronics", "Prototyping", "Team Management"],
    description: "Led a team of talented robotics enthusiasts, fostering collaboration and ensuring efficient project execution. Utilized mechatronics engineering skills to design, prototype, and test robotics components.",
  },
]

function RadarNode({ isActive, index }: { isActive: boolean; index: number }) {
  const { colors } = useColorTheme()
  
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer pulsing rings */}
      <div
        className={`absolute h-12 w-12 rounded-full border transition-all duration-500 ${
          isActive ? "animate-ping opacity-100" : "opacity-0"
        }`}
        style={{ 
          borderColor: `${colors.primary}4d`,
          animationDuration: "2s" 
        }}
      />
      <div
        className={`absolute h-8 w-8 rounded-full border transition-all duration-500 ${
          isActive ? "animate-ping opacity-100" : "opacity-0"
        }`}
        style={{ 
          borderColor: `${colors.primary}80`,
          animationDuration: "1.5s", 
          animationDelay: "0.2s" 
        }}
      />
      
      {/* Core node */}
      <div
        className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full transition-all duration-300 ${
          isActive
            ? ""
            : "border"
        }`}
        style={{
          backgroundColor: isActive ? colors.primary : `${colors.primary}4d`,
          borderColor: isActive ? undefined : `${colors.primary}80`,
          boxShadow: isActive ? `0 0 20px ${colors.primary}cc` : undefined,
        }}
      >
        <div
          className={`h-2 w-2 rounded-full transition-all duration-300`}
          style={{
            backgroundColor: isActive ? "#09090B" : `${colors.primary}80`,
          }}
        />
      </div>
      
      {/* Scanning line effect */}
      {isActive && (
        <div
          className="absolute h-6 w-px animate-pulse"
          style={{
            background: `linear-gradient(to bottom, transparent, ${colors.primary}, transparent)`,
            animation: "scan 1s ease-in-out infinite",
          }}
        />
      )}
    </div>
  )
}

function ExperienceCard({
  experience,
  isLeft,
  isActive,
  index,
}: {
  experience: (typeof experiences)[0]
  isLeft: boolean
  isActive: boolean
  index: number
}) {
  const Icon = experience.icon
  const { colors } = useColorTheme()

  return (
    <div
      className={`group relative transition-all duration-700 ${
        isActive
          ? "opacity-100 translate-y-0"
          : "opacity-40 translate-y-4"
      } ${isLeft ? "lg:pr-12" : "lg:pl-12"}`}
      style={{
        transitionDelay: `${index * 100}ms`,
      }}
    >
      {/* Connector line to timeline */}
      <div
        className={`absolute top-8 hidden h-px w-12 lg:block ${
          isLeft ? "right-0" : "left-0"
        }`}
        style={{
          background: isActive 
            ? `linear-gradient(to right, ${colors.primary}cc, ${colors.primary}33)` 
            : "rgba(255,255,255,0.1)",
          transform: isLeft ? "none" : "scaleX(-1)",
        }}
      />

      {/* Card */}
      <div
        className={`relative overflow-hidden rounded-xl border transition-all duration-500 ${
          isActive
            ? ""
            : "border-white/10 bg-black/40"
        } backdrop-blur-xl`}
        style={{
          borderColor: isActive ? `${colors.primary}4d` : undefined,
          backgroundColor: isActive ? "rgba(0,0,0,0.6)" : undefined,
          boxShadow: isActive ? `0 0 30px ${colors.primary}1a` : undefined,
        }}
      >
        {/* Animated border glow */}
        {isActive && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
            <div
              className="absolute -left-full top-0 h-px w-[200%]"
              style={{
                background: `linear-gradient(to right, transparent, ${colors.primary}, transparent)`,
                animation: "slideRight 3s linear infinite",
              }}
            />
            <div
              className="absolute -top-full right-0 h-[200%] w-px"
              style={{
                background: `linear-gradient(to bottom, transparent, ${colors.primary}, transparent)`,
                animation: "slideDown 3s linear infinite",
                animationDelay: "0.75s",
              }}
            />
            <div
              className="absolute bottom-0 left-0 h-px w-[200%]"
              style={{
                background: `linear-gradient(to right, transparent, ${colors.primary}, transparent)`,
                animation: "slideRight 3s linear infinite",
                animationDelay: "1.5s",
              }}
            />
            <div
              className="absolute left-0 top-0 h-[200%] w-px"
              style={{
                background: `linear-gradient(to bottom, transparent, ${colors.primary}, transparent)`,
                animation: "slideDown 3s linear infinite",
                animationDelay: "2.25s",
              }}
            />
          </div>
        )}

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

        <div className="relative p-6">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <Icon
                  className={`h-4 w-4 transition-colors duration-300`}
                  style={{ color: isActive ? colors.primary : "rgba(255,255,255,0.4)" }}
                />
                <h3 className="text-lg font-semibold text-white">
                  {experience.title}
                </h3>
              </div>
              <p 
                className={`text-sm font-medium transition-colors duration-300`}
                style={{ color: isActive ? colors.primary : "rgba(255,255,255,0.6)" }}
              >
                {experience.company}
              </p>
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="font-mono text-xs text-white/40">
                {experience.period}
              </span>
              <p className="text-xs text-white/30">{experience.location}</p>
            </div>
          </div>

          {/* Divider line */}
          <div 
            className={`mb-4 h-px transition-all duration-500`}
            style={{
              backgroundColor: isActive ? `${colors.primary}4d` : "rgba(255,255,255,0.1)",
            }}
          />

          {/* Description */}
          <p className="mb-5 text-sm leading-relaxed text-white/60">
            {experience.description}
          </p>

          {/* Highlights */}
          <div className="mb-5 grid grid-cols-2 gap-3">
            {experience.highlights.map((highlight, i) => (
              <div
                key={i}
                className={`transition-all duration-500 ${
                  isActive ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
                }`}
                style={{ transitionDelay: `${i * 150 + 200}ms` }}
              >
                <div className="text-xs uppercase tracking-wide text-white/40 mb-1">
                  {highlight.label}
                </div>
                <div
                  className={`font-mono text-base font-bold transition-all duration-300`}
                  style={{
                    color: isActive ? colors.primary : `${colors.primary}66`,
                    filter: isActive ? `drop-shadow(0 0 8px ${colors.primary}99)` : undefined,
                  }}
                >
                  {highlight.metric}
                </div>
              </div>
            ))}
          </div>

          {/* Terminal badges */}
          <div className="flex flex-wrap gap-2">
            {experience.badges.map((badge, i) => (
              <span
                key={badge}
                className={`inline-flex items-center gap-1 rounded-sm border px-2.5 py-1.5 font-mono text-xs font-medium transition-all duration-500`}
                style={{
                  borderColor: isActive ? `${colors.primary}66` : "rgba(255,255,255,0.1)",
                  backgroundColor: isActive ? `${colors.primary}0d` : "rgba(255,255,255,0.05)",
                  color: isActive ? colors.primary : "rgba(255,255,255,0.4)",
                  transitionDelay: `${i * 100 + 300}ms`,
                  transform: isActive ? "translateY(0)" : "translateY(4px)",
                  opacity: isActive ? 1 : 0.5,
                  boxShadow: isActive ? `0 0 12px ${colors.primary}4d` : undefined,
                }}
              >
                <span 
                  className={`transition-colors duration-300`}
                  style={{ color: isActive ? `${colors.primary}b3` : "rgba(255,255,255,0.2)" }}
                >
                  $
                </span>
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Scan line effect */}
        {isActive && (
          <div
            className="pointer-events-none absolute left-0 top-0 h-full w-full"
            style={{
              background: `linear-gradient(180deg, transparent 0%, ${colors.primary}08 50%, transparent 100%)`,
              animation: "scanVertical 2s ease-in-out infinite",
            }}
          />
        )}
      </div>
    </div>
  )
}

export function ExperienceTimeline() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const { colors } = useColorTheme()

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || !timelineRef.current) return

      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      const windowHeight = window.innerHeight

      const sectionTop = rect.top
      const sectionHeight = rect.height
      const scrollIntoSection = windowHeight - sectionTop
      const progress = Math.max(
        0,
        Math.min(1, scrollIntoSection / (sectionHeight + windowHeight * 0.5))
      )

      setScrollProgress(progress)

      const newActiveIndex = Math.min(
        experiences.length - 1,
        Math.floor(progress * experiences.length)
      )
      setActiveIndex(newActiveIndex)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen bg-[#09090B] py-24"
    >
      {/* Animated background grid pattern */}
      <AnimatedGridBackground 
        gridSize={50} 
        lineOpacity={0.05} 
        pulseSpeed={7}
        showPulse={true}
      />
      
      {/* Floating dots for ambient effect */}
      <FloatingGridDots count={12} />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Section header */}
        <div className="mb-16 text-center">
          <div 
            className="mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5"
            style={{
              borderColor: `${colors.primary}4d`,
              backgroundColor: `${colors.primary}1a`,
            }}
          >
            <Briefcase className="h-4 w-4" style={{ color: colors.primary }} />
  <span className="font-mono text-sm" style={{ color: colors.primary }}>
  EXPERIENCE.LOG
  </span>
  </div>
  <h2 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
  <GlitchText intensity="low">Professional Journey</GlitchText>
  </h2>
  <TextRevealOnScroll direction="up" delay={0.2}>
    <p className="mx-auto max-w-2xl text-white/50">
    Building intelligent systems, from perception pipelines to autonomous mobile robots.
    </p>
  </TextRevealOnScroll>
  </div>

        {/* Timeline container */}
        <div ref={timelineRef} className="relative">
          {/* Central timeline line */}
          <div className="absolute left-4 top-0 hidden h-full w-px lg:left-1/2 lg:block lg:-translate-x-px">
            <div className="absolute inset-0 bg-white/10" />
            <div
              className="absolute left-0 top-0 w-full origin-top"
              style={{
                height: `${scrollProgress * 100}%`,
                background: `linear-gradient(to bottom, ${colors.primary}, ${colors.primary}, ${colors.primary}33)`,
                boxShadow: `0 0 10px ${colors.primary}80`,
                transition: "height 0.3s ease-out",
              }}
            />
            <div
              className="absolute left-1/2 h-4 w-4 -translate-x-1/2 rounded-full"
              style={{
                top: `${scrollProgress * 100}%`,
                backgroundColor: colors.primary,
                boxShadow: `0 0 20px ${colors.primary}cc`,
                transition: "top 0.3s ease-out",
              }}
            >
              <div 
                className="absolute inset-0 animate-ping rounded-full"
                style={{ backgroundColor: `${colors.primary}80` }}
              />
            </div>
          </div>

          {/* Mobile timeline line */}
          <div className="absolute left-4 top-0 h-full w-px lg:hidden">
            <div className="absolute inset-0 bg-white/10" />
            <div
              className="absolute left-0 top-0 w-full origin-top"
              style={{
                height: `${scrollProgress * 100}%`,
                background: `linear-gradient(to bottom, ${colors.primary}, ${colors.primary}33)`,
                boxShadow: `0 0 10px ${colors.primary}80`,
                transition: "height 0.3s ease-out",
              }}
            />
          </div>

          {/* Experience items */}
          <div className="relative space-y-12 lg:space-y-24">
            {experiences.map((experience, index) => {
              const isLeft = index % 2 === 0
              const isActive = index <= activeIndex

              return (
                <div
                  key={experience.id}
                  className="relative grid gap-8 pl-12 lg:grid-cols-2 lg:gap-0 lg:pl-0"
                >
                  {/* Mobile node */}
                  <div className="absolute left-0 top-8 lg:hidden">
                    <RadarNode isActive={isActive} index={index} />
                  </div>

                  {/* Desktop layout */}
                  {isLeft ? (
                    <>
                      <ExperienceCard
                        experience={experience}
                        isLeft={true}
                        isActive={isActive}
                        index={index}
                      />
                      <div className="relative hidden items-start justify-start lg:flex">
                        <div className="absolute -left-2.5 top-8">
                          <RadarNode isActive={isActive} index={index} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="relative hidden items-start justify-end lg:flex">
                        <div className="absolute -right-2.5 top-8">
                          <RadarNode isActive={isActive} index={index} />
                        </div>
                      </div>
                      <ExperienceCard
                        experience={experience}
                        isLeft={false}
                        isActive={isActive}
                        index={index}
                      />
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="mt-16 flex items-center justify-center">
          <div className="flex items-center gap-4">
            <div 
              className="h-px w-16"
              style={{
                background: `linear-gradient(to right, transparent, ${colors.primary}80)`,
              }}
            />
            <div 
              className="flex h-3 w-3 items-center justify-center rounded-full border"
              style={{ borderColor: `${colors.primary}80` }}
            >
              <div 
                className="h-1 w-1 rounded-full"
                style={{ backgroundColor: colors.primary }}
              />
            </div>
            <span className="font-mono text-xs text-white/30">END_LOG</span>
            <div 
              className="flex h-3 w-3 items-center justify-center rounded-full border"
              style={{ borderColor: `${colors.primary}80` }}
            >
              <div 
                className="h-1 w-1 rounded-full"
                style={{ backgroundColor: colors.primary }}
              />
            </div>
            <div 
              className="h-px w-16"
              style={{
                background: `linear-gradient(to left, transparent, ${colors.primary}80)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes slideRight {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0%);
          }
        }
        @keyframes slideDown {
          0% {
            transform: translateY(-50%);
          }
          100% {
            transform: translateY(0%);
          }
        }
        @keyframes scanVertical {
          0%,
          100% {
            transform: translateY(-100%);
          }
          50% {
            transform: translateY(100%);
          }
        }
        @keyframes scan {
          0%,
          100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(180deg);
          }
        }
      `}</style>
    </section>
  )
}
