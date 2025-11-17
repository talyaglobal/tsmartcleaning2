"use client";

import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { UserRole } from "@/lib/auth/roles";
import { RoleGate } from "@/components/auth/RoleGate";

export default function CompanyLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<RoleGate allow={UserRole.CLEANING_COMPANY}>
			<AdminLayout role={UserRole.CLEANING_COMPANY}>{children}</AdminLayout>
		</RoleGate>
	);
}


