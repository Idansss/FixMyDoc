"use client"

import { useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Zap } from "lucide-react"
import { toast } from "sonner"

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Try FixMyDoc with no commitment.",
    planKey: null as null | "pro" | "business",
    features: [
      "1 document analysis per day",
      "CV, legal, academic & business docs",
      "Quality score breakdown",
      "AI-powered rewrites",
      "Export as TXT",
    ],
    cta: "Get started free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "per month",
    description: "For professionals who need more.",
    planKey: "pro" as const,
    features: [
      "Unlimited document analyses",
      "CV, legal, academic & business docs",
      "Quality score breakdown",
      "AI-powered rewrites",
      "Export as TXT, PDF & DOCX",
      "Priority processing",
    ],
    cta: "Upgrade to Pro",
    highlight: true,
  },
  {
    name: "Business",
    price: "$29",
    period: "per month",
    description: "For teams and high-volume users.",
    planKey: "business" as const,
    features: [
      "Everything in Pro",
      "Unlimited document analyses",
      "Fastest processing priority",
      "Export as TXT, PDF & DOCX",
      "Team-friendly billing",
      "Dedicated support",
    ],
    cta: "Upgrade to Business",
    highlight: false,
  },
]

function PlanCard({
  plan,
}: {
  plan: (typeof PLANS)[number]
}) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    if (!plan.planKey) return
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.planKey }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please sign in to upgrade.")
          return
        }
        toast.error(data.error || "Checkout failed.")
        return
      }
      if (data.url) window.location.href = data.url
    } catch {
      toast.error("Checkout failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-8 shadow-[var(--card-shadow)] ${
        plan.highlight
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-border bg-card"
      }`}
    >
      {plan.highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="gap-1 px-3 py-1 text-xs">
            <Zap className="h-3 w-3" />
            Most popular
          </Badge>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-base font-semibold text-foreground">{plan.name}</h2>
        <div className="mt-3 flex items-end gap-1">
          <span className="text-4xl font-bold tracking-tight text-foreground">
            {plan.price}
          </span>
          <span className="mb-1 text-sm text-muted-foreground">
            /{plan.period}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
      </div>

      <ul className="mb-8 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="text-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      {plan.planKey ? (
        <Button
          className="w-full"
          variant={plan.highlight ? "default" : "outline"}
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? "Loading..." : plan.cta}
        </Button>
      ) : (
        <Link href="/dashboard">
          <Button className="w-full" variant="outline">
            {plan.cta}
          </Button>
        </Link>
      )}
    </div>
  )
}

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="px-4 pb-24 pt-20 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-14 text-center">
              <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Simple, transparent pricing
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Start for free. Upgrade when you need more.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {PLANS.map((plan) => (
                <PlanCard key={plan.name} plan={plan} />
              ))}
            </div>

            <p className="mt-10 text-center text-sm text-muted-foreground">
              All plans include a 30-day money-back guarantee. No questions asked.
            </p>
          </div>
        </section>
      </main>
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 sm:flex-row sm:justify-between sm:px-6">
          <p className="text-sm text-muted-foreground">
            FixMyDoc. AI-powered document improvement.
          </p>
          <p className="text-xs text-muted-foreground/60">
            Built with Next.js and shadcn/ui
          </p>
        </div>
      </footer>
    </div>
  )
}
