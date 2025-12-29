"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Coins, Save, TrendingUp, History, Settings } from "lucide-react";
import { DataTable, Column } from "@/components/admin/DataTable";

type PointAction = {
	id: string;
	action: string;
	pointValue: number;
	userType: "company" | "cleaner" | "both";
	category: string;
};

type PointTransaction = {
	id: string;
	userId: string;
	userName: string;
	action: string;
	points: number;
	timestamp: string;
};

export default function PointsSystemPage() {
	const [actions, setActions] = useState<PointAction[]>([]);
	const [transactions, setTransactions] = useState<PointTransaction[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// TODO: Fetch from API
		setActions([
			{ id: "1", action: "Post a job", pointValue: 10, userType: "company", category: "Job Management" },
			{ id: "2", action: "Complete a job", pointValue: 50, userType: "both", category: "Job Management" },
			{ id: "3", action: "Rate a cleaner", pointValue: 5, userType: "company", category: "Feedback" },
			{ id: "4", action: "Refer another company", pointValue: 500, userType: "company", category: "Referrals" },
			{ id: "5", action: "Complete profile", pointValue: 25, userType: "both", category: "Profile" },
			{ id: "6", action: "First job posted", pointValue: 100, userType: "company", category: "Milestones" },
			{ id: "7", action: "First job completed", pointValue: 100, userType: "cleaner", category: "Milestones" },
			{ id: "8", action: "10 jobs completed", pointValue: 250, userType: "both", category: "Milestones" },
		]);
		setLoading(false);
	}, []);

	const transactionColumns: Column<PointTransaction>[] = [
		{ key: "userName", header: "User" },
		{ key: "action", header: "Action" },
		{ key: "points", header: "Points" },
		{ key: "timestamp", header: "Date" },
	];

	const actionColumns: Column<PointAction>[] = [
		{ key: "action", header: "Action" },
		{ key: "category", header: "Category" },
		{ 
			key: "pointValue", 
			header: "Points",
			render: (action) => <Badge variant="secondary">{action.pointValue}</Badge>
		},
		{ key: "userType", header: "User Type" },
	];

	return (
		<div className="space-y-6">
			<PageHeader
				title="Points System"
				subtitle="Configure point values for actions and view points distribution"
			/>

			<Tabs defaultValue="configuration" className="space-y-4">
				<TabsList>
					<TabsTrigger value="configuration">
						<Settings className="h-4 w-4 mr-2" />
						Configuration
					</TabsTrigger>
					<TabsTrigger value="distribution">
						<TrendingUp className="h-4 w-4 mr-2" />
						Distribution
					</TabsTrigger>
					<TabsTrigger value="history">
						<History className="h-4 w-4 mr-2" />
						History
					</TabsTrigger>
				</TabsList>

				<TabsContent value="configuration" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Point Values Configuration</CardTitle>
							<CardDescription>Configure point values for different user actions</CardDescription>
						</CardHeader>
						<CardContent>
							<DataTable
								columns={actionColumns}
								data={actions}
								getRowKey={(row) => row.id}
							/>
							<div className="mt-4 flex justify-end">
								<Button>
									<Save className="h-4 w-4 mr-2" />
									Save Changes
								</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="distribution" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Points Distribution Analytics</CardTitle>
							<CardDescription>View how points are distributed across the platform</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Points distribution analytics will be displayed here.
							</p>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="history" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Points History</CardTitle>
							<CardDescription>View all point transactions and adjustments</CardDescription>
						</CardHeader>
						<CardContent>
							{transactions.length === 0 ? (
								<p className="text-sm text-muted-foreground text-center py-8">
									No point transactions yet
								</p>
							) : (
								<DataTable
									columns={transactionColumns}
									data={transactions}
									getRowKey={(row) => row.id}
								/>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}

