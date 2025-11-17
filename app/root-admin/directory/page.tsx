import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";

export default function Page() {
	return (
		<>
			<PageHeader
				title="Directory"
				subtitle="Manage companies, reviews, and booking requests."
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<span>Directory</span>
					</div>
				}
			/>
			<p className="text-slate-600">Placeholder for directory admin.</p>
		</>
	);
}


