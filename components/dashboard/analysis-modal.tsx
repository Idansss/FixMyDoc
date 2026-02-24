"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Download,
  ListChecks,
  MessageSquareText,
  Star,
  Target,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { track } from "@/lib/analytics"

export type AnalysisData = {
  score: number
  summary: string
  issues: { section: string; problem: string; severity: string }[]
  rewrites: { original: string; improved: string }[]
  missing_sections: string[]
  /** For historical docs loaded from DB — just show fixed text */
  fixedText?: string
  originalText?: string
  /** ATS mode (CV + job description): subscore and JD match */
  ats_score?: number
  jd_match?: number
  keyword_gap?: string[]
}

const SEVERITY_VARIANT: Record<string, "destructive" | "secondary" | "outline"> = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 75 ? "text-primary" : score >= 50 ? "text-yellow-500" : "text-destructive"
  return (
    <div className={`flex flex-col items-center gap-1 ${color}`}>
      <span className="text-5xl font-bold tabular-nums">{score}</span>
      <span className="text-xs font-medium text-muted-foreground">out of 100</span>
    </div>
  )
}

/** Build full document text from rewrites and per-block accept/reject. */
function buildEffectiveFixedText(
  rewrites: { original: string; improved: string }[],
  accepted: boolean[]
): string {
  return rewrites
    .map((r, i) => (accepted[i] !== false ? r.improved : r.original))
    .join("\n\n")
}

export function AnalysisModal({
  open,
  onOpenChange,
  filename,
  rewriteId,
  analysis,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  filename: string
  rewriteId: string
  analysis: AnalysisData
}) {
  const [exportLoading, setExportLoading] = useState<string | null>(null)
  const hasRewrites = analysis.rewrites.length > 0
  const [accepted, setAccepted] = useState<boolean[]>(() =>
    hasRewrites ? analysis.rewrites.map(() => true) : []
  )

  useEffect(() => {
    if (hasRewrites && accepted.length !== analysis.rewrites.length) {
      setAccepted(analysis.rewrites.map(() => true))
    }
  }, [hasRewrites, analysis.rewrites.length, accepted.length])

  const effectiveFixedText = useMemo(() => {
    if (!hasRewrites) return undefined
    return buildEffectiveFixedText(analysis.rewrites, accepted)
  }, [hasRewrites, analysis.rewrites, accepted])

  const handleExport = async (format: string) => {
    setExportLoading(format)
    track("export_start", { format })
    try {
      const body: { rewriteId: string; format: string; fixedText?: string } = {
        rewriteId,
        format,
      }
      if (effectiveFixedText !== undefined) body.fixedText = effectiveFixedText
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data.error === "upgrade_required") {
          toast.error("Upgrade to Pro or Business to export as PDF/DOCX.")
          return
        }
        toast.error("Export failed.")
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `fixmydoc-export-${rewriteId}.${format}`
      a.click()
      URL.revokeObjectURL(url)
      track("export_success", { format })
      toast.success(`Exported as ${format.toUpperCase()}.`)
    } catch {
      toast.error("Export failed.")
    } finally {
      setExportLoading(null)
    }
  }

  const hasFullAnalysis = analysis.issues.length > 0 || analysis.rewrites.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="pr-6 text-base">{filename}</DialogTitle>
          <DialogDescription>AI analysis results</DialogDescription>
        </DialogHeader>

        {/* Score */}
        <div className="flex items-center gap-6 rounded-xl border border-border bg-secondary/30 p-5">
          <ScoreRing score={analysis.score} />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground mb-1">Summary</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {analysis.summary || "No summary available."}
            </p>
          </div>
        </div>

        {/* ATS (CV + job description) */}
        {(analysis.ats_score != null || analysis.jd_match != null || (analysis.keyword_gap?.length ?? 0) > 0) && (
          <>
            <Separator />
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  ATS & job match
                </h3>
              </div>
              <div className="flex flex-wrap gap-4 rounded-lg border border-border bg-card p-4">
                {analysis.ats_score != null && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">ATS score</p>
                    <p className="text-lg font-bold tabular-nums text-foreground">{analysis.ats_score}/100</p>
                  </div>
                )}
                {analysis.jd_match != null && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">JD match</p>
                    <p className="text-lg font-bold tabular-nums text-foreground">{analysis.jd_match}%</p>
                  </div>
                )}
                {(analysis.keyword_gap?.length ?? 0) > 0 && (
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Missing / weak keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.keyword_gap.map((kw) => (
                        <Badge key={kw} variant="secondary" className="text-xs font-normal">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Missing sections */}
        {analysis.missing_sections.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="mb-3 flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Missing sections
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.missing_sections.map((s) => (
                  <Badge key={s} variant="outline" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Issues */}
        {analysis.issues.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Issues found
                </h3>
              </div>
              <ul className="space-y-2.5">
                {analysis.issues.map((issue, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
                  >
                    <Badge
                      variant={SEVERITY_VARIANT[issue.severity?.toLowerCase()] ?? "outline"}
                      className="mt-0.5 shrink-0 text-[10px]"
                    >
                      {issue.severity}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">
                        {issue.section}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {issue.problem}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Rewrites — side-by-side diff with accept/reject */}
        {hasFullAnalysis && analysis.rewrites.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="mb-3 flex items-center gap-2">
                <MessageSquareText className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Suggested rewrites — accept or reject each
                </h3>
              </div>
              <ul className="space-y-4">
                {analysis.rewrites.map((rw, i) => {
                  const useImproved = accepted[i] !== false
                  return (
                    <li key={i} className="rounded-lg border border-border bg-card overflow-hidden">
                      <div className="grid grid-cols-2 gap-0 min-h-[80px]">
                        <div
                          className={`p-3 border-r border-border ${!useImproved ? "ring-2 ring-primary/50 bg-primary/5" : "bg-muted/30"}`}
                        >
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Original
                          </p>
                          <p className="text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap break-words">
                            {rw.original}
                          </p>
                        </div>
                        <div
                          className={`p-3 ${useImproved ? "ring-2 ring-primary/50 bg-primary/5" : "bg-muted/30"}`}
                        >
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-primary/70">
                            Improved
                          </p>
                          <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap break-words">
                            {rw.improved}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/20 px-3 py-2">
                        <Button
                          variant={useImproved ? "secondary" : "outline"}
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          onClick={() => {
                            setAccepted((prev) => {
                              const next = [...prev]
                              next[i] = true
                              return next
                            })
                          }}
                        >
                          <Check className="h-3 w-3" />
                          Accept
                        </Button>
                        <Button
                          variant={!useImproved ? "secondary" : "outline"}
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          onClick={() => {
                            setAccepted((prev) => {
                              const next = [...prev]
                              next[i] = false
                              return next
                            })
                          }}
                        >
                          <X className="h-3 w-3" />
                          Reject
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                Export uses your choices above. Default: all improved.
              </p>
            </div>
          </>
        )}

        {/* Historical doc — plain text comparison */}
        {!hasFullAnalysis && analysis.fixedText && (
          <>
            <Separator />
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Improved document
                </h3>
              </div>
              <div className="max-h-60 overflow-y-auto rounded-lg border border-primary/30 bg-primary/5 p-4">
                <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                  {analysis.fixedText}
                </pre>
              </div>
            </div>
          </>
        )}

        {/* Export */}
        <Separator />
        <div>
          <p className="mb-3 text-xs font-medium text-muted-foreground">Export improved document</p>
          <div className="flex flex-wrap gap-2">
            {(["txt", "pdf", "docx"] as const).map((fmt) => (
              <Button
                key={fmt}
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => handleExport(fmt)}
                disabled={exportLoading !== null}
              >
                <Download className="h-3.5 w-3.5" />
                {exportLoading === fmt ? "Exporting..." : fmt.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
