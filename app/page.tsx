"use client"

import Link from "next/link"
import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { HowItWorks } from "@/components/sections/how-it-works"
import { Testimonials } from "@/components/sections/testimonials"
import { Faq } from "@/components/sections/faq"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Testimonials />

        {/* Pricing CTA */}
        <section className="border-t border-border bg-secondary/20 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Ready to fix your documents?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Start free. Upgrade when you need unlimited analyses and PDF/DOCX export.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline">
                  View pricing
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <Faq />
      </main>
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 sm:flex-row sm:justify-between sm:px-6">
          <p className="text-sm text-muted-foreground">
            FixMyDoc. AI-powered document improvement.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground/60">
            <Link href="/pricing" className="hover:text-muted-foreground transition-colors">Pricing</Link>
            <Link href="/privacy" className="hover:text-muted-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-muted-foreground transition-colors">Terms</Link>
            <Link href="/data-retention" className="hover:text-muted-foreground transition-colors">Data Retention</Link>
            <Link href="/ai-disclaimer" className="hover:text-muted-foreground transition-colors">AI Disclaimer</Link>
            <span>Built with Next.js and shadcn/ui</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
