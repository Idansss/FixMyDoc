"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { track } from "@/lib/analytics"

type Plan = "free" | "pro" | "business"
type Usage = {
  plan: Plan
  used: number
  limit: number | null
  resetAt: string | null
  isUnlimited: boolean
}

const PLAN_LABELS: Record<Plan, string> = {
  free: "Free",
  pro: "Pro",
  business: "Business",
}

const PLAN_DESCRIPTIONS: Record<Plan, string> = {
  free: "1 analysis per day. Export as TXT only.",
  pro: "Unlimited analyses, PDF/DOCX export, priority processing.",
  business: "Everything in Pro plus team features and support.",
}

export default function BillingPage() {
  const [usage, setUsage] = useState<Usage | null>(null)
  const [loadingUsage, setLoadingUsage] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [upgradeLoading, setUpgradeLoading] = useState(false)

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/usage")
      if (res.ok) {
        const data = await res.json()
        setUsage({
          plan: data.plan ?? "free",
          used: data.used ?? 0,
          limit: data.limit ?? 1,
          resetAt: data.resetAt ?? null,
          isUnlimited: data.isUnlimited ?? false,
        })
      }
    } catch {
      setUsage({ plan: "free", used: 0, limit: 1, resetAt: null, isUnlimited: false })
    } finally {
      setLoadingUsage(false)
    }
  }, [])

  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  const handleManageBilling = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Could not open billing portal.")
        return
      }
      if (data.url) window.location.href = data.url
    } catch {
      toast.error("Could not open billing portal.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgrade = async (targetPlan: "pro" | "business") => {
    track("upgrade_click", { plan: targetPlan })
    setUpgradeLoading(true)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetPlan }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Checkout failed.")
        return
      }
      if (data.url) window.location.href = data.url
    } catch {
      toast.error("Checkout failed.")
    } finally {
      setUpgradeLoading(false)
    }
  }

  const plan = usage?.plan ?? "free"
  const showProUpgrade = plan === "free"
  const showBusinessUpgrade = plan === "pro"

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Billing
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription and payment details.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--card-shadow)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Current Plan
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {loadingUsage ? (
                  <span className="inline-block h-4 w-24 animate-pulse rounded bg-secondary" />
                ) : (
                  PLAN_DESCRIPTIONS[plan]
                )}
              </p>
            </div>
            {!loadingUsage && (
              <Badge variant={plan === "free" ? "secondary" : "default"}>
                {PLAN_LABELS[plan]}
              </Badge>
            )}
          </div>

          {showProUpgrade && (
            <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h3 className="text-sm font-medium text-foreground">
                Upgrade to Pro
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Unlimited analyses, priority processing, and PDF/DOCX export.
              </p>
              <Button
                className="mt-4 gap-2"
                size="sm"
                onClick={() => handleUpgrade("pro")}
                disabled={upgradeLoading}
              >
                {upgradeLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                Upgrade to Pro
              </Button>
            </div>
          )}

          {showBusinessUpgrade && (
            <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h3 className="text-sm font-medium text-foreground">
                Upgrade to Business
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Team features, dedicated support, and advanced export options.
              </p>
              <Button
                className="mt-4 gap-2"
                size="sm"
                onClick={() => handleUpgrade("business")}
                disabled={upgradeLoading}
              >
                {upgradeLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                Upgrade to Business
              </Button>
            </div>
          )}

          {(plan === "pro" || plan === "business") && !showBusinessUpgrade && (
            <p className="mt-4 text-xs text-muted-foreground">
              You’re on the {PLAN_LABELS[plan]} plan. Use the button below to manage payment or cancel.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--card-shadow)]">
          <h2 className="text-base font-semibold text-foreground">
            Payment Details
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            View invoices, update payment method, or cancel your subscription.
          </p>
          <Button
            variant="outline"
            className="mt-4 gap-2"
            size="sm"
            onClick={handleManageBilling}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            Manage Billing
          </Button>
        </div>
      </div>
    </div>
  )
}
