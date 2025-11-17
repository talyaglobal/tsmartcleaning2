const whatsmartappInstanceId = process.env.WHATSMARTAPP_INSTANCE_ID!
const whatsmartappApiKey = process.env.WHATSMARTAPP_API_KEY!
const whatsmartappBaseUrl = process.env.WHATSMARTAPP_BASE_URL || ''

export interface WhatsAppMessage {
	to: string // Format: whatsapp:+1234567890
	body: string
	mediaUrl?: string[]
}

export interface WhatsAppTemplate {
	name: string
	language: string
	components: Array<{
		type: string
		parameters: Array<{
			type: string
			text: string
		}>
	}>
}

export async function sendWhatsAppMessage(
	message: WhatsAppMessage,
	options?: { tenantId?: string }
): Promise<string> {
	try {
		if (!whatsmartappInstanceId || !whatsmartappApiKey) {
			throw new Error('Missing whatsmartapp credentials (WHATSMARTAPP_INSTANCE_ID / WHATSMARTAPP_API_KEY)')
		}

		// Extract digits for phone as expected by the API (e.g., 905xxxxxxxxx)
		const phone = message.to.replace(/\D/g, '')

		const endpoint = `${whatsmartappBaseUrl}/api/${whatsmartappInstanceId}/send`
		const res = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': whatsmartappApiKey,
			},
			body: JSON.stringify({
				phone,
				message: message.body,
			}),
		})

		if (!res.ok) {
			const text = await res.text()
			throw new Error(`WhatsApp send failed (${res.status}): ${text}`)
		}

		// Try to parse a response id, if provided; otherwise synthesize one
		let responseId = `sent-${Date.now()}`
		try {
			const data = await res.json()
			responseId = data?.id || data?.messageId || responseId
		} catch {
			// ignore JSON parse errors, some endpoints may return empty body
		}

		// Best-effort usage metering for messages
		if (options?.tenantId) {
			// Dynamic import to avoid circular deps at module init
			const { recordUsageEvent } = await import('@/lib/usage')
			recordUsageEvent({
				tenantId: options.tenantId,
				resource: 'message',
				quantity: 1,
				metadata: { channel: 'whatsapp', recipient: message.to },
			}).catch(() => {})
		}

		return responseId
	} catch (error: any) {
		console.error('WhatsApp send error:', error)
		throw error
	}
}

export async function sendWhatsAppTemplate(
	to: string,
	template: WhatsAppTemplate,
	options?: { tenantId?: string }
): Promise<string> {
	try {
		// Basic fallback: construct a readable message from the template definition.
		// If you later have a whatsmartapp templates feature, map it here.
		const body =
			`[${template.name} - ${template.language}] ` +
			(template.components
				?.map((c) => c.parameters?.map((p) => p.text).join(' '))
				?.filter(Boolean)
				?.join(' ') || '')

		return await sendWhatsAppMessage({ to, body }, options)
	} catch (error: any) {
		console.error('WhatsApp template send error:', error)
		throw error
	}
}

export async function sendBulkWhatsApp(
	messages: WhatsAppMessage[],
	delayMs: number = 1000
): Promise<Array<{ success: boolean; messageId?: string; error?: string; recipient: string }>> {
	const results: Array<{ success: boolean; messageId?: string; error?: string; recipient: string }> = []

	for (let i = 0; i < messages.length; i++) {
		const message = messages[i]
		try {
			const messageId = await sendWhatsAppMessage(message)
			results.push({
				success: true,
				messageId,
				recipient: message.to,
			})
		} catch (error: any) {
			results.push({
				success: false,
				error: error?.message ?? 'Unknown error',
				recipient: message.to,
			})
		}

		// Rate limiting delay
		if (delayMs > 0 && i < messages.length - 1) {
			// eslint-disable-next-line no-await-in-loop
			await new Promise((resolve) => setTimeout(resolve, delayMs))
		}
	}

	return results
}

// WhatsApp webhook handler for incoming messages
export function handleWhatsAppWebhook(webhookData: any) {
	// Attempt to normalize common fields from potential webhook payloads.
	// Adjust this mapping if whatsmartapp provides a webhook schema.
	const from = webhookData?.from || webhookData?.From || webhookData?.sender
	const to = webhookData?.to || webhookData?.To || webhookData?.receiver
	const body = webhookData?.message || webhookData?.Body || webhookData?.text
	const messageId = webhookData?.id || webhookData?.MessageSid || webhookData?.messageId
	const mediaUrl = webhookData?.mediaUrl || webhookData?.MediaUrl0

	return {
		from,
		to,
		body,
		messageId,
		mediaUrl,
		timestamp: new Date(),
	}
}

// Pre-approved WhatsApp message templates
export const whatsappTemplates = {
	booking_confirmation: {
		name: 'booking_confirmation',
		language: 'en',
		components: [
			{
				type: 'body',
				parameters: [
					{ type: 'text', text: '{{customer_name}}' },
					{ type: 'text', text: '{{service_date}}' },
					{ type: 'text', text: '{{service_time}}' },
					{ type: 'text', text: '{{provider_name}}' },
				],
			},
		],
	},
	payment_reminder: {
		name: 'payment_reminder',
		language: 'en',
		components: [
			{
				type: 'body',
				parameters: [
					{ type: 'text', text: '{{customer_name}}' },
					{ type: 'text', text: '{{amount_due}}' },
					{ type: 'text', text: '{{due_date}}' },
				],
			},
		],
	},
	service_reminder: {
		name: 'service_reminder',
		language: 'en',
		components: [
			{
				type: 'body',
				parameters: [
					{ type: 'text', text: '{{customer_name}}' },
					{ type: 'text', text: '{{service_time}}' },
					{ type: 'text', text: '{{provider_name}}' },
				],
			},
		],
	},
}


