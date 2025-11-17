import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";

export default function Page() {
	return (
		<>
			<PageHeader
				title="Insurance"
				subtitle="Manage plans, pricing, and coverage limits."
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<span>Insurance</span>
					</div>
				}
			/>
			<p className="text-slate-600">Placeholder for insurance plans admin.</p>
		</>
	);
}


