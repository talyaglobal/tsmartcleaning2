"use client";

import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { UserRole } from "@/lib/auth/roles";
import { RoleGate } from "@/components/auth/RoleGate";

export default function PartnerLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<RoleGate allow={UserRole.PARTNER_ADMIN}>
			<AdminLayout role={UserRole.PARTNER_ADMIN}>{children}</AdminLayout>
		</RoleGate>
	);
}



