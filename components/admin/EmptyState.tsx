import React from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
	title: string;
	description?: string;
	action?: React.ReactNode;
	secondaryAction?: React.ReactNode;
	icon?: React.ReactNode;
	className?: string;
	fullHeight?: boolean;
	compact?: boolean;
};

export function EmptyState({
	title,
	description,
	action,
	secondaryAction,
	icon,
	className,
	fullHeight = false,
	compact = false,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center text-center",
				compact ? "p-6" : "p-8",
				fullHeight ? "min-h-[40vh]" : undefined,
				className
			)}
			aria-live="polite"
		>
			{icon ? <div className="mb-3 text-slate-400">{icon}</div> : null}
			<h3 className="text-sm font-medium text-slate-900">{title}</h3>
			{description ? <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p> : null}
			{action || secondaryAction ? (
				<div className="mt-4 flex items-center gap-2">
					{action}
					{secondaryAction}
				</div>
			) : null}
		</div>
	);
}

export default EmptyState;


