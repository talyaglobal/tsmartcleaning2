import { CameraAlertPayload, IntegrationConfig, WebhookResult } from './types';

export function getCameraConfig(): IntegrationConfig {
	const enabled = process.env.CAMERAS_ENABLED === 'true';
	return {
		enabled,
		auth: { type: 'api_key', key: process.env.CAMERAS_API_KEY || '' },
		verificationSecret: process.env.CAMERAS_VERIFICATION_SECRET,
	};
}

export async function handleCameraAlert(payload: CameraAlertPayload): Promise<WebhookResult> {
	// Placeholder: normalize and enqueue alert for internal processing/notifications
	return {
		status: 'ok',
		message: `Received ${payload.event} from camera ${payload.cameraId} at ${payload.timestamp}`,
	};
}


