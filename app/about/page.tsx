'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { WebflowSection, WebflowButton, WebflowCard, ScrollAnimation } from '@/components/webflow'
import { Target, Users, Award, Heart, CheckCircle2, Sparkles, MapPin, Calendar, ExternalLink, Linkedin, Twitter, Mail } from 'lucide-react'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateBreadcrumbSchema, generateOrganizationSchema } from '@/lib/seo'
import { cn } from '@/lib/utils'

interface Stats {
  happyCustomers: number
  verifiedProviders: number
  citiesCovered: number
  averageRating: number
}

interface TeamMember {
  id: string
  name: string
  role: string
  bio: string | null
  photo_url: string | null
  email: string | null
  linkedin_url: string | null
  twitter_url: string | null
}

interface TimelineEvent {
  id: string
  year: number
  month: number | null
  title: string
  description: string | null
  image_url: string | null
}

interface OfficeLocation {
  id: string
  name: string
  address_line_1: string
  address_line_2: string | null
  city: string
  state: string
  zip_code: string
  country: string
  phone: string | null
  email: string | null
  is_headquarters: boolean
}

interface PressMention {
  id: string
  title: string
  publication: string
  url: string | null
  published_date: string | null
  excerpt: string | null
  image_url: string | null
}

export default function AboutPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [locations, setLocations] = useState<OfficeLocation[]>([])
  const [pressMentions, setPressMentions] = useState<PressMention[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats
        const statsRes = await fetch('/api/about/stats')
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }

        // Fetch team members
        const teamRes = await fetch('/api/about/team')
        if (teamRes.ok) {
          const teamData = await teamRes.json()
          setTeamMembers(teamData.teamMembers || [])
        }

        // Fetch timeline
        const timelineRes = await fetch('/api/about/timeline')
        if (timelineRes.ok) {
          const timelineData = await timelineRes.json()
          setTimeline(timelineData.timeline || [])
        }

        // Fetch locations
        const locationsRes = await fetch('/api/about/locations')
        if (locationsRes.ok) {
          const locationsData = await locationsRes.json()
          setLocations(locationsData.locations || [])
        }

        // Fetch press mentions
        const pressRes = await fetch('/api/about/press')
        if (pressRes.ok) {
          const pressData = await pressRes.json()
          setPressMentions(pressData.pressMentions || [])
        }
      } catch (error) {
        console.error('Error fetching about page data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k+`
    }
    return `${num}+`
  }

  return (
    <div className="min-h-screen">
      <JsonLd
        data={[
          generateBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'About', url: '/about' },
          ]),
          generateOrganizationSchema(),
        ]}
      />

      {/* Hero Section */}
      <WebflowSection variant="default" className="padding_none">
        <div className={cn("text-align_center max-w-3xl mx-auto animate-hero-fade-in")}>
          <h1 className="heading_h1 mb-6">
            Making Professional Cleaning Accessible to Everyone
          </h1>
          <p className="paragraph_large text-color_secondary">
            Founded in 2020, TSmartCleaning is revolutionizing the cleaning services industry by connecting trusted professionals with customers across the USA.
          </p>
        </div>
      </WebflowSection>

      {/* Mission & Values */}
      <WebflowSection>
        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <ScrollAnimation delay={0}>
            <WebflowCard className="animate-hover-lift">
              <Target className="h-12 w-12 text-primary mb-4" />
              <h2 className="heading_h2 mb-4">Our Mission</h2>
              <p className="paragraph_small text-color_secondary">
                To simplify and elevate the cleaning services experience by creating a trusted marketplace that empowers both customers and service providers. We believe everyone deserves a clean, healthy environment without the hassle.
              </p>
            </WebflowCard>
          </ScrollAnimation>
          <ScrollAnimation delay={100}>
            <WebflowCard className="animate-hover-lift">
              <Heart className="h-12 w-12 text-primary mb-4" />
              <h2 className="heading_h2 mb-4">Our Values</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="paragraph_small text-color_secondary">Trust and transparency in every interaction</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="paragraph_small text-color_secondary">Quality service that exceeds expectations</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="paragraph_small text-color_secondary">Supporting and empowering service providers</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="paragraph_small text-color_secondary">Innovation through technology</span>
                </li>
              </ul>
            </WebflowCard>
          </ScrollAnimation>
        </div>
      </WebflowSection>

      {/* Stats */}
      <WebflowSection variant="secondary">
        <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto text-align_center">
          <ScrollAnimation delay={0} className="text-center">
            <div className="heading_h2 mb-2">
              {loading ? '...' : stats ? formatNumber(stats.happyCustomers) : '10,000+'}
            </div>
            <div className="paragraph_small text-color_secondary">Happy Customers</div>
          </ScrollAnimation>
          <ScrollAnimation delay={100} className="text-center">
            <div className="heading_h2 mb-2">
              {loading ? '...' : stats ? formatNumber(stats.verifiedProviders) : '2,500+'}
            </div>
            <div className="paragraph_small text-color_secondary">Verified Providers</div>
          </ScrollAnimation>
          <ScrollAnimation delay={200} className="text-center">
            <div className="heading_h2 mb-2">
              {loading ? '...' : stats ? `${stats.citiesCovered}+` : '50+'}
            </div>
            <div className="paragraph_small text-color_secondary">Cities Covered</div>
          </ScrollAnimation>
          <ScrollAnimation delay={300} className="text-center">
            <div className="heading_h2 mb-2">
              {loading ? '...' : stats ? `${stats.averageRating}/5` : '4.9/5'}
            </div>
            <div className="paragraph_small text-color_secondary">Average Rating</div>
          </ScrollAnimation>
        </div>
      </WebflowSection>

      {/* Team Section */}
      {teamMembers.length > 0 && (
        <WebflowSection>
          <div className="text-align_center mb-12">
            <h2 className="heading_h2 mb-4">Meet Our Team</h2>
            <p className="paragraph_large text-color_secondary max-w-2xl mx-auto">
              Built by a team passionate about creating better experiences
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {teamMembers.map((member) => (
              <WebflowCard key={member.id} className="text-align_center">
                {member.photo_url && (
                  <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                    <Image
                      src={member.photo_url}
                      alt={member.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <h3 className="heading_h4 mb-1">{member.name}</h3>
                <p className="text-primary font-medium mb-3">{member.role}</p>
                {member.bio && (
                  <p className="paragraph_small text-color_secondary mb-4">{member.bio}</p>
                )}
                <div className="flex items-center justify-center gap-3">
                  {member.linkedin_url && (
                    <a
                      href={member.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-color_secondary hover:text-primary transition-colors"
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                  {member.twitter_url && (
                    <a
                      href={member.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-color_secondary hover:text-primary transition-colors"
                    >
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="text-color_secondary hover:text-primary transition-colors"
                    >
                      <Mail className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </WebflowCard>
            ))}
          </div>
        </WebflowSection>
      )}

      {/* Why Choose Us Section */}
      <WebflowSection variant="secondary">
        <div className="text-align_center mb-12">
          <h2 className="heading_h2 mb-4">Why Choose Us</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <WebflowCard className="text-align_center">
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="heading_h4 mb-2">Customer First</h3>
            <p className="paragraph_small text-color_secondary">
              Every decision we make is centered around delivering the best experience for our customers and providers.
            </p>
          </WebflowCard>
          <WebflowCard className="text-align_center">
            <Award className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="heading_h4 mb-2">Quality Assured</h3>
            <p className="paragraph_small text-color_secondary">
              Rigorous vetting process and ongoing quality checks ensure you always get top-tier service.
            </p>
          </WebflowCard>
          <WebflowCard className="text-align_center">
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="heading_h4 mb-2">Innovation Driven</h3>
            <p className="paragraph_small text-color_secondary">
              Continuously improving our platform with the latest technology to make cleaning services effortless.
            </p>
          </WebflowCard>
        </div>
      </WebflowSection>

      {/* Company Timeline */}
      {timeline.length > 0 && (
        <WebflowSection>
          <div className="text-align_center mb-12">
            <h2 className="heading_h2 mb-4">Our Journey</h2>
            <p className="paragraph_large text-color_secondary max-w-2xl mx-auto">
              Key milestones in our company's growth
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border"></div>
              <div className="space-y-12">
                {timeline.map((event) => (
                  <div key={event.id} className="relative pl-20">
                    <div className="absolute left-6 top-2 w-4 h-4 rounded-full bg-primary border-4 border-background"></div>
                    <WebflowCard>
                      <div className="flex items-start gap-4">
                        {event.image_url && (
                          <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                            <Image
                              src={event.image_url}
                              alt={event.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-color_secondary" />
                            <span className="paragraph_small text-color_secondary">
                              {event.month
                                ? new Date(event.year, event.month - 1).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                  })
                                : event.year}
                            </span>
                          </div>
                          <h3 className="heading_h4 mb-2">{event.title}</h3>
                          {event.description && (
                            <p className="paragraph_small text-color_secondary">{event.description}</p>
                          )}
                        </div>
                      </div>
                    </WebflowCard>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </WebflowSection>
      )}

      {/* Office Locations */}
      {locations.length > 0 && (
        <WebflowSection variant="secondary">
          <div className="text-align_center mb-12">
            <h2 className="heading_h2 mb-4">Our Locations</h2>
            <p className="paragraph_large text-color_secondary max-w-2xl mx-auto">
              Find us in cities across the USA
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {locations.map((location) => (
              <WebflowCard key={location.id}>
                {location.is_headquarters && (
                  <span className="inline-block px-2 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded mb-3">
                    Headquarters
                  </span>
                )}
                <h3 className="heading_h4 mb-3">{location.name}</h3>
                <div className="space-y-2 text-color_secondary">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="paragraph_small">{location.address_line_1}</p>
                      {location.address_line_2 && <p className="paragraph_small">{location.address_line_2}</p>}
                      <p className="paragraph_small">
                        {location.city}, {location.state} {location.zip_code}
                      </p>
                      <p className="paragraph_small">{location.country}</p>
                    </div>
                  </div>
                  {location.phone && (
                    <p className="paragraph_small">
                      <strong>Phone:</strong> {location.phone}
                    </p>
                  )}
                  {location.email && (
                    <p className="paragraph_small">
                      <strong>Email:</strong>{' '}
                      <a href={`mailto:${location.email}`} className="text-link hover:underline">
                        {location.email}
                      </a>
                    </p>
                  )}
                </div>
              </WebflowCard>
            ))}
          </div>
        </WebflowSection>
      )}

      {/* Press/Media Section */}
      {pressMentions.length > 0 && (
        <WebflowSection>
          <div className="text-align_center mb-12">
            <h2 className="heading_h2 mb-4">Press & Media</h2>
            <p className="paragraph_large text-color_secondary max-w-2xl mx-auto">
              See what the media is saying about us
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {pressMentions.map((mention) => (
              <WebflowCard key={mention.id} className="hover:shadow-lg transition-shadow">
                {mention.image_url && (
                  <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                    <Image
                      src={mention.image_url}
                      alt={mention.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="paragraph_small text-color_secondary mb-2">
                  {mention.publication}
                  {mention.published_date && (
                    <span className="ml-2">
                      • {new Date(mention.published_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                    </span>
                  )}
                </div>
                <h3 className="heading_h5 mb-2">{mention.title}</h3>
                {mention.excerpt && (
                  <p className="paragraph_small text-color_secondary mb-4 line-clamp-3">
                    {mention.excerpt}
                  </p>
                )}
                {mention.url && (
                  <a
                    href={mention.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-link hover:underline paragraph_small"
                  >
                    Read more <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </WebflowCard>
            ))}
          </div>
        </WebflowSection>
      )}

      {/* CTA */}
      <WebflowSection variant="inverse">
        <div className="text-align_center">
          <h2 className="heading_h2 mb-4 on-inverse">Join Our Growing Community</h2>
          <p className="paragraph_large mb-8 text-color_inverse-secondary max-w-2xl mx-auto">
            Whether you're looking for cleaning services or wanting to grow your cleaning business, we're here for you.
          </p>
          <div className="button-group">
            <WebflowButton variant="secondary" href="/signup">Book a Service</WebflowButton>
            <WebflowButton variant="secondary" href="/provider-signup">Become a Provider</WebflowButton>
          </div>
        </div>
      </WebflowSection>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 TSmartCleaning. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
