import { NextRequest, NextResponse } from 'next/server';
import { setAccessForSmartLock } from '@/lib/integrations/smartlocks';
import { SmartLockAccessRequest } from '@/lib/integrations/types';

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as SmartLockAccessRequest;
		if (!body) {
			return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
		}
		if (!body.lockId || typeof body.grant !== 'boolean' || !body.userId) {
			return NextResponse.json({ error: 'Missing required fields: lockId, grant, and userId are required' }, { status: 400 });
		}
		const result = await setAccessForSmartLock(body);
		return NextResponse.json(result);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Invalid request';
		return NextResponse.json({ error: errorMessage }, { status: 400 });
	}
}


