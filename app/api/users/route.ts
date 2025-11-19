import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/rbac'
import { handleApiError, ApiErrors, logError } from '@/lib/api/errors'

// List users (admin only)
export const GET = withAuth(
  { requireAdmin: true },
  async (request: NextRequest, auth) => {
    try {
      const { data, error } = await auth.supabase
        .from('users')
        .select('id, email, full_name, name, role, phone')
        .order('created_at', { ascending: false })

      if (error) {
        logError('users', error, { operation: 'list_users' })
        return ApiErrors.databaseError('Failed to load users')
      }

      const users = (data ?? []).map((u) => ({
        id: u.id,
        email: u.email,
        name: (u as any).name || (u as any).full_name,
        role: (u as any).role,
        phone: (u as any).phone || '',
      }))

      return NextResponse.json({ users })
    } catch (error) {
      return handleApiError('users', error, { operation: 'list_users' })
    }
  }
)

// Create user (admin only)
export const POST = withAuth(
  { requireAdmin: true },
  async (request: NextRequest, auth) => {
    try {
      const body = await request.json().catch(() => ({}))
      // Create/Upsert into public.users (expects an existing auth user id)
      const { data, error } = await auth.supabase
        .from('users')
        .insert(body)
        .select()
        .single()

      if (error) {
        logError('users', error, { operation: 'create_user' })
        return ApiErrors.databaseError('Failed to create user')
      }

      return NextResponse.json({ user: data, message: 'User created successfully' }, { status: 201 })
    } catch (error) {
      return handleApiError('users', error, { operation: 'create_user' })
    }
  }
)


