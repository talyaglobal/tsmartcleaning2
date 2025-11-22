'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Mail, Phone, MapPin, Clock, Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { WebflowSection, WebflowButton, WebflowCard } from '@/components/webflow'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateBreadcrumbSchema, generateLocalBusinessSchema, generateFAQSchema } from '@/lib/seo'

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  serviceType: string
  message: string
  website?: string // honeypot field
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  serviceType?: string
  message?: string
}

const MAX_MESSAGE_LENGTH = 2000

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    serviceType: '',
    message: '',
    website: '', // honeypot
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (!formData.serviceType) {
      newErrors.serviceType = 'Please select a service type'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    } else if (formData.message.length > MAX_MESSAGE_LENGTH) {
      newErrors.message = `Message must be no more than ${MAX_MESSAGE_LENGTH} characters`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
    // Clear submit status when user makes changes
    if (submitStatus !== 'idle') {
      setSubmitStatus('idle')
      setSubmitMessage('')
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Honeypot check - if website field is filled, it's likely a bot
    if (formData.website) {
      console.warn('Honeypot field filled - potential spam submission')
      setSubmitStatus('error')
      setSubmitMessage('Invalid submission detected. Please try again.')
      return
    }

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')
    setSubmitMessage('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          serviceType: formData.serviceType,
          message: formData.message.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit form')
      }

      // Success
      setSubmitStatus('success')
      setSubmitMessage('Thank you for contacting us! We\'ll get back to you soon.')
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        serviceType: '',
        message: '',
        website: '',
      })
      setErrors({})

      // Scroll to top of form to show success message
      const formCard = document.getElementById('contact-form')
      formCard?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (error) {
      console.error('Form submission error:', error)
      setSubmitStatus('error')
      setSubmitMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again later.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const messageLength = formData.message.length
  const messageRemaining = MAX_MESSAGE_LENGTH - messageLength

  return (
    <div className="min-h-screen">
      <JsonLd
        data={[
          generateBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Contact', url: '/contact' },
          ]),
          generateLocalBusinessSchema({
            name: 'tSmartCleaning',
            description: 'Professional cleaning services made simple',
            url: 'https://tsmartcleaning.com',
            telephone: '+1-561-975-0455',
            address: {
              addressLocality: 'Boston',
              addressRegion: 'MA',
              postalCode: '02101',
              addressCountry: 'US',
            },
            openingHours: [
              'Mo-Fr 08:00-20:00',
              'Sa 09:00-17:00',
            ],
          }),
          generateFAQSchema([
            {
              question: 'How quickly can I book a cleaning service?',
              answer: 'You can book a service in minutes! Many of our providers offer same-day or next-day availability.',
            },
            {
              question: 'Are your cleaning professionals insured?',
              answer: 'Yes, all our cleaning professionals are fully insured and background-checked for your safety and peace of mind.',
            },
            {
              question: 'What if I\'m not satisfied with the service?',
              answer: 'We offer a 100% satisfaction guarantee. If you\'re not happy with the service, contact us within 24 hours and we\'ll make it right.',
            },
            {
              question: 'Do I need to provide cleaning supplies?',
              answer: 'No, our professionals bring their own supplies and equipment. However, if you have specific products you\'d like us to use, just let us know!',
            },
          ]),
        ]}
      />

      {/* Hero Section */}
      <WebflowSection variant="default" className="padding_none">
        <div className="text-align_center max-w-3xl mx-auto">
          <h1 className="heading_h1 mb-6">
            Get in Touch
          </h1>
          <p className="paragraph_large text-color_secondary">
            Have questions about our services? We're here to help you find the perfect cleaning solution.
          </p>
        </div>
      </WebflowSection>

      {/* Contact Section */}
      <WebflowSection>
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div>
            <WebflowCard id="contact-form">
              <h2 className="heading_h2 mb-6">Send us a message</h2>
                
                {/* Success/Error Messages */}
                {submitStatus === 'success' && (
                  <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="paragraph_small text-green-800 dark:text-green-200">{submitMessage}</p>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="paragraph_small text-red-800 dark:text-red-200">{submitMessage}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Honeypot field - hidden from users */}
                  <div className="hidden" aria-hidden="true">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={formData.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                    />
                  </div>

                  <fieldset className="grid md:grid-cols-2 gap-4">
                    <legend className="sr-only">Personal Information</legend>
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name <span aria-label="required field" className="text-destructive">*</span></Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                        aria-invalid={errors.firstName ? 'true' : 'false'}
                        aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                        aria-required="true"
                        disabled={isSubmitting}
                        autoComplete="given-name"
                      />
                      {errors.firstName && (
                        <p id="firstName-error" className="paragraph_small text-destructive flex items-center gap-1" role="alert">
                          <span aria-hidden="true">⚠</span>
                          {errors.firstName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name <span aria-label="required field" className="text-destructive">*</span></Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => handleChange('lastName', e.target.value)}
                        aria-invalid={errors.lastName ? 'true' : 'false'}
                        aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                        aria-required="true"
                        disabled={isSubmitting}
                        autoComplete="family-name"
                      />
                      {errors.lastName && (
                        <p id="lastName-error" className="paragraph_small text-destructive flex items-center gap-1" role="alert">
                          <span aria-hidden="true">⚠</span>
                          {errors.lastName}
                        </p>
                      )}
                    </div>
                  </fieldset>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      aria-invalid={errors.email ? 'true' : 'false'}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                      disabled={isSubmitting}
                    />
                    {errors.email && (
                      <p id="email-error" className="paragraph_small text-destructive" role="alert">
                        {errors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      aria-invalid={errors.phone ? 'true' : 'false'}
                      aria-describedby={errors.phone ? 'phone-error' : undefined}
                      disabled={isSubmitting}
                    />
                    {errors.phone && (
                      <p id="phone-error" className="paragraph_small text-destructive" role="alert">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceType">Service Type *</Label>
                    <select
                      id="serviceType"
                      value={formData.serviceType}
                      onChange={(e) => handleChange('serviceType', e.target.value)}
                      className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        errors.serviceType
                          ? 'border-destructive ring-destructive/20 dark:ring-destructive/40'
                          : 'border-input'
                      }`}
                      aria-invalid={errors.serviceType ? 'true' : 'false'}
                      aria-describedby={errors.serviceType ? 'serviceType-error' : undefined}
                      disabled={isSubmitting}
                    >
                      <option value="">Select a service</option>
                      <option value="residential">Residential Cleaning</option>
                      <option value="commercial">Commercial Cleaning</option>
                      <option value="specialized">Specialized Services</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.serviceType && (
                      <p id="serviceType-error" className="paragraph_small text-destructive" role="alert">
                        {errors.serviceType}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="message">Message *</Label>
                      <span
                        className={`text-xs ${
                          messageRemaining < 50
                            ? 'text-destructive'
                            : messageRemaining < 100
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {messageLength} / {MAX_MESSAGE_LENGTH}
                      </span>
                    </div>
                    <Textarea
                      id="message"
                      placeholder="Tell us about your cleaning needs..."
                      rows={5}
                      value={formData.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      aria-invalid={errors.message ? 'true' : 'false'}
                      aria-describedby={errors.message ? 'message-error' : undefined}
                      disabled={isSubmitting}
                      maxLength={MAX_MESSAGE_LENGTH}
                    />
                    {errors.message && (
                      <p id="message-error" className="paragraph_small text-destructive" role="alert">
                        {errors.message}
                      </p>
                    )}
                  </div>
                  <WebflowButton type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Message'
                    )}
                  </WebflowButton>
                </form>
            </WebflowCard>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="heading_h2 mb-6">Contact Information</h2>
              <div className="space-y-6">
                <WebflowCard>
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="heading_h5 mb-1">Email</h3>
                      <p className="paragraph_small text-color_secondary">support@tsmartcleaning.com</p>
                      <p className="paragraph_small text-color_secondary">sales@tsmartcleaning.com</p>
                    </div>
                  </div>
                </WebflowCard>

                <WebflowCard>
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="heading_h5 mb-1">Phone</h3>
                      <p className="paragraph_small text-color_secondary">+1 (800) 555-0123</p>
                      <p className="paragraph_small text-color_secondary">Mon-Fri 8am - 8pm EST</p>
                    </div>
                  </div>
                </WebflowCard>

                <WebflowCard>
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="heading_h5 mb-1">Office</h3>
                      <p className="paragraph_small text-color_secondary">123 Business Ave, Suite 100</p>
                      <p className="paragraph_small text-color_secondary">Boston, MA 02101</p>
                    </div>
                  </div>
                </WebflowCard>

                <WebflowCard>
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="heading_h5 mb-1">Business Hours</h3>
                      <p className="paragraph_small text-color_secondary">Monday - Friday: 8am - 8pm</p>
                      <p className="paragraph_small text-color_secondary">Saturday: 9am - 5pm</p>
                      <p className="paragraph_small text-color_secondary">Sunday: Closed</p>
                    </div>
                  </div>
                </WebflowCard>
              </div>
            </div>

            <WebflowCard variant="inverse" className="bg-primary text-primary-foreground">
              <h3 className="heading_h3 mb-2">Enterprise Solutions</h3>
              <p className="paragraph_small mb-4 opacity-90">
                Looking for large-scale commercial cleaning services? Our dedicated team can create a custom solution for your business.
              </p>
              <WebflowButton variant="secondary" href="/signup">Request a Quote</WebflowButton>
            </WebflowCard>
          </div>
        </div>
      </WebflowSection>

      {/* FAQ Section */}
      <WebflowSection variant="secondary">
        <div className="max-w-3xl mx-auto">
          <h2 className="heading_h2 mb-8 text-align_center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <WebflowCard>
              <h3 className="heading_h5 mb-2">How quickly can I book a cleaning service?</h3>
              <p className="paragraph_small text-color_secondary">
                You can book a service in minutes! Many of our providers offer same-day or next-day availability.
              </p>
            </WebflowCard>
            <WebflowCard>
              <h3 className="heading_h5 mb-2">Are your cleaning professionals insured?</h3>
              <p className="paragraph_small text-color_secondary">
                Yes, all our cleaning professionals are fully insured and background-checked for your safety and peace of mind.
              </p>
            </WebflowCard>
            <WebflowCard>
              <h3 className="heading_h5 mb-2">What if I'm not satisfied with the service?</h3>
              <p className="paragraph_small text-color_secondary">
                We offer a 100% satisfaction guarantee. If you're not happy with the service, contact us within 24 hours and we'll make it right.
              </p>
            </WebflowCard>
            <WebflowCard>
              <h3 className="heading_h5 mb-2">Do I need to provide cleaning supplies?</h3>
              <p className="paragraph_small text-color_secondary">
                No, our professionals bring their own supplies and equipment. However, if you have specific products you'd like us to use, just let us know!
              </p>
            </WebflowCard>
          </div>
        </div>
      </WebflowSection>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
                <span className="heading_h5">TSmartCleaning</span>
              </div>
              <p className="paragraph_small text-color_secondary">
                Professional cleaning services made simple.
              </p>
            </div>
            <div>
              <h4 className="heading_h6 mb-4">Services</h4>
              <ul className="space-y-2">
                <li><Link href="/#services" className="text-link paragraph_small">Residential Cleaning</Link></li>
                <li><Link href="/#services" className="text-link paragraph_small">Commercial Cleaning</Link></li>
                <li><Link href="/#services" className="text-link paragraph_small">Specialized Services</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="heading_h6 mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-link paragraph_small">Contact Us</Link></li>
                <li><Link href="/provider-signup" className="text-link paragraph_small">Become a Provider</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="heading_h6 mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-link paragraph_small">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-link paragraph_small">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-align_center paragraph_small text-color_secondary">
            <p>&copy; 2025 TSmartCleaning. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
