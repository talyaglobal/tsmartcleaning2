import { IntegrationConfig, WebhookResult } from './types';

export function getRingConfig(): IntegrationConfig {
	const enabled = process.env.RING_ENABLED === 'true';
	return {
		enabled,
		auth: { type: 'api_key', key: process.env.RING_API_KEY || '' },
		verificationSecret: process.env.RING_VERIFICATION_SECRET,
	};
}

export interface RingWebhookPayload {
	event: string;
	deviceId: string;
	timestamp: string;
	deviceType?: string;
	metadata?: Record<string, unknown>;
}

export async function handleRingWebhook(payload: RingWebhookPayload): Promise<WebhookResult> {
	// Placeholder: process Ring camera/doorbell events
	// In production, this would:
	// - Verify webhook signature
	// - Store event in database
	// - Trigger notifications if needed
	// - Update booking status if related to a cleaning appointment
	
	return {
		status: 'ok',
		message: `Ring ${payload.event} on ${payload.deviceId} at ${payload.timestamp}`,
	};
}

