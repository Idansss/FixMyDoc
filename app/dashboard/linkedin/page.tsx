"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Copy, Check, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { track } from "@/lib/analytics"
import type { LinkedInOptimizerResult } from "@/app/api/linkedin-optimizer/route"

// LinkedIn character limits
const LIMITS = { headline: 220, about: 2600, experience: 2000 }

type SectionKey = keyof typeof LIMITS

const SECTION_LABELS: Record<SectionKey, string> = {
  headline: "Headline",
  about: "About / Summary",
  experience: "Experience description",
}

const SECTION_PLACEHOLDERS: Record<SectionKey, string> = {
  headline: "e.g. Senior Product Designer | UX Strategy & Design Systems | SaaS",
  about: "Paste your current About section here…",
  experience: "Paste a role description from your Experience section here…",
}

function CharCounter({ value, limit }: { value: string; limit: number }) {
  const count = value.length
  const over = count > limit
  return (
    <span className={`text-[10px] tabular-nums ${over ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
      {count}/{limit}
    </span>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success("Copied.")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Could not copy.")
    }
  }
  return (
    <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={handleCopy}>
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  )
}

export default function LinkedInOptimizerPage() {
  const [targetRole, setTargetRole] = useState("")
  const [inputs, setInputs] = useState<Record<SectionKey, string>>({
    headline: "",
    about: "",
    experience: "",
  })
  const [result, setResult] = useState<LinkedInOptimizerResult | null>(null)
  const [generating, setGenerating] = useState(false)

  const hasAnyInput = Object.values(inputs).some((v) => v.trim().length > 0)

  const handleGenerate = async () => {
    if (!targetRole.trim()) {
      toast.error("Please enter your target role.")
      return
    }
    if (!hasAnyInput) {
      toast.error("Paste at least one section to optimize.")
      return
    }
    setGenerating(true)
    setResult(null)
    try {
      const res = await fetch("/api/linkedin-optimizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: targetRole.trim(),
          headline: inputs.headline.trim() || undefined,
          about: inputs.about.trim() || undefined,
          experience: inputs.experience.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to optimize profile.")
        return
      }
      setResult(data as LinkedInOptimizerResult)
      track("linkedin_optimize", {})
      toast.success("Profile sections optimized.")
    } catch {
      toast.error("Failed to optimize profile.")
    } finally {
      setGenerating(false)
    }
  }

  const sections = (Object.keys(LIMITS) as SectionKey[]).filter(
    (k) => inputs[k].trim().length > 0 || (result && result[k])
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          LinkedIn optimizer
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste your LinkedIn sections and target role to get AI-optimized rewrites.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left — Inputs */}
        <div className="space-y-5">
          {/* Target role */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Target role <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Product Designer at a SaaS startup"
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <Separator />

          {/* Section inputs */}
          {(Object.keys(LIMITS) as SectionKey[]).map((key) => (
            <div key={key}>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  {SECTION_LABELS[key]}
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">optional</span>
                </label>
                <CharCounter value={inputs[key]} limit={LIMITS[key]} />
              </div>
              <textarea
                value={inputs[key]}
                onChange={(e) => setInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder={SECTION_PLACEHOLDERS[key]}
                rows={key === "headline" ? 2 : 5}
                className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          ))}

          <Button
            onClick={handleGenerate}
            disabled={generating || !targetRole.trim() || !hasAnyInput}
            className="w-full sm:w-auto"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Optimizing…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Optimize sections
              </>
            )}
          </Button>
        </div>

        {/* Right — Output */}
        <div className="space-y-4">
          <label className="text-sm font-medium text-foreground">Optimized sections</label>

          {!result ? (
            <div className="min-h-[200px] flex items-center justify-center rounded-lg border border-border bg-muted/20 p-6">
              <p className="text-sm text-center text-muted-foreground">
                Your optimized LinkedIn sections will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {(Object.keys(LIMITS) as SectionKey[]).map((key) => {
                const optimized = result[key]
                if (!optimized) return null
                const original = inputs[key].trim()
                return (
                  <div key={key} className="rounded-lg border border-border bg-card overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">
                          {SECTION_LABELS[key]}
                        </span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {optimized.length}/{LIMITS[key]}
                        </Badge>
                      </div>
                      <CopyButton text={optimized} />
                    </div>

                    {/* Side-by-side on md+, stacked on mobile */}
                    <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                      <div className="p-3 bg-muted/10">
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Original
                        </p>
                        <p className="text-xs leading-relaxed text-foreground/70 whitespace-pre-wrap break-words">
                          {original || <span className="italic text-muted-foreground">—</span>}
                        </p>
                      </div>
                      <div className="p-3 bg-primary/5">
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary/70">
                          Optimized
                        </p>
                        <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap break-words">
                          {optimized}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
