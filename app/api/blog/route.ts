import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'

// Get all blog posts (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const tag = searchParams.get('tag')
    const search = searchParams.get('search')
    const statusFilter = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const supabase = createServerSupabase()

    let query = supabase
      .from('blog_posts')
      .select(`
        *,
        blog_categories (
          id,
          name,
          slug
        ),
        users:author_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply status filter: 'all' shows all posts, otherwise default to 'published'
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    } else if (!statusFilter || statusFilter === 'all') {
      // If 'all' or no filter, show all statuses (for admin/team use)
      // Otherwise default to published
      if (!statusFilter) {
        query = query.eq('status', 'published')
      }
    }

    if (category) {
      query = query.eq('category_id', category)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,content.ilike.%${search}%`)
    }

    const { data: posts, error: postsError } = await query

    if (postsError) {
      console.error('[v0] Get blog posts error:', postsError)
      return NextResponse.json({ error: 'Failed to load blog posts' }, { status: 500 })
    }

    // If tag filter is provided, filter posts by tag
    let filteredPosts = posts || []
    if (tag) {
      const { data: taggedPosts, error: tagError } = await supabase
        .from('blog_post_tags')
        .select('blog_post_id')
        .eq('tag_id', tag)

      if (tagError) {
        console.error('[v0] Get tagged posts error:', tagError)
      } else {
        const taggedPostIds = new Set((taggedPosts || []).map((tp: any) => tp.blog_post_id))
        filteredPosts = (posts || []).filter((post: any) => taggedPostIds.has(post.id))
      }
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })

    // Apply same status filter to count query
    if (statusFilter && statusFilter !== 'all') {
      countQuery = countQuery.eq('status', statusFilter)
    } else if (!statusFilter) {
      countQuery = countQuery.eq('status', 'published')
    }

    if (category) {
      countQuery = countQuery.eq('category_id', category)
    }

    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,content.ilike.%${search}%`)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('[v0] Get blog posts count error:', countError)
    }

    // Get tags for each post
    const postIds = filteredPosts.map((post: any) => post.id)
    if (postIds.length > 0) {
      const { data: postTags, error: tagsError } = await supabase
        .from('blog_post_tags')
        .select(`
          blog_post_id,
          blog_tags (
            id,
            name,
            slug
          )
        `)
        .in('blog_post_id', postIds)

      if (!tagsError && postTags) {
        const tagsByPostId = new Map()
        postTags.forEach((pt: any) => {
          if (!tagsByPostId.has(pt.blog_post_id)) {
            tagsByPostId.set(pt.blog_post_id, [])
          }
          tagsByPostId.get(pt.blog_post_id).push(pt.blog_tags)
        })

        filteredPosts = filteredPosts.map((post: any) => ({
          ...post,
          tags: tagsByPostId.get(post.id) || []
        }))
      }
    }

    return NextResponse.json({
      posts: filteredPosts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('[v0] Get blog posts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create a new blog post (admin only)
export const POST = withAuth(
  async (
    request: NextRequest,
    auth: { user: any, supabase: any, tenantId: string | null }
  ) => {
    try {
      const body = await request.json()
      const { title, slug, excerpt, content, featured_image, category_id, author_id, tags, meta_title, meta_description, meta_keywords, status, published_at } = body

      if (!title || !slug || !content) {
        return NextResponse.json(
          { error: 'Title, slug, and content are required' },
          { status: 400 }
        )
      }

      const supabase = createServerSupabase()

    // Calculate reading time (average reading speed: 200 words per minute)
    const wordCount = content.split(/\s+/).length
    const readingTimeMinutes = Math.ceil(wordCount / 200)

    // Insert blog post
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .insert({
        title,
        slug,
        excerpt,
        content,
        featured_image,
        category_id,
        author_id,
        meta_title: meta_title || title,
        meta_description: meta_description || excerpt,
        meta_keywords: meta_keywords || [],
        reading_time_minutes: readingTimeMinutes,
        status: status || 'draft',
        published_at: status === 'published' ? (published_at || new Date().toISOString()) : null
      })
      .select()
      .single()

    if (postError) {
      console.error('[v0] Create blog post error:', postError)
      return NextResponse.json(
        { error: 'Failed to create blog post' },
        { status: 500 }
      )
    }

    // Add tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      // First, ensure all tags exist
      const tagInserts = tags.map((tagName: string) => {
        const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        return {
          name: tagName,
          slug: tagSlug
        }
      })

      // Insert tags (ignore conflicts)
      await supabase
        .from('blog_tags')
        .upsert(tagInserts, { onConflict: 'slug', ignoreDuplicates: false })

      // Get tag IDs
      const { data: existingTags } = await supabase
        .from('blog_tags')
        .select('id, slug')
        .in('slug', tagInserts.map((t: any) => t.slug))

      if (existingTags) {
        // Create blog_post_tags relationships
        const postTagInserts = existingTags.map((tag: any) => ({
          blog_post_id: post.id,
          tag_id: tag.id
        }))

        await supabase
          .from('blog_post_tags')
          .insert(postTagInserts)
      }
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('[v0] Create blog post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
  },
  { requireAdmin: true }
)

