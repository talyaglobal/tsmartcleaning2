import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { requireTenantId } from '@/lib/tenant'

export async function POST(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const formData = await request.formData()
    const file = formData.get('file') as File
    const providerId = formData.get('providerId') as string

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

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${providerId}-${Date.now()}.${fileExt}`
    const filePath = `provider-photos/${fileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('public')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[provider/photo] upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('public').getPublicUrl(filePath)
    const photoUrl = urlData.publicUrl

    // Update provider profile with photo URL
    const { error: updateError } = await supabase
      .from('provider_profiles')
      .update({ photo_url: photoUrl })
      .eq('id', providerId)
      .eq('tenant_id', tenantId)

    if (updateError) {
      console.error('[provider/photo] update error:', updateError)
      // Try to delete the uploaded file
      await supabase.storage.from('public').remove([filePath])
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ photoUrl })
  } catch (error) {
    console.error('[provider/photo] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('providerId')

    if (!providerId) {
      return NextResponse.json({ error: 'providerId is required' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    // Get current photo URL
    const { data: provider } = await supabase
      .from('provider_profiles')
      .select('photo_url')
      .eq('id', providerId)
      .eq('tenant_id', tenantId)
      .single()

    if (provider?.photo_url) {
      // Extract file path from URL
      const urlParts = provider.photo_url.split('/')
      const filePath = urlParts.slice(urlParts.indexOf('provider-photos')).join('/')
      
      // Delete from storage
      await supabase.storage.from('public').remove([filePath])
    }

    // Remove photo URL from profile
    const { error: updateError } = await supabase
      .from('provider_profiles')
      .update({ photo_url: null })
      .eq('id', providerId)
      .eq('tenant_id', tenantId)

    if (updateError) {
      console.error('[provider/photo] delete error:', updateError)
      return NextResponse.json({ error: 'Failed to remove photo' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Photo removed successfully' })
  } catch (error) {
    console.error('[provider/photo] delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

