"use client"

import { useUser } from "@clerk/nextjs"
import { User, Mail } from "lucide-react"

export default function SettingsPage() {
  const { user } = useUser()

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      <div className="max-w-xl space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-1">
            <User className="h-4 w-4" />
            Profile
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Your account information from FixMyDoc.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-4">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground">
                  {user?.primaryEmailAddress?.emailAddress ?? "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-4">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Name</p>
                <p className="text-sm font-medium text-foreground">
                  {user?.fullName ?? user?.firstName ?? "—"}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              To change your email or name, use your account settings in the menu above.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-1">Notifications</h2>
          <p className="text-sm text-muted-foreground">
            We send an email when your document analysis is complete. Manage your preferences in your account menu.
          </p>
        </div>
      </div>
    </div>
  )
}
