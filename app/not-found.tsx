import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <BrandLogo />
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* 404 Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-2xl">
          <div className="text-8xl md:text-9xl font-bold text-primary/10 mb-4">404</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Page Not Found</h1>
          <p className="text-lg text-muted-foreground mb-8 text-pretty">
            Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">
                <Search className="mr-2 h-4 w-4" />
                Contact Support
              </Link>
            </Button>
          </div>

          {/* Quick Links */}
          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-4">Looking for something specific?</p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <Link href="/signup" className="text-primary hover:underline">
                Book a Service
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/provider-signup" className="text-primary hover:underline">
                Become a Provider
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/about" className="text-primary hover:underline">
                About Us
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/contact" className="text-primary hover:underline">
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
