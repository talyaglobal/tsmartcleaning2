import React from "react";
import { RequirePermission } from "@/components/auth/RequirePermission";

export default function CompanyJobsPage() {
	return (
		<RequirePermission permission="assign_jobs">
			<div className="space-y-4">
				<h1 className="text-xl font-semibold text-slate-900">Job Assignments</h1>
				<p className="text-sm text-slate-500">Assign and manage jobs across your teams.</p>
				<div className="rounded-lg border border-slate-200 bg-white p-4">
					<p className="text-sm text-slate-600">Jobs table will appear here.</p>
				</div>
			</div>
		</RequirePermission>
	);
}


