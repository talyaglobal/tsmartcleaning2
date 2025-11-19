import { NextRequest, NextResponse } from "next/server";
import { setRootAdminSessionCookie } from "@/lib/auth/root-admin-session";
import { verifyTOTP, checkRateLimit, recordFailedAttempt } from "@/lib/auth/root-admin-otp";

export async function POST(req: NextRequest) {
	try {
		const { email, otp } = await req.json();
		const allowEmail = process.env.ROOT_ADMIN_EMAIL ?? "admin@tsmartcleaning.com";
		
		if (email !== allowEmail) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		
		// Check rate limiting
		const rateLimit = checkRateLimit(req, email);
		if (!rateLimit.allowed) {
			const retryAfter = rateLimit.retryAfter || 900; // Default to 15 minutes
			return NextResponse.json(
				{ 
					error: "Too many attempts. Please try again later.",
					retryAfter 
				},
				{ 
					status: 429,
					headers: {
						'Retry-After': retryAfter.toString()
					}
				}
			);
		}
		
		// Validate OTP format
		if (!otp || typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
			recordFailedAttempt(req, email);
			return NextResponse.json({ error: "Invalid code format" }, { status: 400 });
		}
		
		// Verify TOTP code
		const isValid = await verifyTOTP(otp);
		if (!isValid) {
			recordFailedAttempt(req, email);
			return NextResponse.json({ error: "Invalid code" }, { status: 401 });
		}
		
		// Create signed session token
		const res = NextResponse.json({ ok: true });
		await setRootAdminSessionCookie(res, email, req);
		
		return res;
	} catch (error) {
		console.error("[root-admin] OTP verification error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}


