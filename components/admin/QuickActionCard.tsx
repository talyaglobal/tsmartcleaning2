import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type QuickActionCardProps = {
	title: string;
	description?: string;
	href?: string;
	onClick?: () => void;
	icon?: React.ReactNode;
	className?: string;
};

export function QuickActionCard({ title, description, href, onClick, icon, className }: QuickActionCardProps) {
	const content = (
		<div className={cn("group rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow", className)}>
			<div className="flex items-center gap-3">
				{icon ? <div className="text-slate-500 group-hover:text-slate-700">{icon}</div> : null}
				<div>
					<p className="text-sm font-medium text-slate-900">{title}</p>
					{description ? <p className="text-xs text-slate-500 mt-0.5">{description}</p> : null}
				</div>
			</div>
		</div>
	);

	if (href) {
		return <Link href={href}>{content}</Link>;
	}
	return <button type="button" onClick={onClick} className="text-left w-full">{content}</button>;
}

export default QuickActionCard;


