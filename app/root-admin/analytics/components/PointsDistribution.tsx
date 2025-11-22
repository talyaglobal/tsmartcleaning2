"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/admin/LoadingSpinner";
import { Building2, User } from "lucide-react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	LineChart,
	Line,
	PieChart,
	Pie,
	Cell,
} from "recharts";

type PointsData = {
	distributionByUserType: Array<{
		userType: string;
		count: number;
		averagePoints: number;
		totalPoints: number;
	}>;
	pointsByActionType: Array<{
		actionType: string;
		points: number;
		count: number;
	}>;
	timeBasedTrends: Array<{
		date: string;
		companies: number;
		cleaners: number;
		total: number;
	}>;
};

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function PointsDistribution() {
	const [data, setData] = useState<PointsData | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch("/api/root-admin/analytics/gamification/points");
				if (!res.ok) {
					throw new Error("Failed to load points data");
				}
				const pointsData = await res.json();
				setData(pointsData);
			} catch (err: any) {
				console.error("Error loading points data:", err);
				setError(err?.message || "Failed to load points distribution");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	if (loading) {
		return <LoadingSpinner label="Loading points distribution..." />;
	}

	if (error || !data) {
		return (
			<Card>
				<CardContent className="pt-6">
					<div className="text-center text-slate-500">
						{error || "No data available"}
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{/* Distribution by User Type */}
			<Card>
				<CardHeader>
					<CardTitle>Distribution by User Type</CardTitle>
					<CardDescription>Points distribution across companies and cleaners</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="h-80">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={data.distributionByUserType}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="userType" />
								<YAxis />
								<Tooltip />
								<Legend />
								<Bar dataKey="totalPoints" fill="#3b82f6" name="Total Points" />
								<Bar dataKey="averagePoints" fill="#10b981" name="Average Points" />
							</BarChart>
						</ResponsiveContainer>
					</div>
					<div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
						{data.distributionByUserType.map((item, idx) => (
							<div key={idx} className="p-4 border rounded-lg">
								<div className="flex items-center gap-2 mb-2">
									{item.userType === "company" ? (
										<Building2 className="h-4 w-4 text-slate-600" />
									) : (
										<User className="h-4 w-4 text-slate-600" />
									)}
									<span className="font-semibold capitalize">{item.userType}</span>
								</div>
								<div className="text-sm text-slate-600">
									<div>Total Points: {item.totalPoints.toLocaleString()}</div>
									<div>Average Points: {item.averagePoints.toFixed(0)}</div>
									<div>Users: {item.count.toLocaleString()}</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Points by Action Type */}
			<Card>
				<CardHeader>
					<CardTitle>Points Earned by Action Type</CardTitle>
					<CardDescription>Breakdown of points earned by different actions</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="h-80">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={data.pointsByActionType}
									cx="50%"
									cy="50%"
									labelLine={false}
									label={({ name, points }) => `${name}: ${points.toLocaleString()}`}
									outerRadius={100}
									fill="#8884d8"
									dataKey="points"
								>
									{data.pointsByActionType.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
									))}
								</Pie>
								<Tooltip formatter={(value: number) => value.toLocaleString()} />
							</PieChart>
						</ResponsiveContainer>
					</div>
					<div className="mt-4 overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b">
									<th className="text-left p-2 font-semibold">Action Type</th>
									<th className="text-right p-2 font-semibold">Total Points</th>
									<th className="text-right p-2 font-semibold">Count</th>
									<th className="text-right p-2 font-semibold">Avg per Action</th>
								</tr>
							</thead>
							<tbody>
								{data.pointsByActionType.map((item, idx) => (
									<tr key={idx} className="border-b hover:bg-slate-50">
										<td className="p-2 capitalize">{item.actionType.replace(/_/g, " ")}</td>
										<td className="text-right p-2">{item.points.toLocaleString()}</td>
										<td className="text-right p-2">{item.count.toLocaleString()}</td>
										<td className="text-right p-2">
											{item.count > 0 ? (item.points / item.count).toFixed(0) : 0}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>

			{/* Time-based Trends */}
			<Card>
				<CardHeader>
					<CardTitle>Points Trends Over Time</CardTitle>
					<CardDescription>Daily points earned by user type</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="h-80">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={data.timeBasedTrends}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="date" />
								<YAxis />
								<Tooltip />
								<Legend />
								<Line type="monotone" dataKey="companies" stroke="#3b82f6" name="Companies" />
								<Line type="monotone" dataKey="cleaners" stroke="#10b981" name="Cleaners" />
								<Line type="monotone" dataKey="total" stroke="#f59e0b" name="Total" />
							</LineChart>
						</ResponsiveContainer>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

