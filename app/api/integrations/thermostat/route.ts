import { NextRequest, NextResponse } from 'next/server';
import { setThermostat } from '@/lib/integrations/thermostat';
import { ThermostatCommandPayload } from '@/lib/integrations/types';

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as ThermostatCommandPayload;
		if (!body || !body.deviceId) {
			return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 });
		}
		const result = await setThermostat(body);
		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
	}
}


