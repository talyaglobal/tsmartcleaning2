import { BookingCommandPayload, VoiceResponse, IntegrationConfig } from './types';

export function getAlexaConfig(): IntegrationConfig {
	const enabled = process.env.ALEXA_ENABLED === 'true';
	return {
		enabled,
		auth: { type: 'none' },
		verificationSecret: process.env.ALEXA_VERIFICATION_SECRET,
	};
}

export async function handleAlexaIntent(payload: BookingCommandPayload): Promise<VoiceResponse> {
	switch (payload.intent) {
		case 'BOOK_CLEANER':
			return {
				say: 'Sure, I can help with that. What date and time should I book?',
				endSession: false,
			};
		case 'CANCEL_BOOKING':
			return { say: 'Please tell me which booking you want to cancel.', endSession: false };
		case 'CHECK_STATUS':
			return { say: 'Your next cleaning is scheduled for Tuesday at 10 AM.', endSession: true };
		default:
			return { say: "I didn't understand that. Please try again.", endSession: true };
	}
}


