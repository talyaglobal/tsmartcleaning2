import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, ArrowRight, Clock } from 'lucide-react'

export default function BlogPage() {
  const posts = [
    {
      id: 1,
      title: "10 Tips for Maintaining a Clean Home Between Professional Cleanings",
      excerpt: "Discover simple strategies to keep your home spotless and extend the time between professional cleaning visits.",
      date: "January 15, 2025",
      readTime: "5 min read",
      category: "Tips & Tricks",
      image: "/tsmartcleaning.webflow/images/7a3b972a-7300-4e52-89de-c27861f06954.avif"
    },
    {
      id: 2,
      title: "How to Choose the Right Cleaning Service for Your Business",
      excerpt: "A comprehensive guide for business owners looking to select the perfect commercial cleaning service provider.",
      date: "January 10, 2025",
      readTime: "7 min read",
      category: "Business",
      image: "/tsmartcleaning.webflow/images/390d4b90-ab8f-4298-bb01-24aad70695c5.avif"
    },
    {
      id: 3,
      title: "The Benefits of Regular Professional Cleaning Services",
      excerpt: "Explore the health, productivity, and cost-saving benefits of maintaining a regular professional cleaning schedule.",
      date: "January 5, 2025",
      readTime: "6 min read",
      category: "Health & Wellness",
      image: "/tsmartcleaning.webflow/images/533b01ed-057f-4eee-ab77-4fbbfd98cbd7.avif"
    },
  ]

  return (
    <div className="min-h-screen">
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-[4/3] bg-muted overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                    <Badge variant="outline" className="text-xs">
                      {post.category}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {post.date}
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold mb-2 line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {post.readTime}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/blog/${post.id}`}>
                        Read More
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <Card className="p-8 max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Stay Updated</h2>
            <p className="text-muted-foreground mb-6">
              Subscribe to our newsletter and get cleaning tips, special offers, and industry insights delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button>Subscribe</Button>
            </div>
          </Card>
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

