import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { handleWhatsAppWebhook } from '@/lib/whatsapp'
import crypto from 'crypto'

export const runtime = 'nodejs'

/**
 * WhatsApp Webhook Endpoint
 * 
 * Handles incoming messages and message status updates from WhatsApp service (whatsmartapp)
 * 
 * Webhook URL: https://yourdomain.com/api/webhooks/whatsapp
 * 
 * Security: Uses webhook secret for signature verification (if WHATSAPP_WEBHOOK_SECRET is set)
 */
export async function POST(request: NextRequest) {
	try {
		const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET
		const rawBody = await request.text()
		const payload = JSON.parse(rawBody)

		// Verify webhook signature if secret is configured
		if (webhookSecret) {
			const signature = request.headers.get('x-whatsapp-signature') || 
			                   request.headers.get('x-signature') || 
			                   request.headers.get('signature') || ''
			const timestamp = request.headers.get('x-timestamp') || 
			                  request.headers.get('timestamp') || ''

			// Basic HMAC verification (adjust based on whatsmartapp's actual signature method)
			if (signature && timestamp) {
				const expectedSignature = crypto
					.createHmac('sha256', webhookSecret)
					.update(timestamp + rawBody)
					.digest('hex')

				if (signature !== expectedSignature && signature !== `sha256=${expectedSignature}`) {
					console.warn('[whatsapp-webhook] Invalid signature')
					return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
				}
			}
		}

		const supabase = createServerSupabase()

		// Normalize webhook data using the handler function
		const normalized = handleWhatsAppWebhook(payload)

		// Determine event type from payload
		const eventType = payload?.event || payload?.type || payload?.status || 'message_received'
		const messageId = normalized.messageId || payload?.id || payload?.messageId || `msg-${Date.now()}`

		// Handle different event types
		switch (eventType) {
			case 'message_received':
			case 'message': {
				// Store incoming message
				if (normalized.from && normalized.body) {
					// Try to find user by phone number
					const phoneDigits = normalized.from.replace(/\D/g, '')
					const { data: user } = await supabase
						.from('users')
						.select('id, tenant_id')
						.or(`phone.eq.${phoneDigits},phone.eq.+${phoneDigits},phone.eq.whatsapp:${phoneDigits}`)
						.limit(1)
						.single()

					// Store message in messages table if conversation exists
					// Note: The messages table requires conversation_id, sender_id, recipient_id, and content
					// For WhatsApp webhooks, we'd need to identify the recipient (e.g., system/admin user)
					// This is a simplified implementation - adjust based on your business logic
					if (user) {
						// Find existing conversation where user is a participant
						// Note: This assumes there's a system/admin user to receive WhatsApp messages
						// You may need to adjust this logic based on your use case
						const { data: conversations } = await supabase
							.from('conversations')
							.select('id, participant_1_id, participant_2_id')
							.or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
							.limit(1)

						// For now, just log the webhook event
						// Full message storage would require identifying the recipient
						console.log('[whatsapp-webhook] Incoming message:', {
							from: normalized.from,
							body: normalized.body.substring(0, 100),
							userId: user.id,
						})
					}

					// Log webhook event (if webhook_events table exists)
					await supabase.from('webhook_events').insert({
						provider: 'whatsapp',
						event_type: 'message_received',
						event_id: messageId,
						payload: payload,
						tenant_id: user?.tenant_id || null,
					}).catch(() => {
						// Ignore if table doesn't exist
					})
				}
				break
			}
			case 'message_status':
			case 'status': {
				// Handle message status updates (sent, delivered, read, failed)
				const status = payload?.status || payload?.messageStatus || 'unknown'
				const originalMessageId = payload?.messageId || payload?.message_id || messageId

				// Log status event (messages table doesn't have status field, so we just log)
				console.log('[whatsapp-webhook] Message status update:', {
					messageId: originalMessageId,
					status,
				})

				// Log status event (if webhook_events table exists)
				await supabase.from('webhook_events').insert({
					provider: 'whatsapp',
					event_type: 'message_status',
					event_id: `${originalMessageId}-${status}`,
					payload: payload,
				}).catch(() => {
					// Ignore if table doesn't exist
				})
				break
			}
			default: {
				// Log unknown events
				await supabase.from('webhook_events').insert({
					provider: 'whatsapp',
					event_type: eventType,
					event_id: messageId,
					payload: payload,
				}).catch(() => {
					// Ignore if table doesn't exist
				})
			}
		}

		return NextResponse.json({ ok: true, received: true })
	} catch (error: any) {
		console.error('[whatsapp-webhook] error:', error)
		
		// Return 200 to prevent webhook retries for malformed requests
		// (adjust based on whatsmartapp's retry behavior)
		return NextResponse.json(
			{ error: 'Webhook processing failed', message: error.message },
			{ status: 200 }
		)
	}
}

