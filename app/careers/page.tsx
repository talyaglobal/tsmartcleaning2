import Link from 'next/link'
import type { Metadata } from 'next'
import { WebflowSection, WebflowButton, WebflowCard, ScrollAnimation } from '@/components/webflow'
import { Sparkles, Heart, TrendingUp, Users, Coffee, Zap } from 'lucide-react'
import { JobListings } from '@/components/careers/JobListings'
import { createServerSupabase } from '@/lib/supabase'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo'
import { cn } from '@/lib/utils'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Careers - Join Our Mission to Transform Cleaning Services',
  description: 'Be part of a fast-growing team that\'s making professional cleaning accessible to everyone across the USA. View open positions and join tSmartCleaning.',
  path: '/careers',
  keywords: ['careers', 'jobs', 'hiring', 'cleaning industry jobs', 'join tSmartCleaning', 'work with us'],
})

async function getJobs() {
  try {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('job_listings')
      .select('*')
      .eq('is_active', true)
      .order('posted_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching jobs:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return []
  }
}

export default async function CareersPage() {
  const initialJobs = await getJobs()

  return (
    <div className="min-h-screen">
      <JsonLd
        data={generateBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Careers', url: '/careers' },
        ])}
      />

      {/* Hero Section */}
      <WebflowSection variant="default" className="padding_none">
        <div className="text-align_center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            We're Hiring!
          </div>
          <h1 className="heading_h1 mb-6">
            Join Our Mission to Transform Cleaning Services
          </h1>
          <p className="paragraph_large text-color_secondary mb-8">
            Be part of a fast-growing team that's making professional cleaning accessible to everyone across the USA.
          </p>
          <WebflowButton href="#open-positions">View Open Positions</WebflowButton>
        </div>
      </WebflowSection>

      {/* Culture */}
      <WebflowSection>
        <div className="text-align_center mb-12">
          <h2 className="heading_h2 mb-4">Life at TSmartCleaning</h2>
          <p className="paragraph_large text-color_secondary max-w-2xl mx-auto">
            Our values shape everything we do
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <ScrollAnimation delay={0}>
            <WebflowCard className="text-align_center">
              <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="heading_h4 mb-2">Customer Obsessed</h3>
              <p className="paragraph_small text-color_secondary">
                We put customers and providers first in every decision we make
              </p>
            </WebflowCard>
          </ScrollAnimation>
          <ScrollAnimation delay={100}>
            <WebflowCard className="text-align_center">
              <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="heading_h4 mb-2">Growth Mindset</h3>
              <p className="paragraph_small text-color_secondary">
                We embrace challenges and continuously learn and improve
              </p>
            </WebflowCard>
          </ScrollAnimation>
          <ScrollAnimation delay={200}>
            <WebflowCard className="text-align_center">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="heading_h4 mb-2">Team Spirit</h3>
              <p className="paragraph_small text-color_secondary">
                We collaborate, support each other, and celebrate wins together
              </p>
            </WebflowCard>
          </ScrollAnimation>
        </div>
      </WebflowSection>

      {/* Benefits */}
      <WebflowSection variant="secondary">
        <div className="text-align_center mb-12">
          <h2 className="heading_h2 mb-4">Perks & Benefits</h2>
          <p className="paragraph_large text-color_secondary max-w-2xl mx-auto">
            We take care of our team
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <ScrollAnimation delay={0}>
            <WebflowCard>
              <Coffee className="h-8 w-8 text-primary mb-3" />
              <h3 className="heading_h5 mb-2">Flexible Work</h3>
              <p className="paragraph_small text-color_secondary">
                Remote-first culture with flexible hours
              </p>
            </WebflowCard>
          </ScrollAnimation>
          <ScrollAnimation delay={100}>
            <WebflowCard>
              <Zap className="h-8 w-8 text-primary mb-3" />
              <h3 className="heading_h5 mb-2">Competitive Salary</h3>
              <p className="paragraph_small text-color_secondary">
                Market-leading compensation and equity
              </p>
            </WebflowCard>
          </ScrollAnimation>
          <ScrollAnimation delay={200}>
            <WebflowCard>
              <Heart className="h-8 w-8 text-primary mb-3" />
              <h3 className="heading_h5 mb-2">Health Insurance</h3>
              <p className="paragraph_small text-color_secondary">
                Comprehensive medical, dental, and vision
              </p>
            </WebflowCard>
          </ScrollAnimation>
          <ScrollAnimation delay={0}>
            <WebflowCard>
              <TrendingUp className="h-8 w-8 text-primary mb-3" />
              <h3 className="heading_h5 mb-2">Learning Budget</h3>
              <p className="paragraph_small text-color_secondary">
                Annual budget for courses and conferences
              </p>
            </WebflowCard>
          </ScrollAnimation>
          <ScrollAnimation delay={100}>
            <WebflowCard>
              <Users className="h-8 w-8 text-primary mb-3" />
              <h3 className="heading_h5 mb-2">Team Events</h3>
              <p className="paragraph_small text-color_secondary">
                Regular offsites and team building activities
              </p>
            </WebflowCard>
          </ScrollAnimation>
          <ScrollAnimation delay={200}>
            <WebflowCard>
              <Sparkles className="h-8 w-8 text-primary mb-3" />
              <h3 className="heading_h5 mb-2">Unlimited PTO</h3>
              <p className="paragraph_small text-color_secondary">
                Take time off when you need it
              </p>
            </WebflowCard>
          </ScrollAnimation>
        </div>
      </WebflowSection>

      {/* Open Positions */}
      <WebflowSection id="open-positions">
        <div className="text-align_center mb-12">
          <h2 className="heading_h2 mb-4">Open Positions</h2>
          <p className="paragraph_large text-color_secondary max-w-2xl mx-auto">
            Find your next opportunity
          </p>
        </div>
        <div className="max-w-5xl mx-auto">
          <JobListings initialJobs={initialJobs} />
        </div>
      </WebflowSection>

      {/* CTA */}
      <WebflowSection variant="inverse">
        <div className="text-align_center">
          <h2 className="heading_h2 mb-4 on-inverse">Don't See Your Role?</h2>
          <p className="paragraph_large mb-8 text-color_inverse-secondary max-w-2xl mx-auto">
            We're always looking for talented people. Send us your resume and let's talk!
          </p>
          <div className="button-group">
            <WebflowButton variant="secondary" href="/contact">Get in Touch</WebflowButton>
            <WebflowButton variant="secondary" href="/careers/application-tracker">Track Your Application</WebflowButton>
          </div>
        </div>
      </WebflowSection>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container text-align_center paragraph_small text-color_secondary">
          <p>&copy; 2025 TSmartCleaning. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
