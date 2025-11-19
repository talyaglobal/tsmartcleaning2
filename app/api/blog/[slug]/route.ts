import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// Get a single blog post by slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    // Get the blog post
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select(`
        *,
        blog_categories (
          id,
          name,
          slug,
          description
        ),
        users:author_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    // Get tags for this post
    const { data: postTags, error: tagsError } = await supabase
      .from('blog_post_tags')
      .select(`
        blog_tags (
          id,
          name,
          slug
        )
      `)
      .eq('blog_post_id', post.id)

    if (!tagsError && postTags) {
      post.tags = postTags.map((pt: any) => pt.blog_tags)
    }

    // Get related posts (same category, excluding current post)
    const { data: relatedPosts, error: relatedError } = await supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image,
        published_at,
        reading_time_minutes,
        blog_categories (
          name,
          slug
        )
      `)
      .eq('status', 'published')
      .eq('category_id', post.category_id)
      .neq('id', post.id)
      .order('published_at', { ascending: false })
      .limit(3)

    if (!relatedError && relatedPosts) {
      post.related_posts = relatedPosts
    }

    // Increment view count
    await supabase
      .from('blog_posts')
      .update({ view_count: (post.view_count || 0) + 1 })
      .eq('id', post.id)

    return NextResponse.json({ post })
  } catch (error) {
    console.error('[v0] Get blog post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

