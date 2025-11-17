import React from "react";
import { cn } from "@/lib/utils";

type LoadingSpinnerProps = {
	className?: string;
	size?: "sm" | "md" | "lg";
	label?: string;
	inline?: boolean;
};

const sizeMap = {
	sm: "h-4 w-4",
	md: "h-5 w-5",
	lg: "h-6 w-6",
} as const;

export function LoadingSpinner({ className, size = "md", label, inline = false }: LoadingSpinnerProps) {
	return (
		<div className={cn(inline ? "inline-flex items-center gap-2" : "flex items-center justify-center p-6", className)}>
			<svg className={cn("animate-spin text-slate-500", sizeMap[size])} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-label={label ?? "Loading"}>
				<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
				<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
			</svg>
			{label ? <span className="text-sm text-slate-500">{label}</span> : null}
		</div>
	);
}

export default LoadingSpinner;


