import { NextRequest, NextResponse } from 'next/server';
import { handleCameraAlert } from '@/lib/integrations/cameras';
import { CameraAlertPayload } from '@/lib/integrations/types';

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as CameraAlertPayload;
		if (!body) {
			return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
		}
		if (!body.cameraId || !body.event || !body.timestamp) {
			return NextResponse.json({ error: 'Missing required fields: cameraId, event, and timestamp are required' }, { status: 400 });
		}
		const result = await handleCameraAlert(body);
		return NextResponse.json(result);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Invalid request';
		return NextResponse.json({ error: errorMessage }, { status: 400 });
	}
}


