'use client'

import { useState } from 'react'
import { Bot } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { ChatConsole } from '../sections/ChatConsole'

/** Mission control from anywhere: opens the AI assistant in a slide-over. */
export function ConsoleButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pointer-events-auto absolute right-8 top-7 hidden items-center gap-2 rounded-sm border border-grid bg-ground/93 px-3 py-1.5 font-mono text-[0.6875rem] tracking-[0.12em] text-muted transition hover:border-accent hover:text-text sm:inline-flex pointer-coarse:min-h-11"
      >
        <Bot className="h-3.5 w-3.5 text-accent" /> CONSOLE
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[min(30rem,92vw)] border-grid bg-ground p-4 text-text sm:max-w-none">
          <SheetTitle className="eyebrow mb-3">Mission control · AI assistant</SheetTitle>
          <SheetDescription className="sr-only">Chat with the assistant about Adyansh's experience, skills, and projects.</SheetDescription>
          <ChatConsole className="[&_.h-56]:h-[60vh]" />
        </SheetContent>
      </Sheet>
    </>
  )
}
