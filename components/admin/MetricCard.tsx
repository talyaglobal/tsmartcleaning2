import React from "react";
import { cn } from "@/lib/utils";

type MetricCardProps = {
	title: string;
	value: string | number;
	change?: { value: number; positive?: boolean; label?: string };
	icon?: React.ReactNode;
	className?: string;
	subtitle?: string;
};

export function MetricCard({ title, value, change, icon, className, subtitle }: MetricCardProps) {
	const changeColor =
		change == null ? "" : change.value === 0 ? "text-slate-500" : change.positive ? "text-emerald-600" : "text-red-600";
	return (
		<div className={cn("rounded-lg border border-slate-200 bg-white p-4 shadow-sm", className)}>
			<div className="flex items-center justify-between">
				<div>
					<p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
					<p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
					{subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
				</div>
				{icon ? <div className="text-slate-400">{icon}</div> : null}
			</div>
			{change ? (
				<p className={`mt-3 text-xs ${changeColor}`}>
					{change.positive ? "▲" : change.value === 0 ? "■" : "▼"} {change.label || `${Math.abs(change.value)}%`}
				</p>
			) : null}
		</div>
	);
}


