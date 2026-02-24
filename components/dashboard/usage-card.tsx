"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
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

  if (loading || !usage) return null

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {usage.isUnlimited ? "Unlimited analyses" : "Analyses today"}
            </p>
            <p className="text-xs text-muted-foreground">
              {usage.isUnlimited
                ? `${usage.plan} plan`
                : `${usage.used} / ${usage.limit} used${usage.resetAt ? ` · Resets ${usage.resetAt}` : ""}`}
            </p>
          </div>
        </div>
        {!usage.isUnlimited && usage.limit !== null && usage.used >= usage.limit && (
          <Link href="/dashboard/billing">
            <Button size="sm" variant="default" className="shrink-0">
              Upgrade
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
