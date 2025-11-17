import { DeviceCommandResult, IntegrationConfig, SmartLockAccessRequest } from './types';

export function getSmartLockConfig(): IntegrationConfig {
	const enabled = process.env.SMARTLOCKS_ENABLED === 'true';
	return {
		enabled,
		auth: { type: 'api_key', key: process.env.SMARTLOCKS_API_KEY || '' },
		verificationSecret: process.env.SMARTLOCKS_VERIFICATION_SECRET,
	};
}

export async function setAccessForSmartLock(request: SmartLockAccessRequest): Promise<DeviceCommandResult> {
	// Placeholder: integrate with providers like August, Yale, Nuki, Level, etc.
	const action = request.grant ? 'granted' : 'revoked';
	return {
		success: true,
		details: `Access ${action} for lock ${request.lockId} ${request.validUntil ? `until ${request.validUntil}` : ''}`.trim(),
	};
}


