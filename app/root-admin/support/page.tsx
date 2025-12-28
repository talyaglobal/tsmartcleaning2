"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, Column } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Search, Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SupportTicket = {
	id: string;
	subject: string;
	status: "open" | "in-progress" | "resolved" | "closed";
	priority: "low" | "medium" | "high" | "urgent";
	createdAt: string;
	updatedAt: string;
	userId: string;
	responseTime?: number;
};

export default function SupportTicketsPage() {
	const [tickets, setTickets] = useState<SupportTicket[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");

	useEffect(() => {
		// TODO: Fetch tickets from API
		setLoading(false);
	}, []);

	const getStatusBadge = (status: string) => {
		const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
			open: "default",
			"in-progress": "secondary",
			resolved: "outline",
			closed: "outline",
		};
		return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
	};

	const columns: Column<SupportTicket>[] = [
		{ key: "subject", header: "Subject" },
		{ key: "status", header: "Status", render: (ticket) => getStatusBadge(ticket.status) },
		{ key: "priority", header: "Priority" },
		{ key: "createdAt", header: "Created" },
		{ key: "updatedAt", header: "Last Updated" },
	];

	return (
		<div className="space-y-6">
			<PageHeader
				title="Support & Tickets"
				subtitle="Manage customer support tickets and track response times"
			/>

			{/* Metrics Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Open Tickets</CardDescription>
						<CardTitle className="text-2xl">0</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center text-xs text-muted-foreground">
							<AlertCircle className="h-3 w-3 mr-1" />
							<span>Awaiting response</span>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>In Progress</CardDescription>
						<CardTitle className="text-2xl">0</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center text-xs text-muted-foreground">
							<Clock className="h-3 w-3 mr-1" />
							<span>Being handled</span>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Resolved</CardDescription>
						<CardTitle className="text-2xl">0</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center text-xs text-muted-foreground">
							<CheckCircle2 className="h-3 w-3 mr-1" />
							<span>This month</span>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Avg Response Time</CardDescription>
						<CardTitle className="text-2xl">--</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center text-xs text-muted-foreground">
							<Clock className="h-3 w-3 mr-1" />
							<span>Hours</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Tickets Table */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Support Tickets</CardTitle>
							<CardDescription>Manage and respond to customer support requests</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<div className="relative">
								<Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search tickets..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-8 w-64"
								/>
							</div>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<DataTable columns={columns} data={tickets} />
				</CardContent>
			</Card>
		</div>
	);
}

