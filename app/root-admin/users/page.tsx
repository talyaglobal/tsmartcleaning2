"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import DataTable, { Column } from "@/components/admin/DataTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, UserCog, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type UserRow = {
	id: string;
	email: string;
	name: string;
	role: string;
	phone: string;
	status?: string;
	createdAt?: string;
};

export default function UsersPage() {
	const searchParams = useSearchParams();
	const type = searchParams.get("type") || "all";
	const [users, setUsers] = useState<UserRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");

	useEffect(() => {
		const fetchUsers = async () => {
			setLoading(true);
			try {
				const res = await fetch("/api/users");
				if (!res.ok) throw new Error(`Failed to load users: ${res.status}`);
				const json = (await res.json()) as { users: UserRow[] };
				setUsers(json.users ?? []);
			} catch (error) {
				console.error("Error loading users:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchUsers();
	}, []);

	const filteredUsers = users.filter((user) => {
		const matchesSearch = 
			user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.name.toLowerCase().includes(searchTerm.toLowerCase());
		
		if (type === "cleaners") {
			return matchesSearch && (user.role === "provider" || user.role === "cleaner" || user.role === "cleaning_lady");
		} else if (type === "admins") {
			return matchesSearch && (user.role === "admin" || user.role === "root_admin");
		}
		return matchesSearch;
	});

	const getRoleBadge = (role: string) => {
		const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
			root_admin: "destructive",
			admin: "default",
			provider: "secondary",
			cleaner: "secondary",
			cleaning_lady: "secondary",
			customer: "outline",
		};
		return <Badge variant={variants[role] || "outline"}>{role}</Badge>;
	};

	const columns: Column<UserRow>[] = [
		{ key: "email", header: "Email" },
		{ key: "name", header: "Name" },
		{ 
			key: "role", 
			header: "Role",
			render: (user) => getRoleBadge(user.role)
		},
		{ key: "phone", header: "Phone" },
	];

	const cleaners = filteredUsers.filter(u => u.role === "provider" || u.role === "cleaner" || u.role === "cleaning_lady");
	const admins = filteredUsers.filter(u => u.role === "admin" || u.role === "root_admin");
	const allUsers = filteredUsers;

	return (
		<div className="space-y-6">
			<PageHeader
				title={type === "cleaners" ? "Cleaners" : type === "admins" ? "Admins & Roles" : "All Users"}
				subtitle={type === "cleaners" ? "Manage cleaners and their profiles" : type === "admins" ? "Manage admin users and role permissions" : "Manage all users, roles, and access controls"}
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<Link href="/root-admin/users" className="hover:underline">User Management</Link>
						{type !== "all" && (
							<>
								<span className="mx-1">/</span>
								<span>{type === "cleaners" ? "Cleaners" : "Admins & Roles"}</span>
							</>
						)}
					</div>
				}
			/>

			{/* Quick Stats */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Total Users</CardDescription>
						<CardTitle className="text-2xl">{users.length}</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Cleaners</CardDescription>
						<CardTitle className="text-2xl">{cleaners.length}</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Admins</CardDescription>
						<CardTitle className="text-2xl">{admins.length}</CardTitle>
					</CardHeader>
				</Card>
			</div>

			{/* Search and Filters */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>User List</CardTitle>
						<div className="flex items-center gap-2">
							<div className="relative">
								<Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search users..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-8 w-64"
								/>
							</div>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Tabs value={type === "cleaners" ? "cleaners" : type === "admins" ? "admins" : "all"} className="w-full">
						<TabsList>
							<TabsTrigger 
								value="all"
								onClick={() => window.location.href = "/root-admin/users"}
							>
								All Users
							</TabsTrigger>
							<TabsTrigger 
								value="cleaners"
								onClick={() => window.location.href = "/root-admin/users?type=cleaners"}
							>
								Cleaners
							</TabsTrigger>
							<TabsTrigger 
								value="admins"
								onClick={() => window.location.href = "/root-admin/users?type=admins"}
							>
								Admins & Roles
							</TabsTrigger>
						</TabsList>

						<TabsContent value="all" className="mt-4">
							{loading ? (
								<div className="text-center py-8 text-muted-foreground">Loading users...</div>
							) : (
								<DataTable<UserRow>
									columns={columns}
									data={allUsers}
									getRowKey={(r) => r.id}
									density="comfortable"
									stickyHeader
								/>
							)}
						</TabsContent>

						<TabsContent value="cleaners" className="mt-4">
							{loading ? (
								<div className="text-center py-8 text-muted-foreground">Loading cleaners...</div>
							) : (
								<DataTable<UserRow>
									columns={columns}
									data={cleaners}
									getRowKey={(r) => r.id}
									density="comfortable"
									stickyHeader
								/>
							)}
						</TabsContent>

						<TabsContent value="admins" className="mt-4">
							{loading ? (
								<div className="text-center py-8 text-muted-foreground">Loading admins...</div>
							) : (
								<DataTable<UserRow>
									columns={columns}
									data={admins}
									getRowKey={(r) => r.id}
									density="comfortable"
									stickyHeader
								/>
							)}
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}


