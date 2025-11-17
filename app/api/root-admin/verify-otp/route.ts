import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	const { email, otp } = await req.json();
	const allowEmail = process.env.ROOT_ADMIN_EMAIL ?? "admin@tsmartcleaning.com";
	const validOtp = process.env.ROOT_ADMIN_OTP ?? "123456";
	if (email !== allowEmail) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	if (otp !== validOtp) {
		return NextResponse.json({ error: "Invalid code" }, { status: 401 });
	}
	// Establish a simple root-admin session via httpOnly cookie.
	// Note: This is a minimal placeholder and should be replaced with a proper signed token/session.
	const res = NextResponse.json({ ok: true });
	res.cookies.set("root_admin", "1", {
		httpOnly: true,
		path: "/",
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		maxAge: 60 * 60, // 1 hour
	});
	return res;
}


