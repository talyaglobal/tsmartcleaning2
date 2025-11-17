"use client";

import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { UserRole } from "@/lib/auth/roles";
import { RoleGate } from "@/components/auth/RoleGate";

export default function CleanerLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<RoleGate allow={UserRole.CLEANING_LADY}>
			<AdminLayout role={UserRole.CLEANING_LADY}>{children}</AdminLayout>
		</RoleGate>
	);
}


