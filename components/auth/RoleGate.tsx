"use client";

import React from "react";
import { useAuth } from "./AuthProvider";
import { UserRole } from "@/lib/auth/roles";

export function RoleGate({ allow, children }: { allow: UserRole | UserRole[]; children: React.ReactNode }) {
	const { user, loading } = useAuth();
	const allowed = Array.isArray(allow) ? allow : [allow];

	if (loading) {
		return <div className="p-6 text-sm text-slate-500">Loading…</div>;
	}
	if (!user) {
		return <div className="p-6 text-sm text-red-600">You must be signed in.</div>;
	}
	if (!allowed.includes(user.role)) {
		return <div className="p-6 text-sm text-red-600">Access denied.</div>;
	}
	return <>{children}</>;
}


