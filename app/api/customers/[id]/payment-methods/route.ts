import { NextRequest, NextResponse } from 'next/server'
import { requireTenantId } from '@/lib/tenant'
import { withAuthAndParams, verifyCustomerOwnership } from '@/lib/auth/rbac'

export const GET = withAuthAndParams(
  async (
    request: NextRequest,
    auth,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      // Verify user owns this resource (or is admin)
      const ownershipCheck = verifyCustomerOwnership(params.id, auth)
      if (ownershipCheck) return ownershipCheck

      const tenantId = requireTenantId(request)
      
      const { data: paymentMethods, error } = await auth.supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', params.id)
        .eq('tenant_id', tenantId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[v0] Get customer payment methods error:', error)
        return NextResponse.json({ error: 'Failed to load payment methods' }, { status: 500 })
      }

      return NextResponse.json({ paymentMethods: paymentMethods || [] })
    } catch (error) {
      console.error('[v0] Get customer payment methods error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)

export const POST = withAuthAndParams(
  async (
    request: NextRequest,
    auth,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      // Verify user owns this resource (or is admin)
      const ownershipCheck = verifyCustomerOwnership(params.id, auth)
      if (ownershipCheck) return ownershipCheck

      const tenantId = requireTenantId(request)
      const body = await request.json()
      const { type, last4, brand, expiry_month, expiry_year, is_default, stripe_payment_method_id } = body

      if (!type || !last4 || !stripe_payment_method_id) {
        return NextResponse.json(
          { error: 'Missing required payment method fields' },
          { status: 400 }
        )
      }
      
      // If this is set as default, unset other defaults
      if (is_default) {
        await auth.supabase
          .from('payment_methods')
          .update({ is_default: false })
          .eq('user_id', params.id)
          .eq('tenant_id', tenantId)
      }

      const { data, error } = await auth.supabase
        .from('payment_methods')
        .insert({
          tenant_id: tenantId,
          user_id: params.id,
          type,
          last4,
          brand: brand || null,
          expiry_month: expiry_month || null,
          expiry_year: expiry_year || null,
          is_default: is_default || false,
          stripe_payment_method_id,
        })
        .select()
        .single()

      if (error) {
        console.error('[v0] Create customer payment method error:', error)
        return NextResponse.json({ error: 'Failed to add payment method' }, { status: 500 })
      }

      return NextResponse.json({ paymentMethod: data, message: 'Payment method added successfully' })
    } catch (error) {
      console.error('[v0] Create customer payment method error:', error)
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
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      // Verify user owns this resource (or is admin)
      const ownershipCheck = verifyCustomerOwnership(params.id, auth)
      if (ownershipCheck) return ownershipCheck

      const tenantId = requireTenantId(request)
      const { searchParams } = new URL(request.url)
      const paymentMethodId = searchParams.get('paymentMethodId')
      
      if (!paymentMethodId) {
        return NextResponse.json(
          { error: 'paymentMethodId is required' },
          { status: 400 }
        )
      }
    
      const { error } = await auth.supabase
        .from('payment_methods')
        .delete()
        .eq('id', paymentMethodId)
        .eq('user_id', params.id)
        .eq('tenant_id', tenantId)

      if (error) {
        console.error('[v0] Delete customer payment method error:', error)
        return NextResponse.json({ error: 'Failed to delete payment method' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Payment method deleted successfully' })
    } catch (error) {
      console.error('[v0] Delete customer payment method error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)
