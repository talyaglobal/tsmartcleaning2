"use client";

import React from "react";
import { useAuth } from "./AuthProvider";
import { hasPermission } from "@/lib/auth/permissions";

export function RequirePermission({ permission, children }: { permission: string; children: React.ReactNode }) {
	const { user, loading } = useAuth();
	if (loading) {
		return <div className="p-6 text-sm text-slate-500">Loading…</div>;
	}
	if (!user) {
		return <div className="p-6 text-sm text-red-600">You must be signed in.</div>;
	}
	if (!hasPermission(user.role, permission)) {
		return <div className="p-6 text-sm text-red-600">You do not have permission.</div>;
	}
	return <>{children}</>;
}


