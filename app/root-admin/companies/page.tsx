import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";

export default function Page() {
	return (
		<>
			<PageHeader
				title="Companies"
				subtitle="Approve, verify, and manage company profiles."
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<span>Companies</span>
					</div>
				}
			/>
			<p className="text-slate-600">Placeholder for companies management.</p>
		</>
	);
}


