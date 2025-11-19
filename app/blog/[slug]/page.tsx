import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Calendar, Clock, ArrowLeft, Share2, Facebook, Twitter, Linkedin, Mail } from 'lucide-react'
import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateSEOMetadata, generateBreadcrumbSchema, generateArticleSchema } from '@/lib/seo'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featured_image: string | null
  published_at: string
  reading_time_minutes: number | null
  view_count: number
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string[] | null
  blog_categories: {
    id: string
    name: string
    slug: string
  } | null
  users: {
    id: string
    full_name: string
    avatar_url: string | null
  } | null
  tags: Array<{
    id: string
    name: string
    slug: string
  }>
  related_posts?: Array<{
    id: string
    title: string
    slug: string
    excerpt: string
    featured_image: string | null
    published_at: string
    reading_time_minutes: number | null
    blog_categories: {
      name: string
      slug: string
    } | null
  }>
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/blog/${slug}`, {
      cache: 'no-store'
    })

    if (!res.ok) {
      return null
    }

    const data = await res.json()
    return data.post
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return null
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getBlogPost(params.slug)

  if (!post) {
    return {
      title: 'Blog Post Not Found',
    }
  }

  return generateSEOMetadata({
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    path: `/blog/${params.slug}`,
    image: post.featured_image || undefined,
    type: 'article',
    publishedTime: post.published_at,
    keywords: post.meta_keywords || [],
  })
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug)

  if (!post) {
    notFound()
  }

  const publishedDate = new Date(post.published_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tsmartcleaning.com'
  const shareUrl = `${baseUrl}/blog/${post.slug}`
  const shareTitle = encodeURIComponent(post.title)
  const shareText = encodeURIComponent(post.excerpt)

  return (
    <div className="min-h-screen">
      <JsonLd
        data={[
          generateBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Blog', url: '/blog' },
            { name: post.title, url: `/blog/${post.slug}` },
          ]),
          generateArticleSchema({
            title: post.title,
            description: post.excerpt,
            image: post.featured_image || undefined,
            publishedTime: post.published_at,
            author: post.users
              ? {
                  name: post.users.full_name,
                }
              : undefined,
          }),
        ]}
      />
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" asChild>
            <Link href="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <article className="py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Category and Date */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            {post.blog_categories && (
              <Badge variant="outline">
                {post.blog_categories.name}
              </Badge>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {publishedDate}
            </div>
            {post.reading_time_minutes && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {post.reading_time_minutes} min read
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-muted-foreground mb-8 text-pretty">
              {post.excerpt}
            </p>
          )}

          {/* Featured Image */}
          {post.featured_image && (
            <div className="aspect-video w-full mb-8 rounded-lg overflow-hidden bg-muted">
              <Image
                src={post.featured_image}
                alt={post.title}
                width={1200}
                height={675}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          )}

          {/* Author and Share */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-8 border-b">
            {post.users && (
              <div className="flex items-center gap-3">
                {post.users.avatar_url ? (
                  <Image
                    src={post.users.avatar_url}
                    alt={post.users.full_name}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {post.users.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold">{post.users.full_name}</p>
                  <p className="text-sm text-muted-foreground">Author</p>
                </div>
              </div>
            )}

            {/* Social Share Buttons */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground mr-2">Share:</span>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-9 w-9 p-0"
              >
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-9 w-9 p-0"
              >
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${shareTitle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-9 w-9 p-0"
              >
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-9 w-9 p-0"
              >
                <a
                  href={`mailto:?subject=${shareTitle}&body=${shareText}%20${encodeURIComponent(shareUrl)}`}
                  aria-label="Share via Email"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Content */}
          <div
            className="blog-content mb-12"
            dangerouslySetInnerHTML={{ __html: post.content }}
            style={{
              lineHeight: '1.75',
              fontSize: '1.125rem',
            }}
          />

          {/* Related Posts */}
          {post.related_posts && post.related_posts.length > 0 && (
            <section className="mt-16 pt-12 border-t">
              <h2 className="text-2xl md:text-3xl font-bold mb-8">Related Posts</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {post.related_posts.map((relatedPost) => (
                  <Card key={relatedPost.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {relatedPost.featured_image && (
                      <div className="aspect-[4/3] bg-muted overflow-hidden">
                        <Image
                          src={relatedPost.featured_image}
                          alt={relatedPost.title}
                          width={400}
                          height={300}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      {relatedPost.blog_categories && (
                        <Badge variant="outline" className="text-xs mb-2">
                          {relatedPost.blog_categories.name}
                        </Badge>
                      )}
                      <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                        <Link href={`/blog/${relatedPost.slug}`} className="hover:underline">
                          {relatedPost.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {relatedPost.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(relatedPost.published_at).toLocaleDateString()}
                        </div>
                        {relatedPost.reading_time_minutes && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {relatedPost.reading_time_minutes} min
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </div>
  )
}

