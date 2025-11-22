"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/admin/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
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
} from "recharts";

type BadgeData = {
	earningRates: Array<{
		badgeName: string;
		earnedCount: number;
		eligibleUsers: number;
		earningRate: number;
	}>;
	mostPopular: Array<{
		badgeName: string;
		earnedCount: number;
		percentage: number;
	}>;
	trends: Array<{
		date: string;
		badgesEarned: number;
		uniqueUsers: number;
	}>;
};

export function BadgeAchievements() {
	const [data, setData] = useState<BadgeData | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch("/api/root-admin/analytics/gamification/badges");
				if (!res.ok) {
					throw new Error("Failed to load badge data");
				}
				const badgeData = await res.json();
				setData(badgeData);
			} catch (err: any) {
				console.error("Error loading badge data:", err);
				setError(err?.message || "Failed to load badge achievements");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	if (loading) {
		return <LoadingSpinner label="Loading badge achievements..." />;
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
			{/* Badge Earning Rates */}
			<Card>
				<CardHeader>
					<CardTitle>Badge Earning Rates</CardTitle>
					<CardDescription>Percentage of eligible users who earned each badge</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="h-80">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={data.earningRates}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="badgeName" angle={-45} textAnchor="end" height={100} />
								<YAxis label={{ value: "Rate (%)", angle: -90, position: "insideLeft" }} />
								<Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, "Earning Rate"]} />
								<Legend />
								<Bar dataKey="earningRate" fill="#3b82f6" name="Earning Rate (%)" />
							</BarChart>
						</ResponsiveContainer>
					</div>
					<div className="mt-4 overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b">
									<th className="text-left p-2 font-semibold">Badge</th>
									<th className="text-right p-2 font-semibold">Earned</th>
									<th className="text-right p-2 font-semibold">Eligible</th>
									<th className="text-right p-2 font-semibold">Rate</th>
								</tr>
							</thead>
							<tbody>
								{data.earningRates.map((item, idx) => (
									<tr key={idx} className="border-b hover:bg-slate-50">
										<td className="p-2">{item.badgeName}</td>
										<td className="text-right p-2">{item.earnedCount.toLocaleString()}</td>
										<td className="text-right p-2">{item.eligibleUsers.toLocaleString()}</td>
										<td className="text-right p-2">
											<Badge variant={item.earningRate > 50 ? "default" : "secondary"}>
												{item.earningRate.toFixed(1)}%
											</Badge>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>

			{/* Most Popular Badges */}
			<Card>
				<CardHeader>
					<CardTitle>Most Popular Badges</CardTitle>
					<CardDescription>Badges with the highest number of earners</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="h-80">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={data.mostPopular}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="badgeName" angle={-45} textAnchor="end" height={100} />
								<YAxis />
								<Tooltip formatter={(value: number) => [value.toLocaleString(), "Earned"]} />
								<Legend />
								<Bar dataKey="earnedCount" fill="#10b981" name="Times Earned" />
							</BarChart>
						</ResponsiveContainer>
					</div>
					<div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{data.mostPopular.slice(0, 6).map((item, idx) => (
							<div key={idx} className="p-4 border rounded-lg">
								<div className="font-semibold mb-2">{item.badgeName}</div>
								<div className="text-sm text-slate-600">
									<div>Earned: {item.earnedCount.toLocaleString()} times</div>
									<div className="mt-1">
										<Badge variant="outline">{item.percentage.toFixed(1)}% of users</Badge>
									</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Badge Earning Trends */}
			<Card>
				<CardHeader>
					<CardTitle>Badge Earning Trends</CardTitle>
					<CardDescription>Daily badge earning activity over time</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="h-80">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={data.trends}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="date" />
								<YAxis yAxisId="left" />
								<YAxis yAxisId="right" orientation="right" />
								<Tooltip />
								<Legend />
								<Line
									yAxisId="left"
									type="monotone"
									dataKey="badgesEarned"
									stroke="#3b82f6"
									name="Badges Earned"
								/>
								<Line
									yAxisId="right"
									type="monotone"
									dataKey="uniqueUsers"
									stroke="#10b981"
									name="Unique Users"
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

