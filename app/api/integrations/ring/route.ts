import { NextRequest, NextResponse } from 'next/server';
import { WebhookResult } from '@/lib/integrations/types';

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as { event?: string; deviceId?: string; timestamp?: string };
		if (!body?.event || !body?.deviceId || !body?.timestamp) {
			return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
		}
		const result: WebhookResult = {
			status: 'ok',
			message: `Ring ${body.event} on ${body.deviceId} at ${body.timestamp}`,
		};
		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
	}
}


