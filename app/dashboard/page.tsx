"use client"

import { useCallback, useEffect, useState } from "react"
import { UploadSection } from "@/components/dashboard/upload-section"
import {
  DocumentsTable,
  type Document,
} from "@/components/dashboard/documents-table"
import type { AnalysisData } from "@/components/dashboard/analysis-modal"
import { Button } from "@/components/ui/button"
import { FileText, TrendingUp, CheckCircle, Loader2 } from "lucide-react"
import { UsageCard } from "@/components/dashboard/usage-card"

export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const [historyError, setHistoryError] = useState(false)
  const loadHistory = useCallback(async () => {
    setHistoryError(false)
    setHistoryLoading(true)
    try {
      const res = await fetch("/api/documents")
      if (!res.ok) throw new Error("Failed to load")
      const data = await res.json()
      if (data.documents) setDocuments(data.documents as Document[])
    } catch {
      setHistoryError(true)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleUpload = (file: File, docType: string, documentId: string, extractedText: string) => {
    const newDoc: Document = {
      id: documentId,
      filename: file.name,
      docType,
      score: null,
      status: "uploaded",
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      extractedText,
    }
    setDocuments((prev) => {
      // replace if already in list (e.g. from history load)
      if (prev.some((d) => d.id === documentId)) {
        return prev.map((d) => (d.id === documentId ? newDoc : d))
      }
      return [newDoc, ...prev]
    })
  }

  const handleAnalyzeComplete = (
    docId: string,
    rewriteId: string,
    score: number,
    analysis: AnalysisData
  ) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? { ...d, status: "analyzed" as const, score, rewriteId, analysis }
          : d
      )
    )
  }

  const handleDelete = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId))
  }

  const analyzedCount = documents.filter((d) => d.status === "analyzed").length
  const avgScore =
    analyzedCount > 0
      ? Math.round(
          documents
            .filter((d) => d.score !== null)
            .reduce((sum, d) => sum + (d.score ?? 0), 0) / analyzedCount
        )
      : 0

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload, analyze, and export your documents.
        </p>
      </div>

      <div className="mb-6">
        <UsageCard />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<FileText className="h-4 w-4 text-primary" />}
          label="Total Documents"
          value={historyLoading ? null : String(documents.length)}
        />
        <StatCard
          icon={<CheckCircle className="h-4 w-4 text-primary" />}
          label="Analyzed"
          value={historyLoading ? null : String(analyzedCount)}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
          label="Avg. Score"
          value={historyLoading ? null : avgScore > 0 ? `${avgScore}/100` : "--"}
        />
      </div>

      <div className="mb-8">
        <UploadSection onUpload={handleUpload} />
      </div>

      {historyLoading ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading your documents…</p>
        </div>
      ) : historyError ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-12">
          <p className="text-sm text-muted-foreground">Could not load documents.</p>
          <Button variant="outline" size="sm" onClick={loadHistory}>
            Try again
          </Button>
        </div>
      ) : (
        <DocumentsTable
          documents={documents}
          onAnalyzeComplete={handleAnalyzeComplete}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | null
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
          {icon}
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">
        {value === null ? (
          <span className="inline-block h-6 w-10 animate-pulse rounded bg-secondary" />
        ) : (
          value
        )}
      </p>
    </div>
  )
}
