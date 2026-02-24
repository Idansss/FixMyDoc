"use client"

import { useCallback, useState } from "react"
import { Upload, FileText, X } from "lucide-react"
import { track } from "@/lib/analytics"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

const DOC_TYPES = [
  { value: "cv", label: "CV / Resume" },
  { value: "legal", label: "Legal Document" },
  { value: "academic", label: "Academic Paper" },
  { value: "business", label: "Business Document" },
] as const

export function UploadSection({ onUpload }: { onUpload: (file: File, docType: string, documentId: string, extractedText: string) => void }) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docType, setDocType] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const validateFile = useCallback((file: File) => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ]
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Use PDF, DOCX, or images (PNG, JPEG, WebP).")
      return false
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 10MB.")
      return false
    }
    return true
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      const file = e.dataTransfer.files?.[0]
      if (file && validateFile(file)) {
        setSelectedFile(file)
      }
    },
    [validateFile]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file && validateFile(file)) {
        setSelectedFile(file)
      }
    },
    [validateFile]
  )

  const handleUpload = async () => {
    if (!selectedFile || !docType) {
      toast.error("Please select a file and document type.")
      return
    }
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("docType", docType)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "Upload failed.")
        return
      }
      const data = await res.json()
      onUpload(selectedFile, docType, data.documentId, data.extractedText ?? "")
      track("upload_success", { docType })
      toast.success(`"${selectedFile.name}" uploaded successfully.`)
      setSelectedFile(null)
      setDocType("")
    } catch {
      toast.error("Upload failed. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--card-shadow)]">
      <h2 className="mb-4 text-base font-semibold text-foreground">
        Upload Document
      </h2>

      <div
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground/40"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Upload a PDF, DOCX, or image file"
        />

        {selectedFile ? (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedFile(null)
              }}
              aria-label="Remove selected file"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-foreground">
              Drag and drop your file here
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, DOCX, or images (PNG, JPEG, WebP), max 10MB. Scanned docs supported via OCR.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={docType} onValueChange={setDocType}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Document type" />
          </SelectTrigger>
          <SelectContent>
            {DOC_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !docType || isUploading}
          className="w-full sm:w-auto"
        >
          {isUploading ? "Uploading..." : "Upload"}
        </Button>
      </div>
    </div>
  )
}
