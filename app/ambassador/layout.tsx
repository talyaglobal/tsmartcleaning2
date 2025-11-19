"use client";

import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { UserRole } from "@/lib/auth/roles";
import { RoleGate } from "@/components/auth/RoleGate";

export default function AmbassadorLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<RoleGate allow={UserRole.AMBASSADOR}>
			<AdminLayout role={UserRole.AMBASSADOR}>{children}</AdminLayout>
		</RoleGate>
	);
}

