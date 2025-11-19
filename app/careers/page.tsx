import Link from 'next/link'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Heart, TrendingUp, Users, Coffee, Zap } from 'lucide-react'
import { JobListings } from '@/components/careers/JobListings'
import { createServerSupabase } from '@/lib/supabase'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo'

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
      <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4" variant="secondary">
              We're Hiring!
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
              Join Our Mission to Transform Cleaning Services
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 text-pretty">
              Be part of a fast-growing team that's making professional cleaning accessible to everyone across the USA.
            </p>
            <Button size="lg" asChild>
              <Link href="#open-positions">View Open Positions</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Culture */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Life at TSmartCleaning</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our values shape everything we do
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="p-6 text-center">
              <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Customer Obsessed</h3>
              <p className="text-muted-foreground text-sm">
                We put customers and providers first in every decision we make
              </p>
            </Card>
            <Card className="p-6 text-center">
              <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Growth Mindset</h3>
              <p className="text-muted-foreground text-sm">
                We embrace challenges and continuously learn and improve
              </p>
            </Card>
            <Card className="p-6 text-center">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Team Spirit</h3>
              <p className="text-muted-foreground text-sm">
                We collaborate, support each other, and celebrate wins together
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Perks & Benefits</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We take care of our team
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="p-6">
              <Coffee className="h-8 w-8 text-primary mb-3" />
              <h3 className="text-lg font-semibold mb-2">Flexible Work</h3>
              <p className="text-muted-foreground text-sm">
                Remote-first culture with flexible hours
              </p>
            </Card>
            <Card className="p-6">
              <Zap className="h-8 w-8 text-primary mb-3" />
              <h3 className="text-lg font-semibold mb-2">Competitive Salary</h3>
              <p className="text-muted-foreground text-sm">
                Market-leading compensation and equity
              </p>
            </Card>
            <Card className="p-6">
              <Heart className="h-8 w-8 text-primary mb-3" />
              <h3 className="text-lg font-semibold mb-2">Health Insurance</h3>
              <p className="text-muted-foreground text-sm">
                Comprehensive medical, dental, and vision
              </p>
            </Card>
            <Card className="p-6">
              <TrendingUp className="h-8 w-8 text-primary mb-3" />
              <h3 className="text-lg font-semibold mb-2">Learning Budget</h3>
              <p className="text-muted-foreground text-sm">
                Annual budget for courses and conferences
              </p>
            </Card>
            <Card className="p-6">
              <Users className="h-8 w-8 text-primary mb-3" />
              <h3 className="text-lg font-semibold mb-2">Team Events</h3>
              <p className="text-muted-foreground text-sm">
                Regular offsites and team building activities
              </p>
            </Card>
            <Card className="p-6">
              <Sparkles className="h-8 w-8 text-primary mb-3" />
              <h3 className="text-lg font-semibold mb-2">Unlimited PTO</h3>
              <p className="text-muted-foreground text-sm">
                Take time off when you need it
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="open-positions" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Open Positions</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find your next opportunity
            </p>
          </div>
          <div className="max-w-5xl mx-auto">
            <JobListings initialJobs={initialJobs} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Don't See Your Role?</h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            We're always looking for talented people. Send us your resume and let's talk!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/contact">Get in Touch</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link href="/careers/application-tracker">Track Your Application</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 TSmartCleaning. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
