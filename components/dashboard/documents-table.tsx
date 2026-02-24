"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import {
  Eye,
  Download,
  Sparkles,
  MoreHorizontal,
  FileText,
  Loader2,
  Trash2,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { track } from "@/lib/analytics"
import type { AnalysisData } from "./analysis-modal"

export type Document = {
  id: string
  filename: string
  docType: string
  score: number | null
  status: "uploaded" | "analyzing" | "analyzed"
  date: string
  rewriteId?: string | null
  extractedText?: string
  analysis?: AnalysisData
}

const TYPE_LABELS: Record<string, string> = {
  cv: "CV",
  legal: "Legal",
  academic: "Academic",
  business: "Business",
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-muted-foreground">--</span>
  let variant: "default" | "secondary" | "destructive" = "default"
  if (score < 50) variant = "destructive"
  else if (score < 75) variant = "secondary"
  return (
    <Badge variant={variant} className="tabular-nums">
      {score}/100
    </Badge>
  )
}

export function DocumentsTable({
  documents,
  onAnalyzeComplete,
  onDelete,
}: {
  documents: Document[]
  onAnalyzeComplete: (docId: string, rewriteId: string, score: number, analysis: AnalysisData) => void
  onDelete?: (docId: string) => void
}) {
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [cvAnalyzeDialog, setCvAnalyzeDialog] = useState<{ doc: Document; jobDescription: string } | null>(null)

  const runAnalyze = async (doc: Document, jobDescription?: string | null) => {
    if (!doc.extractedText) {
      toast.error("Missing document text.")
      return
    }
    setAnalyzingId(doc.id)
    setCvAnalyzeDialog(null)
    try {
      const body: Record<string, unknown> = {
        documentId: doc.id,
        extractedText: doc.extractedText,
        docType: doc.docType,
      }
      if (doc.docType === "cv" && jobDescription?.trim()) {
        body.jobDescription = jobDescription.trim()
      }
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || "Analysis failed.")
        return
      }
      const analysisData: AnalysisData = {
        score: data.score ?? 0,
        summary: data.summary ?? "",
        issues: data.issues ?? [],
        rewrites: data.rewrites ?? [],
        missing_sections: data.missing_sections ?? [],
        ...(data.ats_score != null && { ats_score: data.ats_score }),
        ...(data.jd_match != null && { jd_match: data.jd_match }),
        ...(data.keyword_gap != null && { keyword_gap: data.keyword_gap }),
      }
      onAnalyzeComplete(doc.id, data.rewriteId, data.score ?? 0, analysisData)
      track("analyze_complete", { docType: doc.docType })
      toast.success("Analysis complete!")
    } catch {
      toast.error("Analysis failed.")
    } finally {
      setAnalyzingId(null)
    }
  }

  const handleAnalyze = (doc: Document) => {
    if (doc.docType === "cv") {
      setCvAnalyzeDialog({ doc, jobDescription: "" })
      return
    }
    runAnalyze(doc)
  }

  const handleDelete = async (docId: string) => {
    if (!confirm("Delete this document? This cannot be undone.")) return
    setDeletingId(docId)
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || "Failed to delete")
        return
      }
      onDelete?.(docId)
      toast.success("Document deleted")
    } catch {
      toast.error("Failed to delete")
    } finally {
      setDeletingId(null)
    }
  }

  const handleExport = async (rewriteId: string, format: string) => {
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewriteId, format }),
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
      a.download = `fixmydoc-export-${rewriteId}.${format === "txt" ? "txt" : format}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Exported as ${format.toUpperCase()}.`)
    } catch {
      toast.error("Export failed.")
    }
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            No documents yet
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Upload a PDF or DOCX above, pick a type (CV, Legal, Academic, or Business), then click Analyze to get your score and improved text.
          </p>
          <p className="text-xs text-muted-foreground">
            Tip: Use the &quot;View&quot; button after analysis to see the full report and export.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-[var(--card-shadow)]">
        <div className="p-6 pb-4">
          <h2 className="text-base font-semibold text-foreground">
            Your Documents
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {documents.length} document{documents.length !== 1 ? "s" : ""} uploaded
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Filename</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Score</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => {
              const isAnalyzing = analyzingId === doc.id || doc.status === "analyzing"
              return (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
                      <span className="max-w-[180px] truncate text-sm font-medium text-foreground">
                        {doc.filename}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-normal">
                      {TYPE_LABELS[doc.docType] || doc.docType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isAnalyzing ? (
                      <div className="flex items-center gap-2">
                        <Progress value={65} className="h-1.5 w-16" />
                        <span className="text-xs text-muted-foreground">
                          Analyzing
                        </span>
                      </div>
                    ) : (
                      <ScoreBadge score={doc.score} />
                    )}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                    {doc.date}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {doc.status === "uploaded" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs text-primary hover:text-primary"
                          onClick={() => handleAnalyze(doc)}
                          disabled={isAnalyzing}
                        >
                          {isAnalyzing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="h-3.5 w-3.5" />
                          )}
                          <span className="hidden sm:inline">Analyze</span>
                        </Button>
                      )}

                      {doc.status === "analyzed" && (
                        <Link href={`/dashboard/documents/${doc.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                        </Link>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">More actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {doc.status === "analyzed" && doc.rewriteId && (
                            <>
                              <DropdownMenuItem onClick={() => handleExport(doc.rewriteId!, "txt")}>
                                <Download className="mr-2 h-4 w-4" />
                                Export as TXT
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExport(doc.rewriteId!, "pdf")}>
                                <Download className="mr-2 h-4 w-4" />
                                Export as PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExport(doc.rewriteId!, "docx")}>
                                <Download className="mr-2 h-4 w-4" />
                                Export as DOCX
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/documents/${doc.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View full page
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => (doc.docType === "cv" ? setCvAnalyzeDialog({ doc, jobDescription: "" }) : runAnalyze(doc))}
                                disabled={isAnalyzing}
                              >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Re-analyze
                              </DropdownMenuItem>
                            </>
                          )}
                          {doc.status !== "analyzed" && (
                            <DropdownMenuItem disabled>
                              <Download className="mr-2 h-4 w-4" />
                              Analyze first to export
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(doc.id)}
                            disabled={deletingId === doc.id}
                          >
                            {deletingId === doc.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {/* CV ATS: optional job description before analyze */}
        <Dialog open={!!cvAnalyzeDialog} onOpenChange={(open) => !open && setCvAnalyzeDialog(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Analyze resume (optional ATS)</DialogTitle>
              <DialogDescription>
                Paste a job description to get an ATS score, JD match %, and missing keywords. Leave blank for general CV feedback only.
              </DialogDescription>
            </DialogHeader>
            {cvAnalyzeDialog && (
              <>
                <div className="space-y-2">
                  <label htmlFor="jd" className="text-sm font-medium text-foreground">
                    Job description (optional)
                  </label>
                  <textarea
                    id="jd"
                    placeholder="Paste the job posting here…"
                    value={cvAnalyzeDialog.jobDescription}
                    onChange={(e) => setCvAnalyzeDialog({ ...cvAnalyzeDialog, jobDescription: e.target.value })}
                    className="min-h-[120px] w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCvAnalyzeDialog(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => runAnalyze(cvAnalyzeDialog.doc, cvAnalyzeDialog.jobDescription)}
                    disabled={analyzingId === cvAnalyzeDialog.doc.id}
                  >
                    {analyzingId === cvAnalyzeDialog.doc.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing…
                      </>
                    ) : (
                      "Analyze"
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
  )
}
