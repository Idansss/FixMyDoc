import { Upload, Sparkles, Download } from "lucide-react"

const STEPS = [
  {
    number: "01",
    icon: <Upload className="h-6 w-6 text-primary" />,
    title: "Upload your document",
    description:
      "Drop in your PDF or DOCX file — CV, legal brief, academic paper, or business doc. Max 5 MB.",
  },
  {
    number: "02",
    icon: <Sparkles className="h-6 w-6 text-primary" />,
    title: "AI analyzes and rewrites",
    description:
      "Claude reads your document, scores it across clarity, structure, grammar, and tone, then produces an improved version.",
  },
  {
    number: "03",
    icon: <Download className="h-6 w-6 text-primary" />,
    title: "Export and share",
    description:
      "Download the polished document as TXT (free), or as PDF and DOCX with a Pro or Business plan.",
  },
]

export function HowItWorks() {
  return (
    <section className="border-t border-border bg-secondary/20 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            How it works
          </h2>
          <p className="mt-3 text-muted-foreground">
            From upload to export in under a minute.
          </p>
        </div>

        <div className="relative grid gap-8 sm:grid-cols-3">
          <div className="absolute left-0 right-0 top-10 hidden h-px bg-border sm:block" />

          {STEPS.map((step) => (
            <div key={step.number} className="relative flex flex-col items-center text-center">
              <div className="relative mb-5 flex h-20 w-20 flex-col items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full border border-border bg-background px-2 text-[10px] font-semibold tracking-widest text-muted-foreground">
                  {step.number}
                </span>
                {step.icon}
              </div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
