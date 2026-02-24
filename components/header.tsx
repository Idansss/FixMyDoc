"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs"
import { FileText } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <FileText className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            FixMyDoc
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/pricing">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Pricing
            </Button>
          </Link>
          <SignedOut>
            <SignInButton>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Sign in
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button size="sm">Get started</Button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Dashboard
              </Button>
            </Link>
            <UserButton />
          </SignedIn>
        </nav>
      </div>
    </header>
  )
}
