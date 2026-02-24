const TESTIMONIALS = [
  {
    quote:
      "I uploaded my CV and got an 83/100 score with detailed rewrites in seconds. Landed two interviews the same week.",
    name: "Sarah M.",
    role: "Software engineer",
    initials: "SM",
  },
  {
    quote:
      "Our legal team uses FixMyDoc to do a quick sanity-check on client briefs before review. Catches things we'd miss under pressure.",
    name: "James T.",
    role: "Paralegal",
    initials: "JT",
  },
  {
    quote:
      "As a non-native English speaker, having AI rewrite my academic abstracts has been a game-changer for getting accepted to journals.",
    name: "Priya K.",
    role: "PhD researcher",
    initials: "PK",
  },
]

export function Testimonials() {
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Trusted by professionals
          </h2>
          <p className="mt-3 text-muted-foreground">
            Real people, real results.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6"
            >
              <p className="flex-1 text-sm leading-relaxed text-foreground/80">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
