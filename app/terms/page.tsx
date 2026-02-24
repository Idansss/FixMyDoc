import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Terms of Service | FixMyDoc",
  description: "Terms of service for FixMyDoc.",
}

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: February 2025
        </p>
        <div className="prose prose-neutral dark:prose-invert mt-8 max-w-none text-sm text-foreground/90">
          <h2 className="text-lg font-semibold mt-6">1. Acceptance</h2>
          <p>
            By using FixMyDoc you agree to these terms and our{" "}
            <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>.
          </p>
          <h2 className="text-lg font-semibold mt-6">2. Service</h2>
          <p>
            FixMyDoc provides AI-assisted document analysis and improvement. We reserve the right to modify or discontinue
            features with reasonable notice. Use is subject to your plan and our fair-use and rate-limit policies.
          </p>
          <h2 className="text-lg font-semibold mt-6">3. Acceptable use</h2>
          <p>
            You may not use the service for illegal purposes, to infringe others&apos; rights, or to abuse our systems.
            You retain ownership of your content; you grant us the limited rights needed to operate the service.
          </p>
          <h2 className="text-lg font-semibold mt-6">4. AI disclaimer</h2>
          <p>
            Outputs are AI-generated suggestions. They are not legal, career, or professional advice. See our{" "}
            <Link href="/ai-disclaimer" className="text-primary underline">AI Disclaimer</Link> for more.
          </p>
          <h2 className="text-lg font-semibold mt-6">5. Limitation of liability</h2>
          <p>
            The service is provided &quot;as is.&quot; We are not liable for indirect or consequential damages arising from
            your use of the service or reliance on AI-generated content.
          </p>
        </div>
      </div>
    </div>
  )
}
