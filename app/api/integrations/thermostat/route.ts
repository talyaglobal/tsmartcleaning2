import { NextRequest, NextResponse } from 'next/server';
import { setThermostat } from '@/lib/integrations/thermostat';
import { ThermostatCommandPayload } from '@/lib/integrations/types';

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as ThermostatCommandPayload;
		if (!body) {
			return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
		}
		if (!body.deviceId) {
			return NextResponse.json({ error: 'Missing required field: deviceId' }, { status: 400 });
		}
		const result = await setThermostat(body);
		return NextResponse.json(result);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Invalid request';
		return NextResponse.json({ error: errorMessage }, { status: 400 });
	}
}


