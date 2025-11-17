import { BookingCommandPayload, VoiceResponse, IntegrationConfig } from './types';

export function getGoogleHomeConfig(): IntegrationConfig {
	const enabled = process.env.GOOGLE_HOME_ENABLED === 'true';
	return {
		enabled,
		auth: { type: 'none' },
		verificationSecret: process.env.GOOGLE_HOME_VERIFICATION_SECRET,
	};
}

export async function handleGoogleHomeIntent(payload: BookingCommandPayload): Promise<VoiceResponse> {
	switch (payload.intent) {
		case 'BOOK_CLEANER':
			return { say: 'Okay. What date and time would you like?', endSession: false };
		case 'CANCEL_BOOKING':
			return { say: 'Which booking should I cancel?', endSession: false };
		case 'CHECK_STATUS':
			return { say: 'You have one cleaning scheduled next Thursday at 2 PM.', endSession: true };
		default:
			return { say: 'Sorry, I missed that. Could you repeat?', endSession: true };
	}
}


