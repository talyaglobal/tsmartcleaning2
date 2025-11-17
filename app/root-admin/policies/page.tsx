import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";

export default function Page() {
	return (
		<>
			<PageHeader
				title="Policies"
				subtitle="Search, manage status, and resend certificates."
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<span>Policies</span>
					</div>
				}
			/>
			<p className="text-slate-600">Placeholder for insurance policies management.</p>
		</>
	);
}


