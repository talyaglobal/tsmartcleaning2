'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Star, MapPin, CheckCircle2, Calendar, Phone, Mail, Globe } from 'lucide-react'
import { PhotoGallery } from '@/components/cleaners/PhotoGallery'
import { ServicePackages } from '@/components/cleaners/ServicePackages'
import { AvailabilityCalendar } from '@/components/cleaners/AvailabilityCalendar'
import { ReviewSection } from '@/components/cleaners/ReviewSection'
import { ShareButton } from '@/components/cleaners/ShareButton'

interface Company {
  id: string
  name?: string | null
  company_name?: string | null
  slug?: string | null
  description?: string | null
  tagline?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  average_rating?: number | null
  total_reviews?: number | null
  verified?: boolean | null
  price_range?: string | null
  logo_url?: string | null
  cover_image_url?: string | null
  years_in_business?: number | null
  employee_count?: number | null
}

interface CleanerProfileClientProps {
  slug: string
  company: Company
}

export function CleanerProfileClient({ slug, company }: CleanerProfileClientProps) {
  const [profileData, setProfileData] = useState<{
    services: any[]
    reviews: any[]
    photos: any[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch(`/api/companies/slug/${slug}`)
        if (response.ok) {
          const data = await response.json()
          setProfileData({
            services: data.services || [],
            reviews: data.reviews || [],
            photos: data.photos || [],
          })
        }
      } catch (error) {
        console.error('Error fetching profile data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [slug])

  const displayName = company.name || company.company_name || slug.replace(/-/g, ' ')
  const location = [company.city, company.state, company.country]
    .filter(Boolean)
    .join(', ')
  const averageRating = company.average_rating || null
  const totalReviews = company.total_reviews || 0
  const profileUrl = typeof window !== 'undefined' ? window.location.href : `https://tsmartcleaning.com/cleaners/${slug}`

  return (
    <>
      {/* Hero Section */}
      <section className="relative">
        {company.cover_image_url ? (
          <div className="relative h-64 md:h-96 w-full">
            <Image
              src={company.cover_image_url}
              alt={`${displayName} cover`}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        ) : (
          <div className="h-64 md:h-96 w-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}

        <div className="container mx-auto px-4 -mt-20 relative z-10">
          <Card className="shadow-lg">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Logo */}
                <div className="flex-shrink-0">
                  {company.logo_url ? (
                    <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden border-4 border-background shadow-lg">
                      <Image
                        src={company.logo_url}
                        alt={`${displayName} logo`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg bg-muted border-4 border-background shadow-lg flex items-center justify-center">
                      <span className="text-2xl font-bold text-muted-foreground">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Company Info */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h1 className="text-2xl md:text-4xl font-bold">{displayName}</h1>
                        {company.verified && (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>

                      {location && (
                        <div className="flex items-center gap-1 text-muted-foreground mb-2">
                          <MapPin className="h-4 w-4" />
                          <span>{location}</span>
                        </div>
                      )}

                      {averageRating && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-5 w-5 ${
                                  i < Math.round(averageRating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-semibold">{averageRating.toFixed(1)}</span>
                          <span className="text-muted-foreground">
                            ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                          </span>
                        </div>
                      )}

                      {company.tagline && (
                        <p className="text-lg text-muted-foreground mb-4">{company.tagline}</p>
                      )}

                      {company.description && (
                        <p className="text-muted-foreground mb-4 line-clamp-2">
                          {company.description}
                        </p>
                      )}

                      {/* Quick Stats */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        {company.years_in_business && (
                          <div>
                            <span className="font-semibold">{company.years_in_business}+</span>
                            <span className="text-muted-foreground ml-1">Years in Business</span>
                          </div>
                        )}
                        {company.employee_count && (
                          <div>
                            <span className="font-semibold">{company.employee_count}</span>
                            <span className="text-muted-foreground ml-1">
                              {company.employee_count === 1 ? 'Employee' : 'Employees'}
                            </span>
                          </div>
                        )}
                        {company.price_range && (
                          <div>
                            <span className="font-semibold">{company.price_range}</span>
                            <span className="text-muted-foreground ml-1">Price Range</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      <Button asChild size="lg" className="w-full md:w-auto">
                        <Link href={`/customer/book?companyId=${encodeURIComponent(company.id)}`}>
                          Request Booking
                        </Link>
                      </Button>
                      <ShareButton
                        url={profileUrl}
                        title={displayName}
                        description={company.description || company.tagline || undefined}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* About Section */}
              {company.description && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold mb-4">About</h2>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {company.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Services */}
              {!loading && profileData && (
                <ServicePackages services={profileData.services} />
              )}

              {/* Photo Gallery */}
              {!loading && profileData && profileData.photos.length > 0 && (
                <PhotoGallery photos={profileData.photos} />
              )}

              {/* Reviews */}
              {!loading && profileData && (
                <ReviewSection
                  reviews={profileData.reviews}
                  averageRating={averageRating}
                  totalReviews={totalReviews}
                />
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Booking CTA Card */}
              <Card className="sticky top-4">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">Book a Service</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Request a booking and we'll get back to you within 24 hours.
                  </p>
                  <Button asChild className="w-full mb-4" size="lg">
                    <Link href={`/customer/book?companyId=${encodeURIComponent(company.id)}`}>
                      Request Booking
                    </Link>
                  </Button>
                  <div className="text-xs text-muted-foreground text-center">
                    Contact details are protected until booking is accepted
                  </div>
                </CardContent>
              </Card>

              {/* Availability Calendar */}
              <AvailabilityCalendar companyId={company.id} />

              {/* Quick Info */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Info</h3>
                  <div className="space-y-3 text-sm">
                    {location && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="text-muted-foreground">{location}</span>
                      </div>
                    )}
                    {company.price_range && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Price Range:</span>
                        <span className="text-muted-foreground">{company.price_range}</span>
                      </div>
                    )}
                    {averageRating && (
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{averageRating.toFixed(1)}</span>
                        <span className="text-muted-foreground">
                          ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                        </span>
                      </div>
                    )}
                    {company.verified && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-muted-foreground">Verified Company</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

