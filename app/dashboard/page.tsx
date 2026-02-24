"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { UploadSection } from "@/components/dashboard/upload-section"
import {
  DocumentsTable,
  type Document,
} from "@/components/dashboard/documents-table"
import type { AnalysisData } from "@/components/dashboard/analysis-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileText, TrendingUp, CheckCircle, Loader2, Search, ChevronDown } from "lucide-react"
import { UsageCard } from "@/components/dashboard/usage-card"
import { ScoreHistoryChart } from "@/components/dashboard/score-history-chart"
import { OnboardingModal } from "@/components/dashboard/onboarding-modal"

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
    const now = new Date()
    const newDoc: Document = {
      id: documentId,
      filename: file.name,
      docType,
      score: null,
      status: "uploaded",
      date: now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      createdAt: now.toISOString(),
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

  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const filteredDocuments = useMemo(() => {
    let list = documents
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((d) => d.filename.toLowerCase().includes(q))
    }
    if (filterType && filterType !== "all") {
      list = list.filter((d) => d.docType === filterType)
    }
    if (dateFrom) {
      list = list.filter((d) => d.createdAt && d.createdAt >= dateFrom)
    }
    if (dateTo) {
      const end = dateTo + "T23:59:59.999Z"
      list = list.filter((d) => d.createdAt && d.createdAt <= end)
    }
    return list
  }, [documents, search, filterType, dateFrom, dateTo])

  const analyzedCount = documents.filter((d) => d.status === "analyzed").length
  const avgScore =
    analyzedCount > 0
      ? Math.round(
          documents
            .filter((d) => d.score !== null)
            .reduce((sum, d) => sum + (d.score ?? 0), 0) / analyzedCount
        )
      : 0

  const showUploadHint = !historyLoading && documents.length === 0

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <OnboardingModal hasDocuments={!historyLoading && documents.length > 0} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload, analyze, and export your documents.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UsageCard />
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

      {!historyLoading && (
        <div className="mb-8">
          <ScoreHistoryChart documents={documents} />
        </div>
      )}

      <div className="relative mb-8">
        {showUploadHint && (
          <div className="absolute -top-9 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-lg">
            Start here — upload your first document
            <ChevronDown className="h-3.5 w-3.5" />
          </div>
        )}
        <div className={showUploadHint ? "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-2xl" : ""}>
          <UploadSection onUpload={handleUpload} />
        </div>
      </div>

      {historyLoading ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-12 shadow-[var(--card-shadow)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading your documents…</p>
        </div>
      ) : historyError ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-12 shadow-[var(--card-shadow)]">
          <p className="text-sm text-muted-foreground">Could not load documents.</p>
          <Button variant="outline" size="sm" onClick={loadHistory}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--card-shadow)]">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by filename…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="cv">CV</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="cover_letter">Cover letter</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="From"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[140px]"
            />
            <Input
              type="date"
              placeholder="To"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[140px]"
            />
            {(search || filterType !== "all" || dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("")
                  setFilterType("all")
                  setDateFrom("")
                  setDateTo("")
                }}
              >
                Clear
              </Button>
            )}
          </div>
          <DocumentsTable
            documents={filteredDocuments}
            onAnalyzeComplete={handleAnalyzeComplete}
            onDelete={handleDelete}
          />
        </>
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
    <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--card-shadow)]">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
          {icon}
        </div>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">
        {value === null ? (
          <span className="inline-block h-7 w-12 animate-pulse rounded-lg bg-muted" />
        ) : (
          value
        )}
      </p>
    </div>
  )
}
