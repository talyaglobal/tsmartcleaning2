"use client";

import React from "react";
import { Sidebar, roleToMenu } from "./Sidebar";
import { Header } from "./Header";
import { UserRole } from "@/lib/auth/roles";
import Link from "next/link";
import { cn } from "@/lib/utils";

type AdminLayoutProps = {
	children: React.ReactNode;
	title?: string;
	// In a real app this would come from session/user context
	role: UserRole;
};

export default function AdminLayout({ children, title, role }: AdminLayoutProps) {
	const [collapsed, setCollapsed] = React.useState(false);
	const items = roleToMenu(role).slice(0, 4);

	return (
		<div className="min-h-screen bg-slate-50 flex">
			<Sidebar role={role} collapsed={collapsed} />
			<div className="flex-1 min-w-0">
				<Header title={title} onToggleSidebar={() => setCollapsed((v) => !v)} />
				<main className="p-4 md:p-6">{children}</main>
				{/* Mobile bottom tab bar */}
				<nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200">
					<ul className="grid grid-cols-4">
						{items.map((item) => {
							const Icon = item.icon as any;
							return (
								<li key={item.path}>
									<Link href={item.path} className={cn("flex flex-col items-center justify-center py-2 text-[11px] text-slate-600")}>
										<Icon className="w-5 h-5 mb-0.5" />
										<span className="truncate max-w-[80px]">{item.name}</span>
									</Link>
								</li>
							);
						})}
					</ul>
				</nav>
			</div>
		</div>
	);
}


