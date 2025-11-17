import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";

export default function Page() {
	return (
		<>
			<PageHeader
				title="System Settings"
				subtitle="Platform configuration and environment settings."
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<span>System Settings</span>
					</div>
				}
			/>
			<p className="text-slate-600">Placeholder for system settings.</p>
		</>
	);
}


