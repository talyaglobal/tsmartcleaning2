import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export type TeamProgressData = {
	volkan: { completed: number; total: number; percentage: number };
	ozgun: { completed: number; total: number; percentage: number };
	overall: { completed: number; total: number; percentage: number };
	overdue: number;
};

export function TeamTODOCompletion({ data }: { data: TeamProgressData }) {
	return (
		<div className="rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-6">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Team TODO Progress</h3>
				{data.overdue > 0 && (
					<Badge variant="destructive" className="text-xs">
						{data.overdue} overdue
					</Badge>
				)}
			</div>
			<div className="space-y-4">
				<div>
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm font-medium text-slate-700 dark:text-slate-300">Volkan (CEO/Founder)</span>
						<span className="text-sm text-slate-500 dark:text-slate-400">{data.volkan.percentage}%</span>
					</div>
					<Progress value={data.volkan.percentage} className="h-2" />
					<p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
						{data.volkan.completed} of {data.volkan.total} tasks completed
					</p>
				</div>
				<div>
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm font-medium text-slate-700 dark:text-slate-300">Özgün (CTO/Co-founder)</span>
						<span className="text-sm text-slate-500 dark:text-slate-400">{data.ozgun.percentage}%</span>
					</div>
					<Progress value={data.ozgun.percentage} className="h-2" />
					<p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
						{data.ozgun.completed} of {data.ozgun.total} tasks completed
					</p>
				</div>
				<div className="pt-3 border-t border-slate-100 dark:border-slate-700">
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Overall</span>
						<span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{data.overall.percentage}%</span>
					</div>
					<Progress value={data.overall.percentage} className="h-2" />
				</div>
			</div>
		</div>
	);
}

