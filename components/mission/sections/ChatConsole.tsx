'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Bot, Send, User } from 'lucide-react'
import { site } from '@/content/site'

type Msg = { role: 'user' | 'assistant'; content: string }

/** Mission control: the AI assistant, same Cloudflare Worker + retry logic as before, new skin. */
async function askWorker(contents: { role: string; parts: { text: string }[] }[]): Promise<string> {
  const MAX_RETRIES = 3
  let delay = 1000
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(site.chat.workerUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents }) })
      if (res.ok) {
        const data = await res.json()
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'I received an empty response. Please try again.'
      }
      if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, delay + Math.random() * 500))
        delay *= 2
        continue
      }
      return `⚠️ Worker error (${res.status}). Please try again in a moment.`
    } catch {
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, delay + Math.random() * 500))
        delay *= 2
        continue
      }
      return '⚠️ Network error. Please check your connection and try again.'
    }
  }
  return '⚠️ Failed after multiple retries. Please try again later.'
}

export function ChatConsole({ className = '' }: { className?: string }) {
  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', content: site.chat.greeting }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages, loading])

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const text = input.trim()
      if (!text || loading) return
      setInput('')
      const history = [...messages, { role: 'user' as const, content: text }]
      setMessages(history)
      setLoading(true)
      const contents = history.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
      const reply = await askWorker(contents)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
      setLoading(false)
    },
    [input, loading, messages],
  )

  return (
    <div className={`overflow-hidden rounded-lg border border-grid bg-ground/80 backdrop-blur-md ${className}`}>
      <div className="flex items-center gap-2 border-b border-grid px-4 py-2.5 font-mono text-[11px] tracking-[0.12em] text-muted">
        <span className="h-2 w-2 rounded-full bg-accent" />
        {site.chat.path}
        <span className="ml-auto inline-flex items-center gap-1 text-accent">
          <Bot className="h-3.5 w-3.5" /> {site.chat.online}
        </span>
      </div>
      <div className="h-56 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/20 text-accent">
                <Bot className="h-3 w-3" />
              </span>
            )}
            <div className={`max-w-[82%] rounded-md px-3 py-2 font-mono text-xs leading-relaxed ${m.role === 'user' ? 'bg-accent/15 text-accent' : 'bg-panel text-text'}`}>{m.content}</div>
            {m.role === 'user' && (
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-panel-2 text-muted">
                <User className="h-3 w-3" />
              </span>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 font-mono text-xs text-muted">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-accent/20 text-accent">
              <Bot className="h-3 w-3" />
            </span>
            thinking<span className="animate-pulse">…</span>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t border-grid p-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={loading ? site.chat.waiting : site.chat.placeholder}
          disabled={loading}
          aria-label="Message the assistant"
          className="flex-1 rounded-md border border-grid bg-panel px-3 py-2 font-mono text-xs text-text placeholder:text-muted/70 focus:border-accent focus:outline-none disabled:opacity-50"
        />
        <button type="submit" disabled={!input.trim() || loading} aria-label="Send" className="grid h-9 w-10 place-items-center rounded-md bg-accent text-[#141414] disabled:cursor-not-allowed disabled:opacity-40">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
