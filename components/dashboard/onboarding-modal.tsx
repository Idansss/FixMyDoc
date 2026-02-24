"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, Sparkles, SlidersHorizontal, Download, ArrowRight } from "lucide-react"

const STORAGE_KEY = "fixmydoc_onboarded"

const STEPS = [
  {
    icon: Upload,
    label: "Upload a document",
    desc: "PDF, DOCX, or image — CV, legal, academic, or business documents.",
  },
  {
    icon: Sparkles,
    label: "AI scores and analyses it",
    desc: "Get a score out of 100, a summary, and a prioritized list of issues.",
  },
  {
    icon: SlidersHorizontal,
    label: "Accept or reject rewrites",
    desc: "Review side-by-side suggestions and pick the ones you want to keep.",
  },
  {
    icon: Download,
    label: "Export the polished version",
    desc: "Download as TXT (free) or PDF / DOCX (Pro & Business).",
  },
]

export function OnboardingModal({ hasDocuments }: { hasDocuments: boolean }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const seen = localStorage.getItem(STORAGE_KEY)
    if (!seen && !hasDocuments) {
      // Small delay so the dashboard layout renders first
      const t = setTimeout(() => setOpen(true), 400)
      return () => clearTimeout(t)
    }
  }, [hasDocuments])

  const dismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "1")
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss() }}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Welcome to FixMyDoc</DialogTitle>
          <DialogDescription className="text-sm">
            Your AI-powered document coach. Here's how it works.
          </DialogDescription>
        </DialogHeader>

        <ol className="mt-1 space-y-3.5">
          {STEPS.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary mt-0.5">
                <step.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">{step.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex items-center justify-between gap-2 border-t border-border pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={dismiss}
          >
            Skip
          </Button>
          <Button onClick={dismiss} className="gap-1.5">
            Get started
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Returns true if the user has already seen the onboarding modal. Safe to call client-side only. */
export function hasSeenOnboarding(): boolean {
  if (typeof window === "undefined") return true
  return localStorage.getItem(STORAGE_KEY) === "1"
}
