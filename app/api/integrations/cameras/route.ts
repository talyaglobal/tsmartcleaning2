import { NextRequest, NextResponse } from 'next/server';
import { handleCameraAlert } from '@/lib/integrations/cameras';
import { CameraAlertPayload } from '@/lib/integrations/types';

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as CameraAlertPayload;
		if (!body || !body.cameraId || !body.event || !body.timestamp) {
			return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
		}
		const result = await handleCameraAlert(body);
		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
	}
}


