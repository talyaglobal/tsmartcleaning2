import { describe, it, expect } from 'vitest'

describe('Key Pages Load', () => {
  it('should load /find-cleaners page', async () => {
    const FindCleanersPage = await import('@/app/find-cleaners/page')
    expect(FindCleanersPage.default).toBeDefined()
    expect(typeof FindCleanersPage.default).toBe('function')
  })

  it('should load /insurance page', async () => {
    const InsurancePage = await import('@/app/insurance/page')
    expect(InsurancePage.default).toBeDefined()
    expect(typeof InsurancePage.default).toBe('function')
  })

  it('should load /tsmartcard page', async () => {
    const TSmartCardPage = await import('@/app/tsmartcard/page')
    expect(TSmartCardPage.default).toBeDefined()
    expect(typeof TSmartCardPage.default).toBe('function')
  })

  it('should load /for-providers page', async () => {
    const ForProvidersPage = await import('@/app/for-providers/page')
    expect(ForProvidersPage.default).toBeDefined()
    expect(typeof ForProvidersPage.default).toBe('function')
  })

  it('should load /contact page', async () => {
    const ContactPage = await import('@/app/contact/page')
    expect(ContactPage.default).toBeDefined()
    expect(typeof ContactPage.default).toBe('function')
  })

  it('should load /about page', async () => {
    const AboutPage = await import('@/app/about/page')
    expect(AboutPage.default).toBeDefined()
    expect(typeof AboutPage.default).toBe('function')
  })
})

