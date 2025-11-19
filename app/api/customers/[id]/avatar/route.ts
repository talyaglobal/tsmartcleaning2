import { NextRequest, NextResponse } from 'next/server'
import { requireTenantId } from '@/lib/tenant'
import { withAuthAndParams, verifyCustomerOwnership } from '@/lib/auth/rbac'

export const POST = withAuthAndParams(
  async (
    request: NextRequest,
    auth,
    { params }: { params: { id: string } }
  ) => {
    try {
      // Verify user owns this resource (or is admin)
      const ownershipCheck = verifyCustomerOwnership(params.id, auth)
      if (ownershipCheck) return ownershipCheck

      const tenantId = requireTenantId(request)
      
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      
      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        )
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'File must be an image' },
          { status: 400 }
        )
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File size must be less than 5MB' },
          { status: 400 }
        )
      }

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${params.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase storage
      const { error: uploadError } = await auth.supabase.storage
        .from('avatars')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: true,
        })

      if (uploadError) {
        console.error('[v0] Avatar upload error:', uploadError)
        return NextResponse.json(
          { error: 'Failed to upload avatar' },
          { status: 500 }
        )
      }

      // Get public URL
      const { data: urlData } = auth.supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const avatarUrl = urlData.publicUrl

      // Update user record
      const { error: updateError } = await auth.supabase
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', params.id)

      if (updateError) {
        console.error('[v0] Update user avatar error:', updateError)
        return NextResponse.json(
          { error: 'Failed to update user avatar' },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        avatarUrl,
        message: 'Avatar uploaded successfully' 
      })
    } catch (error) {
      console.error('[v0] Avatar upload error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)

export const DELETE = withAuthAndParams(
  async (
    request: NextRequest,
    auth,
    { params }: { params: { id: string } }
  ) => {
    try {
      // Verify user owns this resource (or is admin)
      const ownershipCheck = verifyCustomerOwnership(params.id, auth)
      if (ownershipCheck) return ownershipCheck

      const tenantId = requireTenantId(request)
      
      // Get current avatar URL
      const { data: user, error: userError } = await auth.supabase
        .from('users')
        .select('avatar_url')
        .eq('id', params.id)
        .single()

      if (userError || !user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // Delete from storage if exists
      if (user.avatar_url) {
        const urlParts = user.avatar_url.split('/')
        const fileName = urlParts[urlParts.length - 1]
        const filePath = `avatars/${fileName}`
        
        await auth.supabase.storage
          .from('avatars')
          .remove([filePath])
      }

      // Update user record
      const { error: updateError } = await auth.supabase
        .from('users')
        .update({ avatar_url: null })
        .eq('id', params.id)

      if (updateError) {
        console.error('[v0] Delete user avatar error:', updateError)
        return NextResponse.json(
          { error: 'Failed to remove avatar' },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        message: 'Avatar removed successfully' 
      })
    } catch (error) {
      console.error('[v0] Delete avatar error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)
