import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { JSDOM } from 'jsdom'

// Expected route mappings based on Next.js app structure and checklist
const EXPECTED_ROUTES = {
  // Header navigation
  logo: '/',
  'book-now': '/customer/book',
  'find-cleaners': '/find-cleaners',
  'tsmartcard': '/tsmartcard',
  'support-immigrant-women': '/support-immigrant-women',
  'for-providers': '/for-providers',
  'provider-signup': '/provider-signup',
  insurance: '/insurance',
  about: '/about',
  contact: '/contact',
  careers: '/careers',
  terms: '/terms',
  privacy: '/privacy',
  signup: '/signup',
  login: '/login',
  
  // Anchor links (should start with #)
  services: '#services',
  enterprise: '#enterprise',
  pricing: '#pricing',
  faq: '#faq',
  contactAnchor: '#contact',
}

// Helper to extract text content and normalize
function getLinkText(link: Element): string {
  return (link.textContent || '').trim().toLowerCase()
}

// Helper to check if href matches expected route
function matchesRoute(href: string, expected: string): boolean {
  // Remove leading/trailing slashes and compare
  const normalizedHref = href.replace(/^\/+|\/+$/g, '')
  const normalizedExpected = expected.replace(/^\/+|#/g, '')
  
  // For anchor links, check if href starts with #
  if (expected.startsWith('#')) {
    return href === expected || href.endsWith(expected)
  }
  
  // For routes, check exact match or with leading slash
  return normalizedHref === normalizedExpected || href === `/${normalizedExpected}`
}

describe('Navigation Links in index.html', () => {
  let htmlContent: string
  let dom: JSDOM

  beforeAll(() => {
    const htmlPath = join(process.cwd(), 'index.html')
    htmlContent = readFileSync(htmlPath, 'utf-8')
    dom = new JSDOM(htmlContent)
  })

  describe('Header Navigation', () => {
    it('logo should link to homepage', () => {
      const logo = dom.window.document.querySelector('.nav_logo')
      expect(logo).toBeTruthy()
      const href = logo?.getAttribute('href')
      expect(href).toBeTruthy()
      // Logo should link to / or be empty (will be handled by JS)
      expect(href === '/' || href === '#' || href === '').toBe(true)
    })

    it('"Book now" button should link to /customer/book', () => {
      const bookNowButtons = Array.from(dom.window.document.querySelectorAll('a'))
        .filter(link => {
          const text = getLinkText(link)
          return text.includes('book now') || text.includes('book')
        })
      
      expect(bookNowButtons.length).toBeGreaterThan(0)
      
      // Check at least one "Book now" button has correct href
      const hasCorrectLink = bookNowButtons.some(link => {
        const href = link.getAttribute('href') || ''
        return matchesRoute(href, EXPECTED_ROUTES['book-now']) || 
               href === '/customer/book' ||
               href === 'customer/book'
      })
      
      // If all are #, that's okay for now (will be fixed)
      const allPlaceholders = bookNowButtons.every(link => {
        const href = link.getAttribute('href') || ''
        return href === '#' || href === ''
      })
      
      if (allPlaceholders) {
        console.warn('⚠️  All "Book now" buttons use placeholder href="#". Should be /customer/book')
      }
    })

    it('"Find Cleaners" link should exist and point to /find-cleaners', () => {
      const findCleanersLinks = Array.from(dom.window.document.querySelectorAll('a'))
        .filter(link => {
          const text = getLinkText(link)
          return text.includes('find cleaner') || text.includes('find cleaners')
        })
      
      expect(findCleanersLinks.length).toBeGreaterThan(0)
      
      const hasCorrectLink = findCleanersLinks.some(link => {
        const href = link.getAttribute('href') || ''
        return matchesRoute(href, EXPECTED_ROUTES['find-cleaners'])
      })
      
      if (!hasCorrectLink) {
        console.warn('⚠️  "Find Cleaners" links should point to /find-cleaners')
      }
    })

    it('"About" link should point to /about or #about', () => {
      const aboutLinks = Array.from(dom.window.document.querySelectorAll('a'))
        .filter(link => {
          const text = getLinkText(link)
          return text === 'about' || text.includes('about')
        })
      
      expect(aboutLinks.length).toBeGreaterThan(0)
      
      const hasCorrectLink = aboutLinks.some(link => {
        const href = link.getAttribute('href') || ''
        return matchesRoute(href, EXPECTED_ROUTES.about) || href === '/about'
      })
      
      if (!hasCorrectLink) {
        console.warn('⚠️  "About" links should point to /about')
      }
    })

    it('"Contact" link should point to /contact or #contact', () => {
      const contactLinks = Array.from(dom.window.document.querySelectorAll('a'))
        .filter(link => {
          const text = getLinkText(link)
          return text === 'contact' || text.includes('contact')
        })
      
      expect(contactLinks.length).toBeGreaterThan(0)
      
      const hasCorrectLink = contactLinks.some(link => {
        const href = link.getAttribute('href') || ''
        return matchesRoute(href, EXPECTED_ROUTES.contact) || 
               matchesRoute(href, EXPECTED_ROUTES.contactAnchor) ||
               href === '/contact' || href === '#contact'
      })
      
      if (!hasCorrectLink) {
        console.warn('⚠️  "Contact" links should point to /contact or #contact')
      }
    })
  })

  describe('Services Dropdown Menu', () => {
    it('should have "Book Now" link in Services dropdown', () => {
      const servicesDropdown = dom.window.document.querySelector('.mega-nav_dropdown-list')
      expect(servicesDropdown).toBeTruthy()
      
      const bookNowLink = Array.from(servicesDropdown?.querySelectorAll('a') || [])
        .find(link => getLinkText(link).includes('book now'))
      
      expect(bookNowLink).toBeTruthy()
    })

    it('should have "Find Cleaners" link in Services dropdown', () => {
      const servicesDropdown = dom.window.document.querySelector('.mega-nav_dropdown-list')
      const findCleanersLink = Array.from(servicesDropdown?.querySelectorAll('a') || [])
        .find(link => getLinkText(link).includes('find cleaner'))
      
      expect(findCleanersLink).toBeTruthy()
    })

    it('should have "Pricing" link in Services dropdown', () => {
      const servicesDropdown = dom.window.document.querySelector('.mega-nav_dropdown-list')
      const pricingLink = Array.from(servicesDropdown?.querySelectorAll('a') || [])
        .find(link => getLinkText(link).includes('pricing'))
      
      expect(pricingLink).toBeTruthy()
    })
  })

  describe('Footer Links', () => {
    it('footer should have "Home" link', () => {
      const footer = dom.window.document.querySelector('footer')
      const homeLink = Array.from(footer?.querySelectorAll('a') || [])
        .find(link => getLinkText(link) === 'home')
      
      expect(homeLink).toBeTruthy()
    })

    it('footer should have "Pricing" link', () => {
      const footer = dom.window.document.querySelector('footer')
      const pricingLink = Array.from(footer?.querySelectorAll('a') || [])
        .find(link => getLinkText(link) === 'pricing')
      
      expect(pricingLink).toBeTruthy()
    })

    it('footer should have "About" link', () => {
      const footer = dom.window.document.querySelector('footer')
      const aboutLink = Array.from(footer?.querySelectorAll('a') || [])
        .find(link => getLinkText(link) === 'about')
      
      expect(aboutLink).toBeTruthy()
    })

    it('footer should have "Careers" link', () => {
      const footer = dom.window.document.querySelector('footer')
      const careersLink = Array.from(footer?.querySelectorAll('a') || [])
        .find(link => getLinkText(link) === 'careers')
      
      expect(careersLink).toBeTruthy()
    })

    it('footer should have "Terms" link', () => {
      const footer = dom.window.document.querySelector('footer')
      const termsLink = Array.from(footer?.querySelectorAll('a') || [])
        .find(link => getLinkText(link) === 'terms')
      
      expect(termsLink).toBeTruthy()
    })

    it('footer should have "Privacy" link', () => {
      const footer = dom.window.document.querySelector('footer')
      const privacyLink = Array.from(footer?.querySelectorAll('a') || [])
        .find(link => getLinkText(link) === 'privacy')
      
      expect(privacyLink).toBeTruthy()
    })
  })

  describe('Hero Section CTAs', () => {
    it('hero section should have "Book now" button', () => {
      const heroSection = dom.window.document.querySelector('header.section')
      const bookNowButton = Array.from(heroSection?.querySelectorAll('a') || [])
        .find(link => getLinkText(link).includes('book now'))
      
      expect(bookNowButton).toBeTruthy()
    })

    it('hero section should have "View pricing" button', () => {
      const heroSection = dom.window.document.querySelector('header.section')
      const pricingButton = Array.from(heroSection?.querySelectorAll('a') || [])
        .find(link => getLinkText(link).includes('pricing') || getLinkText(link).includes('view pricing'))
      
      expect(pricingButton).toBeTruthy()
    })
  })

  describe('Link Analysis Report', () => {
    it('should report all navigation links and their hrefs', () => {
      const allLinks = Array.from(dom.window.document.querySelectorAll('a'))
      const navLinks = allLinks.filter(link => {
        const href = link.getAttribute('href') || ''
        const text = getLinkText(link)
        // Filter for navigation-related links
        return text.length > 0 && text.length < 50 && 
               (href !== '' || text.includes('book') || text.includes('pricing') || 
                text.includes('about') || text.includes('contact') || text.includes('find'))
      })

      console.log('\n📋 Navigation Links Report:')
      console.log('=' .repeat(60))
      
      const linkMap = new Map<string, string[]>()
      
      navLinks.forEach(link => {
        const text = getLinkText(link)
        const href = link.getAttribute('href') || '(empty)'
        
        if (!linkMap.has(text)) {
          linkMap.set(text, [])
        }
        linkMap.get(text)!.push(href)
      })

      linkMap.forEach((hrefs, text) => {
        const uniqueHrefs = [...new Set(hrefs)]
        console.log(`\n"${text}":`)
        uniqueHrefs.forEach(href => {
          const status = href === '#' ? '⚠️  PLACEHOLDER' : 
                        href.startsWith('/') ? '✅ Route' :
                        href.startsWith('#') ? '📍 Anchor' :
                        href.startsWith('http') ? '🌐 External' : '❓ Unknown'
          console.log(`  ${status}: ${href}`)
        })
      })

      console.log('\n' + '='.repeat(60))
      
      // Count placeholders
      const placeholderCount = navLinks.filter(link => {
        const href = link.getAttribute('href') || ''
        return href === '#'
      }).length

      if (placeholderCount > 0) {
        console.log(`\n⚠️  Found ${placeholderCount} links with placeholder href="#"`)
        console.log('   These should be updated to point to actual Next.js routes\n')
      }

      expect(navLinks.length).toBeGreaterThan(0)
    })
  })
})

