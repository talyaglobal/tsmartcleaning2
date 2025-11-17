import React from "react";
import { cn } from "@/lib/utils";

type Status = "active" | "inactive" | "pending" | "completed" | "cancelled";

type StatusBadgeProps = {
	status: Status;
	className?: string;
	children?: React.ReactNode;
	withDot?: boolean;
	title?: string;
};

const statusToClasses: Record<Status, string> = {
	active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
	inactive: "bg-slate-50 text-slate-700 ring-slate-600/20",
	pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
	completed: "bg-blue-50 text-blue-700 ring-blue-600/20",
	cancelled: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

export function StatusBadge({ status, className, children, withDot = false, title }: StatusBadgeProps) {
	const text = children ?? status[0].toUpperCase() + status.slice(1);
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
				statusToClasses[status],
				className
			)}
			aria-label={`Status: ${text}`}
			title={title}
		>
			{withDot ? <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current" /> : null}
			{text}
		</span>
	);
}

export default StatusBadge;


