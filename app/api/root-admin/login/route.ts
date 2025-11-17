import { NextRequest, NextResponse } from "next/server";

function getClientIp(req: NextRequest): string | null {
	const xff = req.headers.get("x-forwarded-for");
	if (xff) {
		const parts = xff.split(",").map((s) => s.trim());
		if (parts.length > 0) return parts[0];
	}
	return req.headers.get("x-real-ip") || null;
}

export async function POST(req: NextRequest) {
	const { email, password } = await req.json();
	const allowEmail = process.env.ROOT_ADMIN_EMAIL ?? "admin@tsmartcleaning.com";
	const allowPass = process.env.ROOT_ADMIN_PASSWORD ?? "change-me";
	if (email !== allowEmail || password !== allowPass) {
		return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
	}
	// IP whitelist check
	const whitelistRaw = process.env.ROOT_ADMIN_IP_WHITELIST ?? "";
	const whitelist = whitelistRaw
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
	if (whitelist.length > 0) {
		const ip = getClientIp(req);
		if (!ip || !whitelist.includes(ip)) {
			// Still proceed to OTP, but mark as from non-whitelisted IP
			return NextResponse.json({ otpRequired: true, ipWhitelisted: false });
		}
	}
	return NextResponse.json({ otpRequired: true, ipWhitelisted: true });
}


