import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";

export default function Page() {
	return (
		<>
			<PageHeader
				title="Team Management"
				subtitle="Manage platform team members."
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<span>Team Management</span>
					</div>
				}
			/>
			<p className="text-slate-600">Placeholder for team management.</p>
		</>
	);
}


