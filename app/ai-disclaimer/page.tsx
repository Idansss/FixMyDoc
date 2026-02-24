import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "AI Disclaimer | FixMyDoc",
  description: "Disclaimer regarding AI-generated document suggestions.",
}

export default function AiDisclaimerPage() {
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
          AI Disclaimer
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Important information about AI-generated content
        </p>
        <div className="prose prose-neutral dark:prose-invert mt-8 max-w-none text-sm text-foreground/90">
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-amber-800 dark:text-amber-200">
            FixMyDoc uses artificial intelligence to suggest improvements to your documents. All suggestions are
            for guidance only and do not constitute legal, career, tax, or other professional advice.
          </p>
          <h2 className="text-lg font-semibold mt-6">Accuracy and review</h2>
          <p>
            AI can make mistakes or produce content that does not fit your situation. You are responsible for
            reviewing and approving any changes before using them in official or professional contexts.
          </p>
          <h2 className="text-lg font-semibold mt-6">Legal and sensitive documents</h2>
          <p>
            For legal documents, contracts, or compliance-sensitive material, we recommend having a qualified
            professional review the output. Do not rely solely on AI suggestions for binding or regulated content.
          </p>
          <h2 className="text-lg font-semibold mt-6">Resumes and applications</h2>
          <p>
            Our resume and CV suggestions (including ATS-related feedback) are intended to improve clarity and
            keyword alignment. They do not guarantee interviews or job offers. Always tailor content to the
            specific role and verify facts.
          </p>
        </div>
      </div>
    </div>
  )
}
