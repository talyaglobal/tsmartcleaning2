import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const jobId = params.id
		const { providerId } = await request.json()

		if (!providerId) {
			return NextResponse.json({ error: 'providerId is required' }, { status: 400 })
		}

		// Here you would update the job record in DB to assign providerId
		// For MVP, return success echo
		return NextResponse.json({ success: true, jobId, providerId })
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Assignment failed' }, { status: 500 })
	}
}


