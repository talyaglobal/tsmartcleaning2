"use client";

import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { UserRole } from "@/lib/auth/roles";
import { RoleGate } from "@/components/auth/RoleGate";

export default function AgencyLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<RoleGate allow={UserRole.NGO_AGENCY}>
			<AdminLayout role={UserRole.NGO_AGENCY}>{children}</AdminLayout>
		</RoleGate>
	);
}


