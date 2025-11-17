import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Heart, TrendingUp, Users, Coffee, Zap } from 'lucide-react'

export default function CareersPage() {
  return (
    <div className="min-h-screen">

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
          <div className="max-w-3xl mx-auto space-y-4">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Senior Full-Stack Engineer</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Engineering • Remote • Full-time
                  </p>
                  <p className="text-sm mb-4">
                    Build and scale our platform using Next.js, React, and Node.js. Work on features that impact thousands of users daily.
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/contact">Apply</Link>
                </Button>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Product Designer</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Design • Remote • Full-time
                  </p>
                  <p className="text-sm mb-4">
                    Design intuitive user experiences for our customer and provider platforms. Shape the visual identity of TSmartCleaning.
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/contact">Apply</Link>
                </Button>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Customer Success Manager</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Customer Success • Remote • Full-time
                  </p>
                  <p className="text-sm mb-4">
                    Be the voice of our customers and providers. Help them succeed on our platform and gather feedback for product improvements.
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/contact">Apply</Link>
                </Button>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Growth Marketing Lead</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Marketing • Remote • Full-time
                  </p>
                  <p className="text-sm mb-4">
                    Drive customer and provider acquisition through data-driven marketing campaigns. Experiment, measure, and scale what works.
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/contact">Apply</Link>
                </Button>
              </div>
            </Card>
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
          <Button size="lg" variant="secondary" asChild>
            <Link href="/contact">Get in Touch</Link>
          </Button>
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
