"use client"

import dynamic from "next/dynamic"
import { DashboardMobileHeader } from "@/components/dashboard/sidebar"
import { HelpButton } from "@/components/dashboard/help-button"

const DashboardSidebar = dynamic(
  () => import("@/components/dashboard/sidebar").then((m) => ({ default: m.DashboardSidebar })),
  { ssr: false }
)

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardMobileHeader />
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
        <HelpButton />
      </div>
    </div>
  )
}
