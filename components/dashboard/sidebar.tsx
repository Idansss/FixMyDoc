"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { UserButton } from "@clerk/nextjs"
import {
  LayoutDashboard,
  CreditCard,
  FileText,
  Mail,
  Settings,
  Moon,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/cover-letter", label: "Cover letter", icon: Mail },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const themeContext = useTheme()
  const theme = themeContext?.theme
  const setTheme = themeContext?.setTheme
  const isDark = theme === "dark"

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <aside className="hidden w-[72px] flex-shrink-0 flex-col border-r border-border bg-muted/50 md:flex rounded-r-2xl">
      <div className="flex h-16 items-center justify-center border-b border-border/80">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90"
          aria-label="FixMyDoc home"
        >
          <FileText className="h-5 w-5" />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col items-center gap-2 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
              )}
              <item.icon className="h-5 w-5 shrink-0" />
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border/80 p-3 flex flex-col items-center gap-2">
        {mounted && typeof setTheme === "function" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl text-muted-foreground"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        )}
        <UserButton />
      </div>
    </aside>
  )
}

export function DashboardMobileHeader() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden rounded-b-xl shadow-[var(--card-shadow)]">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <FileText className="h-4 w-4" />
        </div>
        <span className="text-base font-semibold text-foreground">FixMyDoc</span>
      </Link>
      <div className="flex items-center gap-2">
        <Link href="/dashboard/billing">
          <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs text-muted-foreground">
            Billing
          </Button>
        </Link>
        <UserButton />
      </div>
    </header>
  )
}
