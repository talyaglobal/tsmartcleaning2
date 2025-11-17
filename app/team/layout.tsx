"use client";

import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { UserRole } from "@/lib/auth/roles";
import { RoleGate } from "@/components/auth/RoleGate";

export default function TeamLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<RoleGate allow={UserRole.TSMART_TEAM}>
			<AdminLayout role={UserRole.TSMART_TEAM}>{children}</AdminLayout>
		</RoleGate>
	);
}


