export type ProviderAuth =
	| { type: 'oauth2'; clientId: string; clientSecret: string; redirectUri?: string }
	| { type: 'api_key'; key: string }
	| { type: 'jwt'; issuer: string; secret: string }
	| { type: 'none' };

export interface IntegrationConfig {
	enabled: boolean;
	auth: ProviderAuth;
	verificationSecret?: string;
}

export interface BookingCommandPayload {
	userId?: string;
	intent: 'BOOK_CLEANER' | 'CANCEL_BOOKING' | 'CHECK_STATUS';
	slots?: Record<string, string | number | boolean>;
	locale?: string;
}

export interface WebhookResult {
	status: 'ok' | 'ignored' | 'error';
	message?: string;
}

export interface DeviceCommandResult {
	success: boolean;
	details?: string;
}

export interface SmartLockAccessRequest {
	lockId: string;
	grant: boolean;
	userId: string;
	bookingId?: string;
	validFrom?: string; // ISO
	validUntil?: string; // ISO
}

export interface CameraAlertPayload {
	cameraId: string;
	event: 'MOTION' | 'PERSON' | 'PACKAGE' | 'DOORBELL';
	timestamp: string; // ISO
	imageUrl?: string;
	metadata?: Record<string, unknown>;
}

export interface ThermostatCommandPayload {
	deviceId: string;
	mode?: 'heat' | 'cool' | 'heat_cool' | 'off';
	targetCelsius?: number;
	holdUntil?: string; // ISO
}

export type NormalizedRequestSignature = {
	rawBody: string;
	signatureHeader?: string;
	timestampHeader?: string;
};

export type SignatureVerifier = (input: NormalizedRequestSignature, secret: string) => boolean;

export type Locale = string;

export interface VoiceResponse {
	say: string;
	cardTitle?: string;
	cardText?: string;
	endSession?: boolean;
}


