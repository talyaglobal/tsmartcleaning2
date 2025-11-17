import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";

export default function Page() {
	return (
		<>
			<PageHeader
				title="Reviews"
				subtitle="Moderate and resolve review flags and disputes."
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<span>Reviews</span>
					</div>
				}
			/>
			<p className="text-slate-600">Placeholder for reviews moderation.</p>
		</>
	);
}


