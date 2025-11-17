import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";

export default function Page() {
	return (
		<>
			<PageHeader
				title="Notifications"
				subtitle="Templates, channels, throttling, and test sends."
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<span>Notifications</span>
					</div>
				}
			/>
			<p className="text-slate-600">Placeholder for notifications center.</p>
		</>
	);
}


