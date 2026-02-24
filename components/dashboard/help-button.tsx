"use client"

import Link from "next/link"
import { HelpCircle } from "lucide-react"

export function HelpButton() {
  return (
    <Link
      href="/pricing"
      className="fixed bottom-6 right-6 z-50 flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-primary-foreground shadow-lg transition-opacity hover:opacity-90"
      aria-label="Help & pricing"
    >
      <HelpCircle className="h-5 w-5" />
      <span className="text-sm font-medium">Help</span>
    </Link>
  )
}
