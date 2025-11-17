import { Bell, Menu } from "lucide-react";
import React from "react";

type HeaderProps = {
	title?: string;
	onToggleSidebar?: () => void;
};

export function Header({ title, onToggleSidebar }: HeaderProps) {
	return (
		<header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-10">
			<div className="h-full px-4 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={onToggleSidebar}
						className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-slate-200 hover:bg-slate-50"
						aria-label="Toggle sidebar"
					>
						<Menu className="w-5 h-5" />
					</button>
					<h1 className="text-sm md:text-base font-semibold text-slate-800">{title ?? "Dashboard"}</h1>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-slate-200 hover:bg-slate-50"
						aria-label="Notifications"
						title="Notifications"
					>
						<Bell className="w-5 h-5" />
					</button>
					<div className="w-8 h-8 rounded-full bg-slate-300" />
				</div>
			</div>
		</header>
	);
}


