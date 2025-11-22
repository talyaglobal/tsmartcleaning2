"use client"

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { WebflowSection, WebflowButton, WebflowCard, ScrollAnimation } from '@/components/webflow'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle2, Heart, Users, BookOpen, Mail, Phone, Globe, FileText, DollarSign, HandHeart, Loader2, CheckCircle, AlertCircle, Star } from 'lucide-react'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateBreadcrumbSchema, generateServiceSchema } from '@/lib/seo'
import { cn } from '@/lib/utils'

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  inquiryType: string
  message: string
  website?: string // honeypot field
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  inquiryType?: string
  message?: string
}

const MAX_MESSAGE_LENGTH = 2000

export default function SupportImmigrantWomenPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    inquiryType: '',
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

    if (!formData.inquiryType) {
      newErrors.inquiryType = 'Please select an inquiry type'
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
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
    if (submitStatus !== 'idle') {
      setSubmitStatus('idle')
      setSubmitMessage('')
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

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
          serviceType: `Support Immigrant Women - ${formData.inquiryType}`,
          message: formData.message.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit form')
      }

      setSubmitStatus('success')
      setSubmitMessage('Thank you for your interest! We\'ll get back to you soon.')
      
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        inquiryType: '',
        message: '',
        website: '',
      })
    } catch (error: any) {
      setSubmitStatus('error')
      setSubmitMessage(error.message || 'Failed to submit form. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <JsonLd
        data={[
          generateBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Support Immigrant Women', url: '/support-immigrant-women' },
          ]),
          generateServiceSchema({
            name: 'Immigrant Women Support Program',
            description: 'Comprehensive program supporting immigrant women through job placement, training, and community support in the cleaning industry.',
            provider: {
              name: 'tSmartCleaning',
              url: 'https://tsmartcleaning.com',
            },
            areaServed: 'US',
            serviceType: 'Employment and Training Service',
          }),
        ]}
      />
      <div className="min-h-screen">
        <main>
        {/* Hero Section */}
        <WebflowSection variant="default" className="padding_none">
          <div className="text-align_center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Heart className="h-4 w-4" />
              For Immigrant Women Cleaners
            </div>
            <h1 className="heading_h1 mt-2">Work with dignity, grow with support</h1>
            <p className="paragraph_large text-color_secondary mt-4 max-w-2xl mx-auto">
              Direct access to verified, well-paying cleaning jobs with comprehensive professional development, community support, and financial services designed specifically for immigrant women.
            </p>
          </div>
        </WebflowSection>

        {/* Program Details Section */}
        <WebflowSection>
          <div className="max-w-6xl mx-auto">
            <div className="text-align_center mb-12">
              <h2 className="heading_h2">Our Program</h2>
              <p className="paragraph_large text-color_secondary mt-3 max-w-2xl mx-auto">
                A comprehensive initiative designed to support immigrant women in building sustainable careers in the cleaning industry
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <ScrollAnimation delay={0}>
                <WebflowCard>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="heading_h4 mb-2">Direct Job Access</h3>
                  <p className="paragraph_small text-color_secondary">
                    Verified, well-paying jobs without exploitation or middlemen
                  </p>
                </WebflowCard>
              </ScrollAnimation>

              <ScrollAnimation delay={100}>
                <WebflowCard>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="heading_h4 mb-2">Professional Development</h3>
                  <p className="paragraph_small text-color_secondary">
                    In-app training, certification courses, and career advancement opportunities
                  </p>
                </WebflowCard>
              </ScrollAnimation>

              <ScrollAnimation delay={200}>
                <WebflowCard>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="heading_h4 mb-2">Supportive Community</h3>
                  <p className="paragraph_small text-color_secondary">
                    Culturally sensitive environment with multi-lingual support and peer connections
                  </p>
                </WebflowCard>
              </ScrollAnimation>

              <ScrollAnimation delay={300}>
                <WebflowCard>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="heading_h4 mb-2">Financial Services</h3>
                  <p className="paragraph_small text-color_secondary">
                    Future access to micro-loans, remittance services, and financial literacy tools
                  </p>
                </WebflowCard>
              </ScrollAnimation>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <ScrollAnimation delay={0}>
                <WebflowCard>
                  <div className="mb-4">
                    <p className="paragraph_small text-color_secondary">For Cleaning Companies</p>
                    <h2 className="heading_h3 mt-1">Access reliable labor and streamline operations</h2>
                  </div>
                  <ul className="space-y-4">
                    <ValueItem title="Reliable Labor Access" desc="Pre-vetted, motivated immigrant women workers ready to start immediately" />
                    <ValueItem title="All-in-One Operations" desc="Replace 3-5 software tools with one integrated Super App (save $200-500/month)" />
                    <ValueItem title="Reduced Turnover" desc="Cultural matching and support reduce the 75% industry turnover rate" />
                    <ValueItem title="Scalability" desc="Grow your business without worrying about labor supply constraints" />
                  </ul>
                </WebflowCard>
              </ScrollAnimation>
              <ScrollAnimation delay={100}>
                <WebflowCard>
                  <div className="mb-4">
                    <p className="paragraph_small text-color_secondary">For Immigrant Women Cleaners</p>
                    <h2 className="heading_h3 mt-1">Work with dignity, grow with support</h2>
                  </div>
                  <ul className="space-y-4">
                    <ValueItem title="Direct Job Access" desc="Verified, well-paying jobs without exploitation or middlemen" />
                    <ValueItem title="Professional Development" desc="In-app training, certification courses, and career advancement opportunities" />
                    <ValueItem title="Supportive Community" desc="Culturally sensitive environment with multi-lingual support and peer connections" />
                    <ValueItem title="Financial Services" desc="Future access to micro-loans, remittance services, and financial literacy tools" />
                  </ul>
                </WebflowCard>
              </ScrollAnimation>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center button-group">
              <WebflowButton href="/contact">For Companies</WebflowButton>
              <WebflowButton variant="secondary" href="/provider-signup">For Cleaners</WebflowButton>
            </div>
          </div>
        </WebflowSection>

        {/* Success Stories Section */}
        <WebflowSection variant="secondary">
          <div className="max-w-6xl mx-auto">
            <div className="text-align_center mb-12">
              <h2 className="heading_h2">Success Stories</h2>
              <p className="paragraph_large text-color_secondary mt-3 max-w-2xl mx-auto">
                Real stories from immigrant women who have transformed their lives through our program
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <ScrollAnimation delay={0}>
                <WebflowCard>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="paragraph_small text-color_secondary mb-4 italic">
                    "Coming to this country was difficult, but finding work was even harder. Through this program, I found not just a job, but a career. The training helped me improve my skills, and now I earn enough to support my family back home."
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                      MR
                    </div>
                    <div>
                      <div className="paragraph_small font-semibold">Maria Rodriguez</div>
                      <div className="paragraph_small text-color_secondary">Professional Cleaner, 2 years</div>
                    </div>
                  </div>
                </WebflowCard>
              </ScrollAnimation>

              <ScrollAnimation delay={100}>
                <WebflowCard>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="paragraph_small text-color_secondary mb-4 italic">
                    "The community support here is incredible. When I first started, I didn't speak English well. The multi-lingual support and training in my language helped me gain confidence. Now I'm training others!"
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                      AK
                    </div>
                    <div>
                      <div className="paragraph_small font-semibold">Amina Khalil</div>
                      <div className="paragraph_small text-color_secondary">Team Leader, 3 years</div>
                    </div>
                  </div>
                </WebflowCard>
              </ScrollAnimation>

              <ScrollAnimation delay={200}>
                <WebflowCard>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="paragraph_small text-color_secondary mb-4 italic">
                    "I started with one cleaning job and now I have my own small team. The financial literacy courses helped me save money and eventually start my own cleaning business. This program changed my life."
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                      LT
                    </div>
                    <div>
                      <div className="paragraph_small font-semibold">Lan Tran</div>
                      <div className="paragraph_small text-color_secondary">Business Owner, 4 years</div>
                    </div>
                  </div>
                </WebflowCard>
              </ScrollAnimation>
            </div>
          </div>
        </WebflowSection>

        {/* Donation & Volunteer Section */}
        <WebflowSection>
          <div className="max-w-6xl mx-auto">
            <div className="text-align_center mb-12">
              <h2 className="heading_h2">Get Involved</h2>
              <p className="paragraph_large text-color_secondary mt-3 max-w-2xl mx-auto">
                Support our mission to empower immigrant women through donations or by volunteering your time and expertise
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <ScrollAnimation delay={0}>
                <WebflowCard className="p-8 border-2 text-align_center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 mx-auto">
                    <DollarSign className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="heading_h3 mb-4">Donate</h3>
                  <p className="paragraph_small text-color_secondary mb-6">
                    Your financial support helps us provide training programs, language classes, and essential resources to immigrant women.
                  </p>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="paragraph_small">Training program scholarships</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="paragraph_small">Language learning resources</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="paragraph_small">Legal support services</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="paragraph_small">Financial literacy workshops</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <WebflowButton href="/contact?type=donation" className="w-full">Make a Donation</WebflowButton>
                    <p className="paragraph_small text-color_secondary text-align_center">
                      Donations are tax-deductible. All contributions directly support program participants.
                    </p>
                  </div>
                </WebflowCard>
              </ScrollAnimation>

              <ScrollAnimation delay={100}>
                <WebflowCard className="p-8 border-2 text-align_center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 mx-auto">
                    <HandHeart className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="heading_h3 mb-4">Volunteer</h3>
                  <p className="paragraph_small text-color_secondary mb-6">
                    Share your skills, time, or expertise to help immigrant women succeed. Every volunteer makes a difference.
                  </p>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="paragraph_small">Mentorship opportunities</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="paragraph_small">Language tutoring</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="paragraph_small">Career counseling</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="paragraph_small">Workshop facilitation</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <WebflowButton variant="secondary" href="/contact?type=volunteer" className="w-full">Become a Volunteer</WebflowButton>
                    <p className="paragraph_small text-color_secondary text-align_center">
                      Flexible scheduling. Training provided. Make a lasting impact.
                    </p>
                  </div>
                </WebflowCard>
              </ScrollAnimation>
            </div>
          </div>
        </WebflowSection>

        {/* Resources Section */}
        <WebflowSection variant="secondary">
          <div className="max-w-6xl mx-auto">
            <div className="text-align_center mb-12">
              <h2 className="heading_h2">Resources</h2>
              <p className="paragraph_large text-color_secondary mt-3 max-w-2xl mx-auto">
                Helpful resources for immigrant women navigating life and work in a new country
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ScrollAnimation delay={0}>
                <WebflowCard className="hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="heading_h5 mb-2">Legal Support</h3>
                  <p className="paragraph_small text-color_secondary mb-4">
                    Immigration resources, worker rights, and legal assistance information.
                  </p>
                  <Link href="/contact?type=legal-resources" className="text-link paragraph_small">Learn More →</Link>
                </WebflowCard>
              </ScrollAnimation>

              <ScrollAnimation delay={100}>
                <WebflowCard className="hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="heading_h5 mb-2">Education & Training</h3>
                  <p className="paragraph_small text-color_secondary mb-4">
                    Free courses, certifications, and skill development programs.
                  </p>
                  <Link href="/provider-signup" className="text-link paragraph_small">Explore Training →</Link>
                </WebflowCard>
              </ScrollAnimation>

              <ScrollAnimation delay={200}>
                <WebflowCard className="hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="heading_h5 mb-2">Community</h3>
                  <p className="paragraph_small text-color_secondary mb-4">
                    Connect with other immigrant women, share experiences, and build support networks.
                  </p>
                  <Link href="/contact?type=community" className="text-link paragraph_small">Join Community →</Link>
                </WebflowCard>
              </ScrollAnimation>

              <ScrollAnimation delay={300}>
                <WebflowCard className="hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="heading_h5 mb-2">Multi-Language Support</h3>
                  <p className="paragraph_small text-color_secondary mb-4">
                    Resources and support available in multiple languages.
                  </p>
                  <Link href="/contact?type=language-support" className="text-link paragraph_small">Get Help →</Link>
                </WebflowCard>
              </ScrollAnimation>
            </div>
          </div>
        </WebflowSection>

        {/* Contact Form Section */}
        <WebflowSection>
          <div className="max-w-2xl mx-auto">
            <div className="text-align_center mb-12">
              <h2 className="heading_h2">Get In Touch</h2>
              <p className="paragraph_large text-color_secondary mt-3">
                Have questions about our program? Want to get involved? We'd love to hear from you.
              </p>
            </div>

            <WebflowCard className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className={errors.firstName ? 'border-red-500' : ''}
                      placeholder="Maria"
                    />
                    {errors.firstName && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      className={errors.lastName ? 'border-red-500' : ''}
                      placeholder="Rodriguez"
                    />
                    {errors.lastName && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={errors.email ? 'border-red-500' : ''}
                      placeholder="maria@example.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className={errors.phone ? 'border-red-500' : ''}
                      placeholder="(555) 123-4567"
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inquiryType">Inquiry Type *</Label>
                  <Select
                    value={formData.inquiryType}
                    onValueChange={(value) => handleChange('inquiryType', value)}
                  >
                    <SelectTrigger className={errors.inquiryType ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select inquiry type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="donation">Donation</SelectItem>
                      <SelectItem value="volunteer">Volunteer</SelectItem>
                      <SelectItem value="participant">Join as Participant</SelectItem>
                      <SelectItem value="partnership">Partnership Opportunity</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.inquiryType && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.inquiryType}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    className={errors.message ? 'border-red-500' : ''}
                    placeholder="Tell us how we can help..."
                    rows={6}
                    maxLength={MAX_MESSAGE_LENGTH}
                  />
                  <div className="flex justify-between items-center">
                    <div>
                      {errors.message && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.message}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formData.message.length} / {MAX_MESSAGE_LENGTH}
                    </p>
                  </div>
                </div>

                {/* Honeypot field */}
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />

                {submitStatus === 'success' && (
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900">{submitMessage}</p>
                    </div>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">{submitMessage}</p>
                    </div>
                  </div>
                )}

                <WebflowButton
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </WebflowButton>
              </form>
            </WebflowCard>

            <div className="mt-8 text-center">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <a href="mailto:support@tsmartcleaning.com" className="hover:text-foreground transition-colors">
                    support@tsmartcleaning.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <a href="tel:+18005551234" className="hover:text-foreground transition-colors">
                    1-800-555-1234
                  </a>
                </div>
              </div>
            </div>
          </div>
        </WebflowSection>
        </main>
      </div>
    </>
  )
}

function ValueItem({ title, desc }: { title: string; desc: string }) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
      <div>
        <div className="paragraph_small font-medium">{title}</div>
        <div className="paragraph_small text-color_secondary">{desc}</div>
      </div>
    </li>
  )
}