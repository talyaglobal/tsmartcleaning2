"use client"

import React from "react";
import { useRouter } from "next/navigation";

export default function RootAdminLoginPage() {
	const router = useRouter();
	const [step, setStep] = React.useState<"creds" | "otp">("creds");
	const [email, setEmail] = React.useState("");
	const [password, setPassword] = React.useState("");
	const [otp, setOtp] = React.useState("");
	const [error, setError] = React.useState<string | null>(null);
	const [loading, setLoading] = React.useState(false);

	async function handleCredsSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			const res = await fetch("/api/root-admin/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error ?? "Login failed");
			setStep("otp");
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}

	async function handleOtpSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			const res = await fetch("/api/root-admin/verify-otp", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, otp }),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error ?? "OTP verification failed");
			router.push("/root-admin");
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-[60vh] flex items-center justify-center px-4">
			<div className="w-full max-w-sm border border-slate-200 rounded-lg p-6 bg-white shadow-sm">
				<h1 className="text-lg font-semibold mb-1">Root Admin Login</h1>
				<p className="text-sm text-slate-500 mb-6">Restricted area. Authorized personnel only.</p>
				{error ? <div className="mb-3 text-sm text-red-600">{error}</div> : null}
				{step === "creds" ? (
					<form className="space-y-3" onSubmit={handleCredsSubmit}>
						<div className="space-y-1.5">
							<label htmlFor="email" className="text-sm font-medium">
								Email
							</label>
							<input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
								placeholder="admin@tsmartcleaning.com"
								required
							/>
						</div>
						<div className="space-y-1.5">
							<label htmlFor="password" className="text-sm font-medium">
								Password
							</label>
							<input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
								placeholder="••••••••"
								required
							/>
						</div>
						<button
							type="submit"
							disabled={loading}
							className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-md px-3 py-2 text-sm font-medium transition-colors"
						>
							{loading ? "Signing in…" : "Sign in"}
						</button>
						<p className="text-[11px] text-slate-500">IP whitelist and 2FA enforced.</p>
					</form>
				) : (
					<form className="space-y-3" onSubmit={handleOtpSubmit}>
						<div className="space-y-1.5">
							<label htmlFor="otp" className="text-sm font-medium">
								One-Time Code
							</label>
							<input
								id="otp"
								type="text"
								inputMode="numeric"
								pattern="[0-9]*"
								value={otp}
								onChange={(e) => setOtp(e.target.value)}
								className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm tracking-widest"
								placeholder="123456"
								required
							/>
						</div>
						<button
							type="submit"
							disabled={loading}
							className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-md px-3 py-2 text-sm font-medium transition-colors"
						>
							{loading ? "Verifying…" : "Verify & Continue"}
						</button>
						<p className="text-[11px] text-slate-500">Use the code sent to your secure channel.</p>
					</form>
				)}
			</div>
		</div>
	);
}


