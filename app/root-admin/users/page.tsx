import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import DataTable, { Column } from "@/components/admin/DataTable";

type UserRow = {
	id: string;
	email: string;
	name: string;
	role: string;
	phone: string;
};

async function loadUsers(): Promise<UserRow[]> {
	try {
		const res = await fetch(`${process.env.NEXT_PUBLIC_VERCEL_URL ? "https://" + process.env.NEXT_PUBLIC_VERCEL_URL : ""}/api/users`, {
			next: { revalidate: 60 },
		});
		if (!res.ok) throw new Error(`Failed to load users: ${res.status}`);
		const json = (await res.json()) as { users: UserRow[] };
		return json.users ?? [];
	} catch {
		return [];
	}
}

export default async function Page() {
	const users = await loadUsers();
	const columns: Column<UserRow>[] = [
		{ key: "email", header: "Email" },
		{ key: "name", header: "Name" },
		{ key: "role", header: "Role" },
		{ key: "phone", header: "Phone" },
	];
	return (
		<>
			<PageHeader
				title="Users"
				subtitle="List, roles, and access controls."
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<span>Users</span>
					</div>
				}
			/>
			<div className="mt-4">
				<DataTable<UserRow>
					columns={columns}
					data={users}
					getRowKey={(r) => r.id}
					density="comfortable"
					stickyHeader
				/>
			</div>
		</>
	);
}


