import { NextRequest, NextResponse } from 'next/server';
import { handleRingWebhook } from '@/lib/integrations/ring';
import { RingWebhookPayload } from '@/lib/integrations/ring';

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as RingWebhookPayload;
		if (!body) {
			return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
		}
		if (!body.event || !body.deviceId || !body.timestamp) {
			return NextResponse.json({ error: 'Missing required fields: event, deviceId, and timestamp are required' }, { status: 400 });
		}
		const result = await handleRingWebhook(body);
		return NextResponse.json(result);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Invalid request';
		return NextResponse.json({ error: errorMessage }, { status: 400 });
	}
}


