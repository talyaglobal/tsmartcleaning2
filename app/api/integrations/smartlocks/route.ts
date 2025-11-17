import { NextRequest, NextResponse } from 'next/server';
import { setAccessForSmartLock } from '@/lib/integrations/smartlocks';
import { SmartLockAccessRequest } from '@/lib/integrations/types';

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as SmartLockAccessRequest;
		if (!body || !body.lockId || typeof body.grant !== 'boolean' || !body.userId) {
			return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
		}
		const result = await setAccessForSmartLock(body);
		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
	}
}


