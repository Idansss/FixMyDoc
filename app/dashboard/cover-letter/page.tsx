"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Download, Loader2, Copy, Check, Save } from "lucide-react"
import { toast } from "sonner"
import { track } from "@/lib/analytics"

export default function CoverLetterPage() {
  const [resumeText, setResumeText] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [coverLetter, setCoverLetter] = useState("")
  const [length, setLength] = useState<"short" | "medium" | "long">("medium")
  const [tone, setTone] = useState<"professional" | "friendly" | "formal">("professional")
  const [generating, setGenerating] = useState(false)
  const [exportLoading, setExportLoading] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [branded, setBranded] = useState(true)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      toast.error("Please paste your resume and the job description.")
      return
    }
    setGenerating(true)
    setCoverLetter("")
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: resumeText.trim(),
          jobDescription: jobDescription.trim(),
          length,
          tone,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to generate cover letter.")
        return
      }
      setCoverLetter(data.coverLetter ?? "")
      track("cover_letter_generate", {})
      toast.success("Cover letter generated.")
    } catch {
      toast.error("Failed to generate cover letter.")
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveToDocuments = async () => {
    if (!coverLetter.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/cover-letter/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: coverLetter.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to save.")
        return
      }
      track("cover_letter_save", {})
      toast.success("Saved to My Documents.")
      if (data.documentId) {
        window.location.href = `/dashboard/documents/${data.documentId}`
      } else {
        window.location.href = "/dashboard"
      }
    } catch {
      toast.error("Failed to save.")
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = async () => {
    if (!coverLetter) return
    try {
      await navigator.clipboard.writeText(coverLetter)
      setCopied(true)
      toast.success("Copied to clipboard.")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Could not copy.")
    }
  }

  const handleExport = async (format: "txt" | "pdf" | "docx") => {
    if (!coverLetter) return
    setExportLoading(format)
    try {
      const res = await fetch("/api/export/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: coverLetter, format, branded }),
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
      a.download = `fixmydoc-cover-letter.${format}`
      a.click()
      URL.revokeObjectURL(url)
      track("cover_letter_export", { format })
      toast.success(`Exported as ${format.toUpperCase()}.`)
    } catch {
      toast.error("Export failed.")
    } finally {
      setExportLoading(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Cover letter generator
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste your resume and a job description to get a tailored cover letter.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Length</label>
              <Select value={length} onValueChange={(v) => setLength(v as "short" | "medium" | "long")}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (3–4 paragraphs)</SelectItem>
                  <SelectItem value="medium">Medium (4–5 paragraphs)</SelectItem>
                  <SelectItem value="long">Long (full page)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tone</label>
              <Select value={tone} onValueChange={(v) => setTone(v as "professional" | "friendly" | "formal")}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              "Generate cover letter"
            )}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Generated cover letter</label>
            {coverLetter && (
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={handleCopy}>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={handleSaveToDocuments}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save to My Documents
                </Button>
              </div>
            )}
          </div>
          <div className="min-h-[200px] rounded-lg border border-border bg-muted/20 p-4">
            {coverLetter ? (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {coverLetter}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your cover letter will appear here after you generate it.
              </p>
            )}
          </div>
          {coverLetter && (
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={branded}
                  onChange={(e) => setBranded(e.target.checked)}
                  className="rounded border-input"
                />
                Add &quot;Created with FixMyDoc&quot; footer
              </label>
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
                    {exportLoading === fmt ? "Exporting…" : fmt.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
