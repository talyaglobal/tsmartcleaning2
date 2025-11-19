import { NextRequest, NextResponse } from 'next/server';
import { handleHomeKitIntent } from '@/lib/integrations/homekit';
import { BookingCommandPayload } from '@/lib/integrations/types';

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as Partial<BookingCommandPayload>;
		if (!body) {
			return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
		}
		const payload: BookingCommandPayload = {
			intent: (body.intent as BookingCommandPayload['intent']) || 'BOOK_CLEANER',
			userId: body.userId,
			slots: body.slots || {},
			locale: body.locale || 'en-US',
		};
		const response = await handleHomeKitIntent(payload);
		return NextResponse.json(response);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Invalid request';
		return NextResponse.json({ error: errorMessage }, { status: 400 });
	}
}


