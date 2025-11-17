import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";

export default function Page() {
	return (
		<>
			<PageHeader
				title="Claims"
				subtitle="Triage, review, approve/deny, and payout."
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<span>Claims</span>
					</div>
				}
			/>
			<p className="text-slate-600">Placeholder for insurance claims management.</p>
		</>
	);
}


