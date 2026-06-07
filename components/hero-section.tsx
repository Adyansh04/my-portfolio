"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { ArrowRight, Github, Linkedin, Mail, Send, Bot, User } from "lucide-react"
import { SplineScene } from "@/components/ui/spline-scene"
import { Spotlight } from "@/components/ui/spotlight"
import { useColorTheme } from "./color-theme-provider"
import { 
  GlitchText, 
  TypewriterText, 
  NeonGlowText, 
  LetterStagger,
  MagneticElement,
  TextRevealOnScroll,
  AnimatedGridBackground,
  FloatingGridDots,
  ParallaxLayer,
  FloatingParallaxElement,
} from "@/components/animations"

function StatusBadge() {
  const { colors } = useColorTheme();
  
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.primary }} />
        <div 
          className="absolute inset-0 h-2 w-2 animate-ping rounded-full opacity-75"
          style={{ backgroundColor: colors.primary }}
        />
      </div>
      <span 
        className="font-mono text-xs uppercase tracking-widest"
        style={{ color: colors.primary }}
      >
        Status: Active
      </span>
    </div>
  )
}

function AIChatTerminal() {
  const { colors } = useColorTheme();
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    {
      role: "assistant",
      content: "Hi! I'm Adyansh's AI assistant. Ask me anything about his experience, skills, projects, or background!"
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  async function callGeminiWithBackoff(contents: { role: string; parts: { text: string }[] }[]): Promise<string> {
    const workerUrl = "https://portfolio-chat.gupta-adyansh.workers.dev/"
    const body = { contents }

    const MAX_RETRIES = 3
    let delay = 1000

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(workerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })

        if (res.ok) {
          const data = await res.json()
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
          return text || "I received an empty response. Please try again."
        }

        if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
          const jitter = Math.random() * 500
          await new Promise(r => setTimeout(r, delay + jitter))
          delay *= 2
          continue
        }

        return `⚠️ Worker error (${res.status}). Please try again in a moment.`
      } catch (err) {
        if (attempt < MAX_RETRIES) {
          const jitter = Math.random() * 500
          await new Promise(r => setTimeout(r, delay + jitter))
          delay *= 2
          continue
        }
        return "⚠️ Network error. Please check your connection and try again."
      }
    }
    return "⚠️ Failed after multiple retries. Please try again later."
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    // Build Gemini contents array from conversation history
    const contents = [
      ...messages
        .filter(m => m.role === "user" || m.role === "assistant")
        .map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        })),
      { role: "user", parts: [{ text: userMessage }] }
    ]

    const response = await callGeminiWithBackoff(contents)
    setMessages(prev => [...prev, { role: "assistant", content: response }])
    setIsLoading(false)
  }

  return (
    <div className="w-full max-w-xl rounded-lg border border-[#27272A] bg-[#0F0F12]/90 backdrop-blur-sm overflow-hidden">
      {/* Terminal Header */}
      <div className="flex items-center gap-2 border-b border-[#27272A] bg-[#0a0a0c] px-4 py-3">
        <div className="h-3 w-3 rounded-full bg-[#EF4444]" />
        <div className="h-3 w-3 rounded-full bg-[#F59E0B]" />
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colors.primary }} />
        <span className="ml-2 font-mono text-xs text-[#71717A]">
          ~/adyansh/ai-assistant
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Bot className="h-4 w-4" style={{ color: colors.primary }} />
          <span className="font-mono text-xs" style={{ color: colors.primary }}>ONLINE</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="h-48 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#27272A]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div 
                className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center mt-0.5"
                style={{ backgroundColor: `${colors.primary}33` }}
              >
                <Bot className="h-3 w-3" style={{ color: colors.primary }} />
              </div>
            )}
            <div 
              className={`max-w-[80%] rounded-lg px-3 py-2 font-mono text-xs leading-relaxed ${
                msg.role === "user" 
                  ? "" 
                  : "bg-[#1a1a1f] text-[#a1a1aa]"
              }`}
              style={msg.role === "user" ? { 
                backgroundColor: `${colors.primary}33`, 
                color: colors.primary 
              } : undefined}
            >
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-[#00BFFF]/20 flex items-center justify-center mt-0.5">
                <User className="h-3 w-3 text-[#00BFFF]" />
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex gap-2 justify-start">
            <div 
              className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center mt-0.5"
              style={{ backgroundColor: `${colors.primary}33` }}
            >
              <Bot className="h-3 w-3" style={{ color: colors.primary }} />
            </div>
            <div className="bg-[#1a1a1f] rounded-lg px-3 py-2 font-mono text-xs text-[#a1a1aa] flex items-center gap-1">
              <span>thinking</span>
              <span className="inline-flex gap-0.5">
                <span className="animate-bounce [animation-delay:0ms]" style={{ color: colors.primary }}>.</span>
                <span className="animate-bounce [animation-delay:150ms]" style={{ color: colors.primary }}>.</span>
                <span className="animate-bounce [animation-delay:300ms]" style={{ color: colors.primary }}>.</span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t border-[#27272A] p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? "Waiting for response..." : "Ask about Adyansh's experience, skills, projects..."}
            disabled={isLoading}
            className="flex-1 bg-[#1a1a1f] border border-[#27272A] rounded-lg px-3 py-2 font-mono text-xs text-white placeholder:text-[#52525b] focus:outline-none transition-colors disabled:opacity-50"
            style={{
              borderColor: input ? `${colors.primary}80` : undefined,
            }}
            onFocus={(e) => e.target.style.borderColor = `${colors.primary}80`}
            onBlur={(e) => e.target.style.borderColor = '#27272A'}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{
              backgroundColor: `${colors.primary}33`,
              borderColor: `${colors.primary}4d`,
              color: colors.primary,
            }}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}

function GhostButton({
  children,
  icon: Icon,
  href,
}: {
  children: React.ReactNode
  icon?: React.ElementType
  href?: string
}) {
  const { colors } = useColorTheme();
  const Comp = href ? "a" : "button"
  
  return (
    <Comp 
      href={href}
      className="group relative overflow-hidden rounded-full border bg-transparent px-6 py-3 font-medium transition-all duration-300"
      style={{
        borderColor: `${colors.primary}4d`,
        color: colors.primary,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = colors.primary;
        e.currentTarget.style.boxShadow = `0 0 20px ${colors.primary}4d`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${colors.primary}4d`;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <span className="relative z-10 flex items-center gap-2">
        {children}
        {Icon && (
          <Icon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        )}
      </span>
      <div 
        className="absolute inset-0 -translate-x-full transition-transform duration-500 group-hover:translate-x-full"
        style={{
          background: `linear-gradient(to right, transparent, ${colors.primary}1a, transparent)`,
        }}
      />
    </Comp>
  )
}

export default function HeroSection() {
  const heroRef = useRef<HTMLElement>(null)
  const { colors } = useColorTheme();

  return (
    <section ref={heroRef} className="relative min-h-screen overflow-hidden bg-[#09090B]">
      {/* Animated Grid background */}
      <AnimatedGridBackground 
        gridSize={50} 
        lineOpacity={0.06} 
        pulseSpeed={5}
        showPulse={true}
      />
      
      {/* Floating dots for depth */}
      <FloatingGridDots count={15} />

      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#09090B] via-transparent to-[#09090B]" />

      {/* Main content - Split layout */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-6 py-16">
        <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-2">
          {/* Left side - Text content */}
          <div className="flex flex-col items-start space-y-6 lg:pr-8">
            <StatusBadge />

            <div className="space-y-4">
              <h1 className="text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                <GlitchText intensity="medium" continuous>
                  Perception, Navigation
                </GlitchText>
                <br />
                <span className="inline-block">
                  <NeonGlowText intensity="high" pulseSpeed={3}>
                    & AI
                  </NeonGlowText>
                </span>
              </h1>
              <p className="text-2xl font-semibold sm:text-3xl md:text-4xl">
                <LetterStagger 
                  text="Adyansh Gupta" 
                  staggerDelay={0.05}
                  animation="fadeUp"
                  className="text-white"
                />
              </p>
              <TextRevealOnScroll direction="up" delay={0.3} blur>
                <p className="max-w-xl text-pretty text-base text-[#71717A] sm:text-lg">
                  <TypewriterText 
                    text="Robotics Engineer specializing in autonomous mobile robots, ROS2-based systems, and real-time sensor fusion for industrial automation and AGV/AMR platforms."
                    speed={20}
                    delay={800}
                  />
                </p>
              </TextRevealOnScroll>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <MagneticElement strength={0.2}>
                <GhostButton icon={ArrowRight} href="#projects">View Projects</GhostButton>
              </MagneticElement>
              <MagneticElement strength={0.2}>
                <GhostButton icon={Mail} href="#contact">Contact Me</GhostButton>
              </MagneticElement>
            </div>

            <div className="flex items-center gap-4">
              {[
                { href: "https://github.com/Adyansh04", icon: Github, label: "GitHub" },
                { href: "https://www.linkedin.com/in/adyanshgupta/", icon: Linkedin, label: "LinkedIn" },
                { href: "mailto:gupta.adyansh@gmail.com", icon: Mail, label: "Email" },
              ].map((item) => (
                <MagneticElement key={item.label} strength={0.4}>
                  <a
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="text-[#71717A] transition-colors"
                    style={{ ["--hover-color" as string]: colors.primary }}
                    onMouseEnter={(e) => e.currentTarget.style.color = colors.primary}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#71717A'}
                    aria-label={item.label}
                  >
                    <item.icon className="h-5 w-5" />
                  </a>
                </MagneticElement>
              ))}
            </div>

            {/* AI Chat Terminal */}
            <div className="mt-4 w-full">
              <AIChatTerminal />
            </div>
          </div>

          {/* Right side - Robot with parallax */}
          <ParallaxLayer depth={0.15} className="relative h-[500px] lg:h-[700px]">
            {/* Glowing background effects with floating animation */}
            <FloatingParallaxElement amplitude={15} frequency={4} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div 
                className="h-[400px] w-[400px] rounded-full blur-3xl md:h-[500px] md:w-[500px]"
                style={{
                  background: `linear-gradient(to bottom, ${colors.primary}40, ${colors.primary}1a, transparent)`,
                }}
              />
            </FloatingParallaxElement>
            
            <Spotlight className="left-1/2 top-1/3" size={500} fill={`${colors.primary}26`} />
            
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full"
              trackingAreaRef={heroRef}
            />
          </ParallaxLayer>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#09090B] to-transparent" />
    </section>
  )
}
