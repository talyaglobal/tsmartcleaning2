import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import crypto from 'node:crypto'

export const runtime = 'nodejs'

async function sendEmailViaApi(request: NextRequest, payload: { to: string; subject: string; html: string }) {
	const tenantId = resolveTenantFromRequest(request) || ''
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
	try {
		await fetch(`${baseUrl}/api/send-email`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-tenant-id': tenantId,
			},
			body: JSON.stringify(payload),
		})
	} catch (error) {
		console.error('[ngo/register] Email send failed:', error)
		// Non-fatal: continue even if email fails
	}
}

export async function POST(req: NextRequest) {
	try {
		const contentType = req.headers.get('content-type') || ''
		if (!contentType.includes('multipart/form-data')) {
			return NextResponse.json({ message: 'Expected multipart/form-data' }, { status: 400 })
		}

		const form = await req.formData()
		const payloadRaw = form.get('payload')
		if (!payloadRaw || typeof payloadRaw !== 'string') {
			return NextResponse.json({ message: 'Invalid payload' }, { status: 400 })
		}

		const payload = JSON.parse(payloadRaw)
		const applicationId = `ngo_${crypto.randomUUID()}`
		const nowIso = new Date().toISOString()

		const supabase = createServerSupabase()

		// Upload helper
		const uploadFile = async (key: string, fileField: string | null) => {
			if (!fileField) return null
			const f = form.get(fileField)
			if (!(f instanceof File)) return null
			const buf = Buffer.from(await f.arrayBuffer())
			const path = `${applicationId}/${key}-${Date.now()}.${(f.name.split('.').pop() || 'bin')}`
			const { error } = await supabase.storage.from('ngo-docs').upload(path, buf, {
				contentType: f.type || 'application/octet-stream',
				upsert: false,
			})
			if (error) {
				// Non-fatal: continue without file
				return null
			}
			const { data: publicUrl } = supabase.storage.from('ngo-docs').getPublicUrl(path)
			return { path, url: publicUrl.publicUrl }
		}

		const files = {
			nonProfitDoc: await uploadFile('nonProfitDoc', 'nonProfitDoc'),
			businessLicense: await uploadFile('businessLicense', 'businessLicense'),
			insuranceProof: await uploadFile('insuranceProof', 'insuranceProof'),
			boardList: await uploadFile('boardList', 'boardList'),
			annualReport: await uploadFile('annualReport', 'annualReport'),
		}

		const record = {
			application_id: applicationId,
			status: 'submitted',
			created_at: nowIso,
			updated_at: nowIso,
			section1: payload.section1,
			section2: payload.section2,
			section3: { ...payload.section3, files },
			section4: payload.section4,
		}

		const { error: insertError } = await supabase.from('ngo_applications').insert(record as never)
		if (insertError) {
			return NextResponse.json({ message: 'Failed to save application' }, { status: 500 })
		}

		// Send confirmation email to applicant
		const primaryEmail = payload.section2?.primaryEmail
		const organizationName = payload.section1?.organizationLegalName || 'Your Organization'
		const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''

		if (primaryEmail) {
			const confirmationHtml = `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>NGO Registration Confirmation</title>
				</head>
				<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
					<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
						<h1 style="color: white; margin: 0;">Thank You for Your Application!</h1>
					</div>
					<div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
						<p>Dear ${payload.section2?.primaryContactName || 'Valued Partner'},</p>
						<p>We have successfully received your NGO/Agency partnership application for <strong>${organizationName}</strong>.</p>
						<div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
							<p style="margin: 0;"><strong>Application ID:</strong> ${applicationId}</p>
							<p style="margin: 10px 0 0 0;"><strong>Status:</strong> Submitted for Review</p>
						</div>
						<p>Our team will review your application and get back to you within 5-7 business days. We may contact you if we need any additional information.</p>
						<p><strong>What happens next?</strong></p>
						<ul>
							<li>Our partnership team will review your application</li>
							<li>We may reach out for clarification or additional documents</li>
							<li>You'll receive an email notification once a decision has been made</li>
						</ul>
						<p>If you have any questions, please don't hesitate to contact us.</p>
						<p>Best regards,<br><strong>The TSmartCleaning Partnership Team</strong></p>
						<hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
						<p style="font-size: 12px; color: #666; text-align: center;">
							This is an automated confirmation email. Please do not reply to this message.
						</p>
					</div>
				</body>
				</html>
			`

			await sendEmailViaApi(req, {
				to: primaryEmail,
				subject: `NGO Partnership Application Received - ${applicationId}`,
				html: confirmationHtml,
			})
		}

		// Send admin notification
		const adminEmail = process.env.ROOT_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@tsmartcleaning.com'
		const adminHtml = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>New NGO Application</title>
			</head>
			<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
				<div style="background: #dc2626; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
					<h1 style="color: white; margin: 0;">New NGO Partnership Application</h1>
				</div>
				<div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
					<p>A new NGO/Agency partnership application has been submitted and requires review.</p>
					<div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc2626;">
						<p style="margin: 0;"><strong>Application ID:</strong> ${applicationId}</p>
						<p style="margin: 10px 0 0 0;"><strong>Organization:</strong> ${organizationName}</p>
						<p style="margin: 10px 0 0 0;"><strong>Contact:</strong> ${payload.section2?.primaryContactName || 'N/A'} (${primaryEmail || 'N/A'})</p>
						<p style="margin: 10px 0 0 0;"><strong>Organization Type:</strong> ${payload.section1?.organizationType || 'N/A'}</p>
						<p style="margin: 10px 0 0 0;"><strong>Submitted:</strong> ${new Date(nowIso).toLocaleString()}</p>
					</div>
					<p><strong>Application Details:</strong></p>
					<ul>
						<li><strong>Primary Country:</strong> ${payload.section1?.primaryCountry || 'N/A'}</li>
						<li><strong>Operation Regions:</strong> ${(payload.section1?.operationRegions || []).join(', ') || 'N/A'}</li>
						<li><strong>Primary Contact:</strong> ${payload.section2?.primaryContactName || 'N/A'} - ${payload.section2?.primaryContactTitle || 'N/A'}</li>
						<li><strong>Email:</strong> ${primaryEmail || 'N/A'}</li>
						<li><strong>Phone:</strong> ${payload.section2?.primaryPhone || 'N/A'}</li>
					</ul>
					<p style="margin-top: 30px;">
						<a href="${baseUrl}/admin/ngo-applications/${applicationId}" 
						   style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
							Review Application
						</a>
					</p>
				</div>
			</body>
			</html>
		`

		await sendEmailViaApi(req, {
			to: adminEmail,
			subject: `[Action Required] New NGO Application: ${organizationName} - ${applicationId}`,
			html: adminHtml,
		})

		return NextResponse.json({ ok: true, applicationId })
	} catch (e: any) {
		return NextResponse.json({ message: e?.message || 'Server error' }, { status: 500 })
	}
}


