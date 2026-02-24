import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Data Retention | FixMyDoc",
  description: "How FixMyDoc retains and deletes your data.",
}

export default function DataRetentionPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-8 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Data Retention
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          How we store and delete your data
        </p>
        <div className="prose prose-neutral dark:prose-invert mt-8 max-w-none text-sm text-foreground/90">
          <h2 className="text-lg font-semibold mt-6">Documents and analysis</h2>
          <p>
            Uploaded documents, extracted text, and analysis results (including rewrites) are stored so you can
            view, compare, and export them. They remain until you delete the document from your dashboard or
            delete your account.
          </p>
          <h2 className="text-lg font-semibold mt-6">On delete</h2>
          <p>
            When you delete a document, we remove the file from storage and the associated database records
            (including analysis and rewrites) within a short period. Backups may retain deleted data for a
            limited retention window before purge.
          </p>
          <h2 className="text-lg font-semibold mt-6">Account data</h2>
          <p>
            Account and subscription data are retained as long as your account is active and as required for
            billing and legal obligations after cancellation.
          </p>
          <h2 className="text-lg font-semibold mt-6">Logs and security</h2>
          <p>
            Access and error logs may be kept for security and debugging for a limited time (e.g. 30–90 days)
            and then removed or anonymized.
          </p>
        </div>
      </div>
    </div>
  )
}
