import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function PATCH(
	request: NextRequest,
	{ params }: { params: { id: string; methodId: string } }
) {
	try {
		const body = await request.json()
		const { is_default, status } = body

		const supabase = createServerSupabase()
		const updateData: any = {}
		
		if (is_default !== undefined) {
			updateData.is_default = is_default
			// If setting as default, unset other defaults
			if (is_default) {
				await supabase
					.from('company_payment_methods')
					.update({ is_default: false })
					.eq('company_id', params.id)
					.neq('id', params.methodId)
			}
		}
		if (status !== undefined) updateData.status = status

		const { data, error } = await supabase
			.from('company_payment_methods')
			.update(updateData)
			.eq('id', params.methodId)
			.eq('company_id', params.id)
			.select()
			.single()

		if (error) {
			console.error('[v0] Company payment method PATCH error:', error)
			return NextResponse.json({ error: 'Failed to update payment method' }, { status: 500 })
		}

		return NextResponse.json({ payment_method: data })
	} catch (error) {
		console.error('[v0] Company payment method PATCH error:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: { id: string; methodId: string } }
) {
	try {
		const supabase = createServerSupabase()
		const { error } = await supabase
			.from('company_payment_methods')
			.delete()
			.eq('id', params.methodId)
			.eq('company_id', params.id)

		if (error) {
			console.error('[v0] Company payment method DELETE error:', error)
			return NextResponse.json({ error: 'Failed to delete payment method' }, { status: 500 })
		}

		return NextResponse.json({ message: 'Payment method deleted successfully' })
	} catch (error) {
		console.error('[v0] Company payment method DELETE error:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

