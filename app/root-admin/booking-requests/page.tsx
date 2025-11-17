import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";

export default function Page() {
	return (
		<>
			<PageHeader
				title="Booking Requests"
				subtitle="Track SLAs, escalations, and conversions."
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<span>Booking Requests</span>
					</div>
				}
			/>
			<p className="text-slate-600">Placeholder for booking requests SLA board.</p>
		</>
	);
}


