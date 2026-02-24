import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Privacy Policy | FixMyDoc",
  description: "Privacy policy for FixMyDoc document improvement service.",
}

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: February 2025
        </p>
        <div className="prose prose-neutral dark:prose-invert mt-8 max-w-none text-sm text-foreground/90">
          <h2 className="text-lg font-semibold mt-6">1. Information we collect</h2>
          <p>
            We collect information you provide when using FixMyDoc: account details (via our identity provider),
            documents you upload for analysis, and usage data necessary to provide the service and prevent abuse.
          </p>
          <h2 className="text-lg font-semibold mt-6">2. How we use your information</h2>
          <p>
            Your documents and analysis results are used solely to provide the improvement and export features.
            We do not train AI models on your content. We use usage data for rate limiting, support, and service improvement.
          </p>
          <h2 className="text-lg font-semibold mt-6">3. Data retention</h2>
          <p>
            Document content and analysis are stored so you can view and export them. You can delete documents at any time
            from your dashboard. We retain minimal logs as needed for security and compliance. See our{" "}
            <Link href="/data-retention" className="text-primary underline">Data Retention</Link> page for details.
          </p>
          <h2 className="text-lg font-semibold mt-6">4. Third parties</h2>
          <p>
            We use trusted providers for authentication, hosting, storage, and AI analysis. They process data according
            to our instructions and their own privacy commitments. We do not sell your data.
          </p>
          <h2 className="text-lg font-semibold mt-6">5. Your rights</h2>
          <p>
            You may access, correct, or delete your data through your account and dashboard. Contact us for other requests
            or questions about this policy.
          </p>
        </div>
      </div>
    </div>
  )
}
