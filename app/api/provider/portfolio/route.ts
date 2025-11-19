import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { requireTenantId } from '@/lib/tenant'

// Get provider portfolio
export async function GET(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('providerId')

    if (!providerId) {
      return NextResponse.json({ error: 'providerId is required' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    // Note: We'll store portfolio in a simple JSON column or create a separate table
    // For now, we'll use provider_profiles.portfolio_images JSONB column if it exists
    // Or we can create a provider_portfolio table
    
    // Try to get portfolio from provider_profiles
    const { data: provider } = await supabase
      .from('provider_profiles')
      .select('portfolio_images')
      .eq('id', providerId)
      .eq('tenant_id', tenantId)
      .single()

    const portfolioItems = (provider?.portfolio_images as any[]) || []

    return NextResponse.json({ items: portfolioItems })
  } catch (error) {
    console.error('[provider/portfolio] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Add portfolio item
export async function POST(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const formData = await request.formData()
    const file = formData.get('file') as File
    const providerId = formData.get('providerId') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!providerId) {
      return NextResponse.json({ error: 'providerId is required' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${providerId}-portfolio-${Date.now()}.${fileExt}`
    const filePath = `provider-portfolio/${fileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('public')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[provider/portfolio] upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('public').getPublicUrl(filePath)
    const imageUrl = urlData.publicUrl

    // Get current portfolio
    const { data: provider } = await supabase
      .from('provider_profiles')
      .select('portfolio_images')
      .eq('id', providerId)
      .eq('tenant_id', tenantId)
      .single()

    const currentPortfolio = (provider?.portfolio_images as any[]) || []
    
    // Add new item
    const newItem = {
      id: `portfolio-${Date.now()}`,
      imageUrl,
      title: title || null,
      description: description || null,
      createdAt: new Date().toISOString(),
    }

    const updatedPortfolio = [...currentPortfolio, newItem]

    // Update provider profile
    const { error: updateError } = await supabase
      .from('provider_profiles')
      .update({ portfolio_images: updatedPortfolio })
      .eq('id', providerId)
      .eq('tenant_id', tenantId)

    if (updateError) {
      console.error('[provider/portfolio] update error:', updateError)
      // Try to delete the uploaded file
      await supabase.storage.from('public').remove([filePath])
      return NextResponse.json({ error: 'Failed to update portfolio' }, { status: 500 })
    }

    return NextResponse.json({ item: newItem })
  } catch (error) {
    console.error('[provider/portfolio] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update portfolio item
export async function PUT(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const { providerId, itemId, title, description, file } = await request.json()

    if (!providerId || !itemId) {
      return NextResponse.json({ error: 'providerId and itemId are required' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    // Get current portfolio
    const { data: provider } = await supabase
      .from('provider_profiles')
      .select('portfolio_images')
      .eq('id', providerId)
      .eq('tenant_id', tenantId)
      .single()

    const portfolio = (provider?.portfolio_images as any[]) || []
    const itemIndex = portfolio.findIndex((item: any) => item.id === itemId)

    if (itemIndex === -1) {
      return NextResponse.json({ error: 'Portfolio item not found' }, { status: 404 })
    }

    // Update item
    portfolio[itemIndex] = {
      ...portfolio[itemIndex],
      title: title || portfolio[itemIndex].title,
      description: description || portfolio[itemIndex].description,
    }

    // If file is provided, upload new image
    if (file) {
      // Implementation for file upload in PUT would require form data
      // For now, we'll skip file replacement in PUT
    }

    // Update provider profile
    const { error: updateError } = await supabase
      .from('provider_profiles')
      .update({ portfolio_images: portfolio })
      .eq('id', providerId)
      .eq('tenant_id', tenantId)

    if (updateError) {
      console.error('[provider/portfolio] update error:', updateError)
      return NextResponse.json({ error: 'Failed to update portfolio' }, { status: 500 })
    }

    return NextResponse.json({ item: portfolio[itemIndex] })
  } catch (error) {
    console.error('[provider/portfolio] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete portfolio item
export async function DELETE(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('providerId')
    const itemId = searchParams.get('itemId')

    if (!providerId || !itemId) {
      return NextResponse.json({ error: 'providerId and itemId are required' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    // Get current portfolio
    const { data: provider } = await supabase
      .from('provider_profiles')
      .select('portfolio_images')
      .eq('id', providerId)
      .eq('tenant_id', tenantId)
      .single()

    const portfolio = (provider?.portfolio_images as any[]) || []
    const itemIndex = portfolio.findIndex((item: any) => item.id === itemId)

    if (itemIndex === -1) {
      return NextResponse.json({ error: 'Portfolio item not found' }, { status: 404 })
    }

    const item = portfolio[itemIndex]

    // Delete image from storage if URL exists
    if (item.imageUrl) {
      const urlParts = item.imageUrl.split('/')
      const filePath = urlParts.slice(urlParts.indexOf('provider-portfolio')).join('/')
      await supabase.storage.from('public').remove([filePath])
    }

    // Remove item from portfolio
    portfolio.splice(itemIndex, 1)

    // Update provider profile
    const { error: updateError } = await supabase
      .from('provider_profiles')
      .update({ portfolio_images: portfolio })
      .eq('id', providerId)
      .eq('tenant_id', tenantId)

    if (updateError) {
      console.error('[provider/portfolio] delete error:', updateError)
      return NextResponse.json({ error: 'Failed to remove portfolio item' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Portfolio item removed successfully' })
  } catch (error) {
    console.error('[provider/portfolio] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

