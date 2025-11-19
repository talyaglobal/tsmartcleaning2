import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, ArrowRight, Clock } from 'lucide-react'
import { NewsletterSubscription } from '@/components/blog/NewsletterSubscription'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Blog - Cleaning Tips, Guides & Industry Insights',
  description: 'Expert advice, helpful tips, and the latest trends in professional cleaning services. Learn how to keep your home or office clean and healthy.',
  path: '/blog',
  type: 'website',
  keywords: ['cleaning tips', 'cleaning blog', 'house cleaning advice', 'professional cleaning guides', 'cleaning industry news'],
})

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  featured_image: string | null
  published_at: string
  reading_time_minutes: number | null
  blog_categories: {
    id: string
    name: string
    slug: string
  } | null
  tags?: Array<{
    id: string
    name: string
    slug: string
  }>
}

async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/blog?limit=12`, {
      next: { revalidate: 60 } // Revalidate every minute
    })

    if (!res.ok) {
      console.error('Failed to fetch blog posts')
      return []
    }

    const data = await res.json()
    return data.posts || []
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return []
  }
}

export default async function BlogPage() {
  const posts = await getBlogPosts()

  return (
    <div className="min-h-screen">
      <JsonLd
        data={generateBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Blog', url: '/blog' },
        ])}
      />
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4" variant="secondary">
              Blog
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
              Cleaning Tips, Guides & Industry Insights
            </h1>
            <p className="text-lg text-muted-foreground text-pretty">
              Expert advice, helpful tips, and the latest trends in professional cleaning services.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No blog posts available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {posts.map((post) => {
                const publishedDate = new Date(post.published_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })

                return (
                  <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {post.featured_image && (
                      <div className="aspect-[4/3] bg-muted overflow-hidden">
                        <Image
                          src={post.featured_image}
                          alt={post.title}
                          width={400}
                          height={300}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                        {post.blog_categories && (
                          <Badge variant="outline" className="text-xs">
                            {post.blog_categories.name}
                          </Badge>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {publishedDate}
                        </div>
                      </div>
                      <h2 className="text-xl font-semibold mb-2 line-clamp-2">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        {post.reading_time_minutes && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {post.reading_time_minutes} min read
                          </div>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/blog/${post.slug}`}>
                            Read More
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <NewsletterSubscription />
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

