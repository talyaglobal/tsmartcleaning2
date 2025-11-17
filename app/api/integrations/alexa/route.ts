import { NextRequest, NextResponse } from 'next/server';
import { handleAlexaIntent } from '@/lib/integrations/alexa';
import { BookingCommandPayload } from '@/lib/integrations/types';

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as Partial<BookingCommandPayload>;
		const payload: BookingCommandPayload = {
			intent: (body.intent as BookingCommandPayload['intent']) || 'BOOK_CLEANER',
			userId: body.userId,
			slots: body.slots || {},
			locale: body.locale || 'en-US',
		};
		const response = await handleAlexaIntent(payload);
		return NextResponse.json(response);
	} catch (error) {
		return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
	}
}


