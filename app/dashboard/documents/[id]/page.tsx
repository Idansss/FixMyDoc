"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  GitCompare,
  ListChecks,
  Loader2,
  MessageSquareText,
  Star,
  Target,
  Trash2,
  X,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import { track } from "@/lib/analytics"
import { templateForDocType, EXPORT_TEMPLATE_LABELS, type ExportTemplate } from "@/lib/export/templates"

type AnalysisData = {
  score: number
  summary: string
  issues: { section: string; problem: string; severity: string }[]
  rewrites: { original: string; improved: string }[]
  missing_sections: string[]
  fixedText?: string
  originalText?: string
  ats_score?: number
  jd_match?: number
  keyword_gap?: string[]
  keyword_matched?: string[]
  cv_checklist?: { item: string; passed: boolean; tip?: string }[]
  stronger_verbs?: { original: string; suggested: string }[]
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

export default function DocumentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string | undefined
  const [docId, setDocId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [exportLoading, setExportLoading] = useState<string | null>(null)
  const [showCompare, setShowCompare] = useState(false)
  const [reAnalyzeDialog, setReAnalyzeDialog] = useState(false)
  const [reAnalyzeJd, setReAnalyzeJd] = useState("")
  const [reAnalyzeIndustry, setReAnalyzeIndustry] = useState("")
  const [reAnalyzing, setReAnalyzing] = useState(false)
  const [data, setData] = useState<{
    document: { id: string; filename: string; docType: string; score: number | null; date: string; extractedText?: string }
    rewrite: { id: string; fixedText?: string; originalText?: string } | null
    analysis: AnalysisData | null
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError("Invalid document")
      return
    }
    let cancelled = false
    setDocId(id)
    fetch(`/api/documents/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? "Document not found" : "Failed to load")
        return res.json()
      })
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load document")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const handleDelete = async () => {
    if (!docId || !confirm("Delete this document? This cannot be undone.")) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || "Failed to delete")
        return
      }
      toast.success("Document deleted")
      router.push("/dashboard")
    } catch {
      toast.error("Failed to delete")
    } finally {
      setDeleting(false)
    }
  }

  const [accepted, setAccepted] = useState<boolean[]>([])
  const [exportTemplate, setExportTemplate] = useState<ExportTemplate>("plain")
  const [exportBranded, setExportBranded] = useState(false)
  const rewrites = data?.analysis?.rewrites ?? []
  const docType = data?.document?.docType ?? ""
  useEffect(() => {
    const list = data?.analysis?.rewrites ?? []
    if (list.length > 0) {
      setAccepted(list.map(() => true))
    }
  }, [id, data?.analysis])
  useEffect(() => {
    if (docType) setExportTemplate(templateForDocType(docType))
  }, [docType])
  const effectiveFixedText = useMemo(() => {
    if (rewrites.length === 0) return undefined
    return rewrites
      .map((r, i) => (accepted[i] !== false ? r.improved : r.original))
      .join("\n\n")
  }, [rewrites, accepted])

  const handleExport = async (format: string) => {
    if (!data?.rewrite?.id) return
    setExportLoading(format)
    track("export_start", { format })
    try {
      const body: { rewriteId: string; format: string; fixedText?: string; template?: ExportTemplate; branded?: boolean } = {
        rewriteId: data.rewrite.id,
        format,
        template: exportTemplate,
        ...(exportBranded && (format === "pdf" || format === "docx") && { branded: true }),
      }
      if (effectiveFixedText !== undefined) body.fixedText = effectiveFixedText
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        if (d.error === "upgrade_required") {
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
      a.download = `fixmydoc-export-${data.rewrite.id}.${format}`
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

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="mt-8 rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">{error || "Document not found"}</p>
          <Link href="/dashboard">
            <Button className="mt-4">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const { document: doc, rewrite, analysis } = data
  const hasFullAnalysis = analysis && (analysis.issues.length > 0 || analysis.rewrites.length > 0)
  const originalFullText = data.rewrite?.originalText ?? data.analysis?.originalText ?? ""
  const improvedFullText = effectiveFixedText ?? data.rewrite?.fixedText ?? ""

  const handleReAnalyze = async () => {
    if (!docId || doc.docType !== "cv") return
    const extracted = data.document?.extractedText ?? originalFullText
    if (!extracted) {
      toast.error("No document text available to re-analyze.")
      return
    }
    setReAnalyzing(true)
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: docId,
          extractedText: extracted,
          docType: "cv",
          jobDescription: reAnalyzeJd.trim() || null,
          industryOrRole: reAnalyzeIndustry.trim() || null,
        }),
      })
      const out = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(out.error || "Re-analysis failed.")
        return
      }
      toast.success("Re-analyzed with new job description.")
      setReAnalyzeDialog(false)
      setReAnalyzeJd("")
      setReAnalyzeIndustry("")
      const refetch = await fetch(`/api/documents/${docId}`)
      if (refetch.ok) {
        const d = await refetch.json()
        setData(d)
        setAccepted((d.analysis?.rewrites ?? []).map(() => true))
      }
    } catch {
      toast.error("Re-analysis failed.")
    } finally {
      setReAnalyzing(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-xl font-semibold truncate max-w-[200px] sm:max-w-none">{doc.filename}</h1>
          <Badge variant="outline" className="text-xs">
            {doc.docType}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Delete
        </Button>
      </div>

      {!analysis && !rewrite && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">This document has not been analyzed yet.</p>
          <Link href="/dashboard">
            <Button className="mt-4">Analyze from Dashboard</Button>
          </Link>
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          <div className="flex items-center gap-6 rounded-xl border border-border bg-secondary/30 p-5">
            <ScoreRing score={analysis.score} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground mb-1">Summary</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {analysis.summary || "No summary available."}
              </p>
            </div>
          </div>

          {doc.docType === "cv" && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setReAnalyzeDialog(true)}>
                Analyze for another job
              </Button>
            </div>
          )}
          {(analysis.ats_score != null || analysis.jd_match != null || (analysis.keyword_gap?.length ?? 0) > 0 || (analysis.keyword_matched?.length ?? 0) > 0) && (
            <>
              <Separator />
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">ATS & job match</h2>
                </div>
                <div className="space-y-4 rounded-lg border border-border bg-card p-4">
                  <div className="flex flex-wrap gap-4">
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
                  </div>
                  {(analysis.keyword_matched?.length ?? 0) > 0 && (
                    <div className="min-w-0">
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Matched keywords (in resume)</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(analysis.keyword_matched ?? []).map((kw) => (
                          <Badge key={kw} variant="outline" className="border-green-500/50 bg-green-500/10 text-xs font-normal text-green-700 dark:text-green-400">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {(analysis.keyword_gap?.length ?? 0) > 0 && (
                    <div className="min-w-0">
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Missing / weak keywords (add these)</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(analysis.keyword_gap ?? []).map((kw) => (
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

          {(analysis.cv_checklist?.length ?? 0) > 0 && (
            <>
              <Separator />
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">CV checklist</h2>
                </div>
                <ul className="space-y-2 rounded-lg border border-border bg-card p-3">
                  {analysis.cv_checklist!.map((c, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-md py-1.5">
                      {c.passed ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-500" />
                      ) : (
                        <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 border-amber-500/60 bg-transparent" />
                      )}
                      <div className="min-w-0">
                        <p className={c.passed ? "text-xs font-medium text-foreground" : "text-xs font-medium text-foreground"}>
                          {c.item}
                        </p>
                        {!c.passed && c.tip && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{c.tip}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {(analysis.stronger_verbs?.length ?? 0) > 0 && (
            <>
              <Separator />
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Stronger verbs</h2>
                </div>
                <p className="mb-2 text-xs text-muted-foreground">Replace weak phrasing with more impactful language:</p>
                <ul className="space-y-2 rounded-lg border border-border bg-card p-3">
                  {(analysis.stronger_verbs ?? []).map((v, i) => (
                    <li key={i} className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded bg-muted/80 px-2 py-0.5 font-medium text-muted-foreground line-through">{v.original}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="rounded bg-primary/10 px-2 py-0.5 font-medium text-primary">{v.suggested}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {analysis.missing_sections.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Missing sections</h2>
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

          {analysis.issues.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Issues found</h2>
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
                        <p className="text-xs font-medium text-foreground">{issue.section}</p>
                        <p className="text-xs text-muted-foreground">{issue.problem}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {hasFullAnalysis && analysis.rewrites.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <MessageSquareText className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Suggested rewrites — accept or reject each
                  </h2>
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
                <div className="mt-3">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setShowCompare((v) => !v)}>
                    <GitCompare className="h-3.5 w-3.5" />
                    {showCompare ? "Hide" : "Show"} full compare
                  </Button>
                </div>
              </div>
            </>
          )}

          {showCompare && (originalFullText || improvedFullText) && (
            <>
              <Separator />
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <GitCompare className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Compare: original vs improved</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-border overflow-hidden">
                  <div className="flex flex-col min-h-[280px] bg-muted/30">
                    <div className="px-3 py-2 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Original
                    </div>
                    <div className="flex-1 overflow-auto p-4">
                      <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-foreground">
                        {originalFullText || "(no text)"}
                      </pre>
                    </div>
                  </div>
                  <div className="flex flex-col min-h-[280px] bg-primary/5">
                    <div className="px-3 py-2 border-b border-border text-xs font-semibold text-primary/80 uppercase tracking-wide">
                      Improved
                    </div>
                    <div className="flex-1 overflow-auto p-4">
                      <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-foreground">
                        {improvedFullText || "(no text)"}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {!hasFullAnalysis && analysis.fixedText && (
            <>
              <Separator />
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Improved document</h2>
                </div>
                <div className="max-h-60 overflow-y-auto rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                    {analysis.fixedText}
                  </pre>
                </div>
              </div>
            </>
          )}

          {rewrite && (
            <>
              <Separator />
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Export improved document</p>
                <div className="mb-3 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Style:</span>
                    <select
                      aria-label="Export style"
                      value={exportTemplate}
                      onChange={(e) => setExportTemplate(e.target.value as ExportTemplate)}
                      className="rounded-md border border-input bg-transparent px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {(["plain", "cv", "academic", "proposal"] as const).map((t) => (
                        <option key={t} value={t}>{EXPORT_TEMPLATE_LABELS[t]}</option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={exportBranded}
                      onChange={(e) => setExportBranded(e.target.checked)}
                      className="rounded border-input"
                    />
                    Branded footer (PDF/DOCX)
                  </label>
                </div>
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
            </>
          )}

          <Dialog open={reAnalyzeDialog} onOpenChange={setReAnalyzeDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Analyze for another job</DialogTitle>
                <DialogDescription>
                  Paste a different job description to get a new ATS score, JD match %, and keyword gap. This will create a new analysis and keep the previous one in history.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="reanalyze-jd" className="text-sm font-medium text-foreground">
                    Job description
                  </label>
                  <textarea
                    id="reanalyze-jd"
                    placeholder="Paste the job posting here…"
                    value={reAnalyzeJd}
                    onChange={(e) => setReAnalyzeJd(e.target.value)}
                    className="min-h-[120px] w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="reanalyze-industry" className="text-sm font-medium text-foreground">
                    Industry or target role (optional)
                  </label>
                  <input
                    id="reanalyze-industry"
                    type="text"
                    placeholder="e.g. Software Engineer, Healthcare"
                    value={reAnalyzeIndustry}
                    onChange={(e) => setReAnalyzeIndustry(e.target.value)}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setReAnalyzeDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleReAnalyze} disabled={reAnalyzing}>
                  {reAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    "Re-analyze"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
}
