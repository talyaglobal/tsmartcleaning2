import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { CleanerProfileClient } from './CleanerProfileClient'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateSEOMetadata, generateBreadcrumbSchema, generateLocalBusinessSchema, generateReviewSchema } from '@/lib/seo'

type PageProps = {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const supabase = createServerSupabase()
    const { data } = await supabase
      .from('companies')
      .select('name, company_name, description, tagline, logo_url, cover_image_url')
      .eq('slug', params.slug)
      .eq('status', 'active')
      .single()

    if (!data) {
      const name = params.slug.replace(/-/g, ' ')
      return {
        title: `${name} — Cleaning Company`,
        description: 'View services, ratings, and request a booking.',
      }
    }

    const name = data.name || data.company_name || params.slug.replace(/-/g, ' ')
    const description = data.description || data.tagline || 'View services, ratings, and request a booking.'
    const image = data.cover_image_url || data.logo_url

    return generateSEOMetadata({
      title: `${name} — Cleaning Company`,
      description,
      path: `/cleaners/${params.slug}`,
      image: image || undefined,
      type: 'profile',
    })
  } catch (error) {
    const name = params.slug.replace(/-/g, ' ')
    return {
      title: `${name} — Cleaning Company`,
      description: 'View services, ratings, and request a booking.',
    }
  }
}


export default async function CleanerProfilePage({ params }: PageProps) {
  try {
    const supabase = createServerSupabase()
    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('slug', params.slug)
      .eq('status', 'active')
      .single()

    if (error || !company) {
      notFound()
    }

    const name = company.name || company.company_name || params.slug.replace(/-/g, ' ')
    const jsonLdData = [
      generateBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Find Cleaners', url: '/find-cleaners' },
        { name, url: `/cleaners/${params.slug}` },
      ]),
      generateLocalBusinessSchema({
        name,
        description: company.description || company.tagline || undefined,
        image: company.cover_image_url || company.logo_url || undefined,
        url: `https://tsmartcleaning.com/cleaners/${params.slug}`,
        priceRange: company.price_range || undefined,
        rating: company.average_rating
          ? {
              ratingValue: company.average_rating,
              reviewCount: company.total_reviews || 0,
            }
          : undefined,
        address: company.city || company.state
          ? {
              addressLocality: company.city || '',
              addressRegion: company.state || '',
              addressCountry: company.country || 'US',
            }
          : undefined,
      }),
    ]

    // Add review schema if ratings exist
    if (company.average_rating) {
      jsonLdData.push(
        generateReviewSchema({
          rating: company.average_rating,
          reviewCount: company.total_reviews || 0,
        })
      )
    }

    return (
      <main className="min-h-screen">
        <JsonLd data={jsonLdData} />
        <CleanerProfileClient slug={params.slug} company={company} />
      </main>
    )
  } catch (error) {
    console.error('Error loading cleaner profile:', error)
    notFound()
  }
}
