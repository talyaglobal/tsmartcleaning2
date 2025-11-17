import { IntegrationConfig, VoiceResponse, BookingCommandPayload } from './types';

export function getHomeKitConfig(): IntegrationConfig {
	const enabled = process.env.HOMEKIT_ENABLED === 'true';
	return {
		enabled,
		auth: { type: 'none' },
		verificationSecret: process.env.HOMEKIT_VERIFICATION_SECRET,
	};
}

export async function handleHomeKitIntent(payload: BookingCommandPayload): Promise<VoiceResponse> {
	switch (payload.intent) {
		case 'BOOK_CLEANER':
			return { say: 'Booking request received. What time should the cleaner arrive?', endSession: false };
		case 'CANCEL_BOOKING':
			return { say: 'Tell me the booking to cancel.', endSession: false };
		case 'CHECK_STATUS':
			return { say: 'Your upcoming cleaning is confirmed for Monday morning.', endSession: true };
		default:
			return { say: 'Unhandled request.', endSession: true };
	}
}


