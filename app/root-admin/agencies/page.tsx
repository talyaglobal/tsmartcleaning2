import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";

export default function Page() {
	return (
		<>
			<PageHeader
				title="NGO/Agencies"
				subtitle="Manage partner agencies and NGOs."
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<span>NGO/Agencies</span>
					</div>
				}
			/>
			<p className="text-slate-600">Placeholder for agencies management.</p>
		</>
	);
}


