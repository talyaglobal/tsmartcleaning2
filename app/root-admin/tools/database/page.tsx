"use client";

import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, CheckCircle2, AlertTriangle, Download, RefreshCw } from "lucide-react";

export default function DatabaseManagementPage() {
	return (
		<div className="space-y-6">
			<PageHeader
				title="Database Management"
				subtitle="Monitor database health and manage backups"
			/>

			{/* Database Health Status */}
			<Card>
				<CardHeader>
					<CardTitle>Database Health</CardTitle>
					<CardDescription>Current database connection and performance status</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<CheckCircle2 className="h-5 w-5 text-green-500" />
							<span className="font-medium">Connection Status</span>
						</div>
						<Badge variant="default">Healthy</Badge>
					</div>
					<div className="grid grid-cols-2 gap-4 mt-4">
						<div>
							<p className="text-sm text-muted-foreground">Active Connections</p>
							<p className="text-2xl font-bold">--</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Query Performance</p>
							<p className="text-2xl font-bold">--</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Backup Status */}
			<Card>
				<CardHeader>
					<CardTitle>Backup Status</CardTitle>
					<CardDescription>Database backup configuration and status</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium">Last Backup</p>
							<p className="text-sm text-muted-foreground">--</p>
						</div>
						<Badge variant="outline">Configured</Badge>
					</div>
					<div className="flex gap-2">
						<Button variant="outline">
							<Download className="h-4 w-4 mr-2" />
							Download Backup
						</Button>
						<Button variant="outline">
							<RefreshCw className="h-4 w-4 mr-2" />
							Refresh Status
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Data Cleanup */}
			<Card>
				<CardHeader>
					<CardTitle>Data Cleanup Tools</CardTitle>
					<CardDescription>Manage data cleanup and maintenance tasks</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<p className="text-sm text-muted-foreground">
							Data cleanup tools are available through Supabase dashboard or database admin tools.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

