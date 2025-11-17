import { DeviceCommandResult, IntegrationConfig, ThermostatCommandPayload } from './types';

export function getThermostatConfig(): IntegrationConfig {
	const enabled = process.env.THERMOSTAT_ENABLED === 'true';
	return {
		enabled,
		auth: { type: 'oauth2', clientId: process.env.THERMOSTAT_CLIENT_ID || '', clientSecret: process.env.THERMOSTAT_CLIENT_SECRET || '' },
		verificationSecret: process.env.THERMOSTAT_VERIFICATION_SECRET,
	};
}

export async function setThermostat(payload: ThermostatCommandPayload): Promise<DeviceCommandResult> {
	// Placeholder: integrate with Nest, Ecobee, Honeywell, etc.
	const details = [
		`Device ${payload.deviceId}`,
		payload.mode ? `mode=${payload.mode}` : undefined,
		typeof payload.targetCelsius === 'number' ? `target=${payload.targetCelsius}C` : undefined,
		payload.holdUntil ? `holdUntil=${payload.holdUntil}` : undefined,
	]
		.filter(Boolean)
		.join(' ');
	return { success: true, details };
}


