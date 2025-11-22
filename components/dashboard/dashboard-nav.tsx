'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, User, Settings, LogOut, LayoutDashboard, Users, DollarSign, FileText, Menu, X, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandLogoClient } from '@/components/BrandLogoClient'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface DashboardNavProps {
  userType: 'customer' | 'provider' | 'admin'
  userName: string
}

export function DashboardNav({ userType, userName }: DashboardNavProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const customerLinks = [
    { href: '/customer', label: 'Dashboard', icon: Home },
    { href: '/customer/book', label: 'Book Service', icon: Calendar },
    { href: '/customer/profile', label: 'Profile', icon: User },
  ]

  const providerLinks = [
    { href: '/provider', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/provider/bookings', label: 'Bookings', icon: Calendar },
    { href: '/provider/earnings', label: 'Earnings', icon: DollarSign },
    { href: '/provider/profile', label: 'Profile', icon: User },
  ]

  const adminLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/companies', label: 'Companies', icon: Users },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/ambassadors', label: 'Ambassador Admin', icon: Users },
    { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
    { href: '/admin/insurance', label: 'Insurance', icon: ShieldCheck },
    { href: '/admin/reports', label: 'Reports', icon: FileText },
  ]

  const links = userType === 'customer' ? customerLinks : userType === 'provider' ? providerLinks : adminLinks
  const initials = userName.split(' ').map(n => n[0]).join('')

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-8">
          <BrandLogoClient />
          <nav className="hidden md:flex items-center gap-6">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href || (link.href !== `/${userType}` && pathname?.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 text-sm transition-colors ${
                    isActive ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}
          </nav>
          <button
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            type="button"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="relative h-10 w-10 rounded-full"
              aria-label={`${userName} menu`}
              aria-haspopup="true"
            >
              <Avatar>
                <AvatarFallback aria-hidden="true">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground capitalize">{userType}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/${userType}/profile`} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/login" className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {mobileMenuOpen && (
        <div 
          id="mobile-menu"
          className="md:hidden border-t bg-background"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <nav className="container mx-auto px-4 py-4 space-y-2">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href || (link.href !== `/${userType}` && pathname?.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}
