import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";

export default function Page() {
	return (
		<>
			<PageHeader
				title="Financial Overview"
				subtitle="Revenue, costs, payouts, and more."
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<span>Financial Overview</span>
					</div>
				}
			/>
			<p className="text-slate-600">Placeholder for financial dashboards.</p>
		</>
	);
}


