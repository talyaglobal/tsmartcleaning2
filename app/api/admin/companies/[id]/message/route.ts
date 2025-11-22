import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { withAuthAndParams } from '@/lib/auth/rbac'

export const POST = withAuthAndParams(
	async (request: NextRequest, { supabase: authSupabase, tenantId: authTenantId }, { params }: { params: { id: string } }) => {
	try {
		const { channel, subject, message, recipientEmail, recipientPhone } = await request.json()

		if (!channel || !message) {
			return NextResponse.json(
				{ error: 'channel and message are required' },
				{ status: 400 }
			)
		}

		const supabase = authSupabase || createServerSupabase()

		// Get company details
		const { data: company, error: companyError } = await supabase
			.from('companies')
			.select('id, name, email, phone')
			.eq('id', params.id)
			.single()

		if (companyError || !company) {
			return NextResponse.json(
				{ error: 'Company not found' },
				{ status: 404 }
			)
		}

		let result: { success: boolean; messageId?: string; error?: string }

		if (channel === 'email') {
			const email = recipientEmail || company.email
			if (!email) {
				return NextResponse.json(
					{ error: 'Company email not found and recipientEmail not provided' },
					{ status: 400 }
				)
			}

			// Send email via send-email API
			const emailRes = await fetch(`${request.nextUrl.origin}/api/send-email`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					to: email,
					subject: subject || `Message from TSmartCleaning Admin`,
					html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
					text: message,
				}),
			})

			const emailData = await emailRes.json()
			result = {
				success: emailRes.ok,
				messageId: emailData.messageId,
				error: emailRes.ok ? undefined : emailData.error || 'Failed to send email',
			}
		} else if (channel === 'whatsapp') {
			const phone = recipientPhone || company.phone
			if (!phone) {
				return NextResponse.json(
					{ error: 'Company phone not found and recipientPhone not provided' },
					{ status: 400 }
				)
			}

			try {
				const messageId = await sendWhatsAppMessage({
					to: phone,
					body: message,
				})
				result = { success: true, messageId }
			} catch (error: any) {
				result = { success: false, error: error.message || 'Failed to send WhatsApp message' }
			}
		} else {
			return NextResponse.json(
				{ error: 'Invalid channel. Use "email" or "whatsapp"' },
				{ status: 400 }
			)
		}

		// Log the communication (optional - could store in a messages/communications table)
		// This would help track admin communications with companies

		return NextResponse.json({
			success: result.success,
			messageId: result.messageId,
			message: result.success 
				? `Message sent successfully via ${channel}` 
				: result.error,
		})
	} catch (error) {
		console.error('[admin:companies:message] error:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
},
{
	requireAdmin: true,
}
)

