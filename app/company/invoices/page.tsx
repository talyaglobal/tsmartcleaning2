import React from "react";
import { RequirePermission } from "@/components/auth/RequirePermission";

export default function CompanyInvoicesPage() {
	return (
		<RequirePermission permission="manage_invoices">
			<div className="space-y-4">
				<h1 className="text-xl font-semibold text-slate-900">Invoices & Payments</h1>
				<p className="text-sm text-slate-500">Review and manage company invoices and payments.</p>
				<div className="rounded-lg border border-slate-200 bg-white p-4">
					<p className="text-sm text-slate-600">Invoices table will appear here.</p>
				</div>
			</div>
		</RequirePermission>
	);
}


