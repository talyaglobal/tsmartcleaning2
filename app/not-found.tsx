'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Home, Search, ArrowRight, FileText, User, Briefcase, Shield, HelpCircle, AlertTriangle } from 'lucide-react'

const popularPages = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/find-cleaners', label: 'Find Cleaners', icon: Search },
  { href: '/signup', label: 'Book a Service', icon: User },
  { href: '/provider-signup', label: 'Become a Provider', icon: Briefcase },
  { href: '/about', label: 'About Us', icon: FileText },
  { href: '/contact', label: 'Contact', icon: HelpCircle },
  { href: '/insurance', label: 'Insurance', icon: Shield },
  { href: '/blog', label: 'Blog', icon: FileText },
]

export default function NotFound() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Try to match popular pages first
      const matchedPage = popularPages.find(page =>
        page.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.href.toLowerCase().includes(searchQuery.toLowerCase())
      )
      
      if (matchedPage) {
        router.push(matchedPage.href)
      } else {
        // In a real app, you might redirect to a search results page
        router.push(`/find-cleaners?q=${encodeURIComponent(searchQuery)}`)
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-muted/30 via-background to-muted/20">

      {/* 404 Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="text-center max-w-4xl w-full">
          <div className="mb-10">
            {/* Animated 404 with icon */}
            <div className="relative mb-6">
              <div className="text-8xl md:text-9xl font-bold text-primary/10 mb-4 select-none">
                404
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <AlertTriangle className="h-16 w-16 md:h-20 md:w-20 text-primary/20" />
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Page Not Found
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
              Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you may have typed the wrong URL.
            </p>
          </div>

          {/* Search Bar */}
          <Card className="mb-10 p-6 max-w-xl mx-auto shadow-lg border-2">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search for pages or services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 text-base"
                />
              </div>
              <Button type="submit" size="lg" className="px-6">
                Search
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Try searching for "cleaners", "booking", "signup", or browse popular pages below
            </p>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button size="lg" asChild className="min-w-[160px]">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="min-w-[160px]">
              <Link href="/contact">
                <HelpCircle className="mr-2 h-4 w-4" />
                Contact Support
              </Link>
            </Button>
          </div>

          {/* Popular Pages */}
          <div className="mt-12 pt-8 border-t">
            <p className="text-base font-semibold text-foreground mb-6">Popular Pages</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {popularPages.map((page) => {
                const Icon = page.icon
                return (
                  <Link
                    key={page.href}
                    href={page.href}
                    className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 hover:border-primary hover:bg-primary/5 transition-all duration-200 hover:shadow-md hover:-translate-y-1"
                  >
                    <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                      <Icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-sm font-medium text-center group-hover:text-primary transition-colors">
                      {page.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-10 pt-8 border-t">
            <p className="text-sm font-medium text-foreground mb-5">Quick Links</p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <Link href="/signup" className="text-primary hover:underline hover:text-primary/80 transition-colors font-medium">
                Book a Service
              </Link>
              <span className="text-muted-foreground hidden sm:inline">•</span>
              <Link href="/provider-signup" className="text-primary hover:underline hover:text-primary/80 transition-colors font-medium">
                Become a Provider
              </Link>
              <span className="text-muted-foreground hidden sm:inline">•</span>
              <Link href="/find-cleaners" className="text-primary hover:underline hover:text-primary/80 transition-colors font-medium">
                Find Cleaners
              </Link>
              <span className="text-muted-foreground hidden sm:inline">•</span>
              <Link href="/about" className="text-primary hover:underline hover:text-primary/80 transition-colors font-medium">
                About Us
              </Link>
              <span className="text-muted-foreground hidden sm:inline">•</span>
              <Link href="/contact" className="text-primary hover:underline hover:text-primary/80 transition-colors font-medium">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 TSmartCleaning. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
