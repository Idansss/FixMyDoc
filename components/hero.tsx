import Link from "next/link"
import { FileText, ArrowRight, Shield, Zap, Download } from "lucide-react"

export function Hero() {
  return (
    <section className="relative flex flex-col items-center px-4 pb-24 pt-20 sm:px-6 md:pt-32">
      <div
        className="pointer-events-none absolute top-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.72 0.14 180 / 0.4), transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex max-w-3xl flex-col items-center text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
          <Zap className="h-3.5 w-3.5 text-primary" />
          AI-powered document analysis
        </div>

        <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
          Improve your documents with AI
        </h1>

        <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
          Upload your CV, legal brief, academic paper, or business document.
          Get instant AI analysis, scoring, and polished rewrites ready for export.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#features"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-secondary/50 px-6 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Learn more
          </Link>
        </div>
      </div>

      <div
        id="features"
        className="relative z-10 mx-auto mt-24 grid max-w-4xl gap-4 sm:grid-cols-3"
      >
        <FeatureCard
          icon={<FileText className="h-5 w-5 text-primary" />}
          title="Smart Analysis"
          description="AI evaluates structure, clarity, grammar, and tone for any document type."
        />
        <FeatureCard
          icon={<Shield className="h-5 w-5 text-primary" />}
          title="Quality Scoring"
          description="Get a detailed score breakdown to know exactly where your document stands."
        />
        <FeatureCard
          icon={<Download className="h-5 w-5 text-primary" />}
          title="Export Anywhere"
          description="Download improved documents as PDF, DOCX, or plain text in one click."
        />
      </div>
    </section>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
        {icon}
      </div>
      <h3 className="mb-1.5 text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  )
}
