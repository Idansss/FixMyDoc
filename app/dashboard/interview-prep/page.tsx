"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Copy, Check, ChevronDown, ChevronUp, Loader2, Lightbulb, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import { track } from "@/lib/analytics"
import type { InterviewPrepResult, InterviewQuestion } from "@/app/api/interview-prep/route"

const CATEGORY_COLORS: Record<string, string> = {
  Behavioral: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Technical: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  Situational: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  "Culture fit": "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
}

function categoryClass(category: string): string {
  return CATEGORY_COLORS[category] ?? "bg-secondary text-secondary-foreground"
}

function buildCopyText(questions: InterviewQuestion[], tips: string[]): string {
  const lines: string[] = ["INTERVIEW PREP", ""]
  if (tips.length > 0) {
    lines.push("PREPARATION TIPS")
    tips.forEach((tip, i) => lines.push(`${i + 1}. ${tip}`))
    lines.push("")
  }
  lines.push("QUESTIONS")
  questions.forEach((q) => {
    lines.push("")
    lines.push(`[${q.category}]`)
    lines.push(`Q: ${q.question}`)
    lines.push(`Guidance: ${q.guidance}`)
  })
  return lines.join("\n")
}

export default function InterviewPrepPage() {
  const [resumeText, setResumeText] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [result, setResult] = useState<InterviewPrepResult | null>(null)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [openGuidance, setOpenGuidance] = useState<Record<number, boolean>>({})

  const handleGenerate = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      toast.error("Please paste your resume and the job description.")
      return
    }
    setGenerating(true)
    setResult(null)
    setOpenGuidance({})
    try {
      const res = await fetch("/api/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: resumeText.trim(),
          jobDescription: jobDescription.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to generate interview prep.")
        return
      }
      setResult(data as InterviewPrepResult)
      track("interview_prep_generate", {})
      toast.success("Interview questions generated.")
    } catch {
      toast.error("Failed to generate interview prep.")
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(buildCopyText(result.questions, result.tips))
      setCopied(true)
      toast.success("Copied to clipboard.")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Could not copy.")
    }
  }

  const toggleGuidance = (i: number) => {
    setOpenGuidance((prev) => ({ ...prev, [i]: !prev[i] }))
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Interview prep
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste your resume and a job description to get tailored interview questions and preparation tips.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Inputs */}
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Your resume / CV
            </label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here…"
              className="min-h-[200px] w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Job description
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job posting here…"
              className="min-h-[200px] w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating || !resumeText.trim() || !jobDescription.trim()}
            className="w-full sm:w-auto"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              "Generate questions"
            )}
          </Button>
        </div>

        {/* Right: Output */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Results</label>
            {result && (
              <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={handleCopy}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy all"}
              </Button>
            )}
          </div>

          {!result ? (
            <div className="min-h-[200px] flex items-center justify-center rounded-lg border border-border bg-muted/20 p-6">
              <p className="text-sm text-muted-foreground text-center">
                Your interview questions and tips will appear here after you generate them.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tips */}
              {result.tips.length > 0 && (
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Preparation tips</h3>
                  </div>
                  <ol className="space-y-1.5 list-none">
                    {result.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {i + 1}
                        </span>
                        {tip}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Questions */}
              {result.questions.length > 0 && (
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Interview questions ({result.questions.length})
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {result.questions.map((q, i) => (
                      <li key={i} className="rounded-lg border border-border bg-background overflow-hidden">
                        <div className="p-3">
                          <div className="mb-2 flex items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${categoryClass(q.category)}`}
                            >
                              {q.category}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-foreground leading-snug">{q.question}</p>
                        </div>
                        {i < result.questions.length - 1 || openGuidance[i] ? (
                          <Separator className="opacity-50" />
                        ) : null}
                        <button
                          onClick={() => toggleGuidance(i)}
                          className="flex w-full items-center justify-between px-3 py-2 text-xs text-muted-foreground hover:bg-muted/40 transition-colors"
                        >
                          <span className="font-medium">Answer guidance</span>
                          {openGuidance[i] ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                        {openGuidance[i] && (
                          <div className="border-t border-border bg-muted/20 px-3 py-2.5">
                            <p className="text-xs leading-relaxed text-muted-foreground">{q.guidance}</p>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
