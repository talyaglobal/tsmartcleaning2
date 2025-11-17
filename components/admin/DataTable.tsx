import React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export type Column<T> = {
	key: keyof T | string;
	header: React.ReactNode;
	render?: (row: T) => React.ReactNode;
	className?: string;
	width?: string | number;
};

type DataTableProps<T> = {
	columns: Column<T>[];
	data: T[];
	getRowKey?: (row: T, index: number) => string | number;
	className?: string;
	emptyState?: React.ReactNode;
	loading?: boolean;
	density?: "comfortable" | "compact";
	stickyHeader?: boolean;
};

export function DataTable<T>({
	columns,
	data,
	getRowKey,
	className,
	emptyState,
	loading = false,
	density = "comfortable",
	stickyHeader = false,
}: DataTableProps<T>) {
	const cellPadding = density === "compact" ? "px-2 py-1.5" : "px-3 py-2";
	const headerPadding = density === "compact" ? "px-2 py-1.5" : "px-3 py-2";
	const showEmpty = !loading && data.length === 0;
	return (
		<div className={cn("overflow-x-auto rounded-lg border border-slate-200 bg-white", className)} role="region" aria-busy={loading}>
			<table className="min-w-full text-sm">
				<thead className={cn("bg-slate-50 text-slate-700", stickyHeader ? "sticky top-0 z-10" : undefined)}>
					<tr>
						{columns.map((col, idx) => (
							<th key={idx} className={cn(headerPadding, "text-left font-medium", col.className)} style={{ width: col.width }}>
								{col.header}
							</th>
						))}
					</tr>
				</thead>
				<tbody className="divide-y divide-slate-100">
					{loading ? (
						Array.from({ length: 5 }).map((_, i) => (
							<tr key={`skeleton-${i}`}>
								{columns.map((_, ci) => (
									<td key={ci} className={cn(cellPadding)}>
										<Skeleton className="h-4 w-full" />
									</td>
								))}
							</tr>
						))
					) : showEmpty ? (
						<tr>
							<td colSpan={columns.length} className="px-3 py-8 text-center text-slate-500">
								{emptyState ?? "No records found"}
							</td>
						</tr>
					) : (
						data.map((row, i) => (
							<tr key={getRowKey ? getRowKey(row, i) : i}>
								{columns.map((col, idx) => (
									<td key={idx} className={cn(cellPadding, "text-slate-700", col.className)}>
										{col.render ? col.render(row) : (row as any)[col.key]}
									</td>
								))}
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
}

export default DataTable;


