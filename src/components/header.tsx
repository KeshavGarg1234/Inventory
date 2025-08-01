
"use client"

import { Archive, FileText, Users, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"
import { usePathname } from 'next/navigation'
import { cn } from "@/lib/utils"

export function Header() {
  const pathname = usePathname()

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/", label: "Inventory", icon: Archive },
    { href: "/bills", label: "Bills", icon: FileText },
    { href: "/users", label: "Users", icon: Users },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
             <Archive className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block font-headline text-lg">
              inventra
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
             {navLinks.map(link => (
                <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                    "transition-colors hover:text-foreground/80",
                    pathname === link.href ? "text-foreground" : "text-foreground/60"
                    )}
                >
                    {link.label}
                </Link>
                ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
            <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
