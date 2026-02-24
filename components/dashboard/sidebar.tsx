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
  MessagesSquare,
  Linkedin,
  Settings,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

// 3D-style gradient backgrounds per item (light source top-left feel)
const NAV_ITEM_STYLES = [
  { gradient: "linear-gradient(145deg, #4f7cff 0%, #2d5ae8 50%, #1e3fb0 100%)", shadow: "0 4px 12px rgba(79, 124, 255, 0.4)" },
  { gradient: "linear-gradient(145deg, #7c9fff 0%, #5b7ce8 50%, #3d5bc7 100%)", shadow: "0 4px 12px rgba(124, 159, 255, 0.35)" },
  { gradient: "linear-gradient(145deg, #2d3748 0%, #1a202c 50%, #0d1117 100%)", shadow: "0 4px 12px rgba(0, 0, 0, 0.3)" },
  { gradient: "linear-gradient(145deg, #2dd4bf 0%, #14b8a6 50%, #0d9488 100%)", shadow: "0 4px 12px rgba(45, 212, 191, 0.35)" },
  { gradient: "linear-gradient(145deg, #c084fc 0%, #a855f7 50%, #7c3aed 100%)", shadow: "0 4px 12px rgba(168, 85, 247, 0.35)" },
  { gradient: "linear-gradient(145deg, #94a3b8 0%, #64748b 50%, #475569 100%)", shadow: "0 4px 12px rgba(100, 116, 139, 0.3)" },
  { gradient: "linear-gradient(145deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)", shadow: "0 4px 12px rgba(251, 191, 36, 0.35)" },
  { gradient: "linear-gradient(145deg, #a78bfa 0%, #8b5cf6 50%, #6d28d9 100%)", shadow: "0 4px 12px rgba(139, 92, 246, 0.35)" },
  { gradient: "linear-gradient(145deg, #7dd3fc 0%, #38bdf8 50%, #0ea5e9 100%)", shadow: "0 4px 12px rgba(56, 189, 248, 0.35)" },
] as const

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, styleIndex: 0 },
  { href: "/dashboard/cover-letter", label: "Cover letter", icon: Mail, styleIndex: 1 },
  { href: "/dashboard/interview-prep", label: "Interview prep", icon: MessagesSquare, styleIndex: 2 },
  { href: "/dashboard/linkedin", label: "LinkedIn optimizer", icon: Linkedin, styleIndex: 3 },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard, styleIndex: 4 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, styleIndex: 5 },
]

const SIDEBAR_WIDTH_COLLAPSED = 72
const SIDEBAR_WIDTH_EXPANDED = 220

export function DashboardSidebar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const themeContext = useTheme()
  const theme = themeContext?.theme
  const setTheme = themeContext?.setTheme
  const isDark = theme === "dark"

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <aside
      className={cn(
        "hidden flex-shrink-0 flex-col border-r border-border bg-muted/50 md:flex rounded-r-2xl transition-[width] duration-200 ease-out overflow-hidden",
        expanded ? "w-[var(--sidebar-w)]" : "w-[72px]"
      )}
      style={{ "--sidebar-w": `${SIDEBAR_WIDTH_EXPANDED}px` } as React.CSSProperties}
    >
      <div className={cn("flex h-16 items-center border-b border-border/80", expanded ? "justify-between px-3" : "justify-center")}>
        <Link
          href="/"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white transition-all hover:scale-105 hover:opacity-90"
          style={{
            background: "linear-gradient(145deg, #4f7cff 0%, #2d5ae8 50%, #1e3fb0 100%)",
            boxShadow: "0 4px 14px rgba(79, 124, 255, 0.45)",
          }}
          aria-label="FixMyDoc home"
        >
          <FileText className="h-5 w-5" />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 shrink-0 rounded-xl text-muted-foreground hover:text-foreground", !expanded && "hidden")}
          onClick={() => setExpanded(false)}
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex flex-1 flex-col gap-2 py-4 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          const style = NAV_ITEM_STYLES[item.styleIndex]
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "relative flex items-center gap-3 rounded-2xl transition-all duration-200 overflow-hidden",
                expanded ? "min-h-11 px-3 py-2 w-full" : "h-11 w-11 justify-center mx-auto"
              )}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-primary z-10"
                  style={{ boxShadow: "0 0 8px var(--primary)" }}
                />
              )}
              <span
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-2xl text-white transition-transform hover:scale-105",
                  isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-muted/50" : ""
                )}
                style={{
                  width: 40,
                  height: 40,
                  background: style.gradient,
                  boxShadow: style.shadow,
                }}
              >
                <item.icon className="h-5 w-5" />
              </span>
              {expanded && (
                <span className={cn(
                  "text-sm font-medium truncate",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className={cn("border-t border-border/80 p-3 flex flex-col gap-2", expanded ? "items-center" : "items-center")}>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-10 w-10 shrink-0 rounded-2xl text-muted-foreground hover:text-foreground", expanded && "hidden")}
          onClick={() => setExpanded(true)}
          aria-label="Expand sidebar"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
        {mounted && typeof setTheme === "function" && (
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-10 w-10 rounded-2xl text-muted-foreground", !expanded && "w-10")}
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
