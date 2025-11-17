"use client";

import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { UserRole } from "@/lib/auth/roles";
import { RoleGate } from "@/components/auth/RoleGate";

export default function DayibasiLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<RoleGate allow={UserRole.DAYIBASI}>
			<AdminLayout role={UserRole.DAYIBASI}>{children}</AdminLayout>
		</RoleGate>
	);
}


