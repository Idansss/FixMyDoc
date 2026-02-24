"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Zap } from "lucide-react"

type Usage = {
  plan: string
  used: number
  limit: number | null
  resetAt: string | null
  isUnlimited: boolean
}

export function UsageCard() {
  const [usage, setUsage] = useState<Usage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/usage")
      .then((res) => res.ok ? res.json() : null)
      .then((d) => d && setUsage(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || !usage) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--card-shadow)] animate-pulse">
        <div className="h-4 w-16 rounded bg-muted" />
        <div className="mt-2 h-8 w-24 rounded bg-muted" />
        <div className="mt-3 h-2 w-full rounded-full bg-muted" />
      </div>
    )
  }

  const usageLimit = usage.limit ?? 1
  const pct = usage.isUnlimited ? 0 : Math.min(100, (usage.used / usageLimit) * 100)

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--card-shadow)] relative">
      {!usage.isUnlimited && (
        <Link href="/dashboard/billing" className="absolute top-4 right-4">
          <Button size="sm" variant="secondary" className="rounded-lg text-xs">
            Upgrade
          </Button>
        </Link>
      )}
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Usage</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums text-foreground">
          {usage.isUnlimited ? "Unlimited" : `${usage.used} / ${usageLimit}`}
        </span>
        {!usage.isUnlimited && (
          <span className="text-sm text-muted-foreground">analyses today</span>
        )}
      </div>
      {!usage.isUnlimited && usageLimit > 0 && (
        <>
          <Progress value={pct} className="mt-3 h-2 rounded-full" />
          {usage.resetAt && (
            <p className="mt-2 text-xs text-muted-foreground">Resets {usage.resetAt}</p>
          )}
        </>
      )}
      {usage.isUnlimited && (
        <p className="mt-1 text-sm text-muted-foreground">{usage.plan} plan</p>
      )}
    </div>
  )
}
