"use client";

import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { UserRole } from "@/lib/auth/roles";
import { RoleGate } from "@/components/auth/RoleGate";

export default function RootAdminLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<RoleGate allow={UserRole.ROOT_ADMIN}>
			<AdminLayout role={UserRole.ROOT_ADMIN}>{children}</AdminLayout>
		</RoleGate>
	);
}


