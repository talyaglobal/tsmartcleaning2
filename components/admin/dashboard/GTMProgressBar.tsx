import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export type GTMProgressData = {
	currentPhase: string;
	overallProgress: number;
	nextMilestone: string;
	daysRemaining: number;
};

export function GTMProgressBar({ data }: { data: GTMProgressData }) {
	return (
		<div className="rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-6">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">GTM Strategy Progress</h3>
				<Badge variant="outline" className="text-xs">
					{data.daysRemaining} days remaining
				</Badge>
			</div>
			<div className="space-y-3">
				<div>
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm font-medium text-slate-700 dark:text-slate-300">{data.currentPhase}</span>
						<span className="text-sm text-slate-500 dark:text-slate-400">{data.overallProgress}%</span>
					</div>
					<Progress value={data.overallProgress} className="h-2" />
				</div>
				<div className="pt-2 border-t border-slate-100 dark:border-slate-700">
					<p className="text-xs text-slate-500 dark:text-slate-400">
						Next milestone: <span className="font-medium text-slate-700 dark:text-slate-300">{data.nextMilestone}</span>
					</p>
				</div>
			</div>
		</div>
	);
}

