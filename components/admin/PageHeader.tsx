import React from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
	title: string;
	subtitle?: string;
	eyebrow?: string;
	breadcrumb?: React.ReactNode;
	tabs?: React.ReactNode;
	actions?: React.ReactNode;
	className?: string;
	children?: React.ReactNode;
	withBorder?: boolean;
};

export function PageHeader({
	title,
	subtitle,
	eyebrow,
	breadcrumb,
	tabs,
	actions,
	className,
	children,
	withBorder = false,
}: PageHeaderProps) {
	return (
		<div className={cn(withBorder ? "pb-4 md:pb-6 border-b border-slate-200" : "mb-4 md:mb-6", className)}>
			{breadcrumb ? <div className="mb-2 text-xs text-slate-500">{breadcrumb}</div> : null}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="min-w-0">
					{eyebrow ? <div className="text-[11px] uppercase tracking-wide text-slate-500">{eyebrow}</div> : null}
					<h1 className="truncate text-xl md:text-2xl font-semibold text-slate-900">{title}</h1>
					{subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
				</div>
				{actions ? <div className="shrink-0 flex gap-2">{actions}</div> : null}
			</div>
			{tabs ? <div className="mt-4">{tabs}</div> : null}
			{children ? <div className="mt-3">{children}</div> : null}
		</div>
	);
}

export default PageHeader;


