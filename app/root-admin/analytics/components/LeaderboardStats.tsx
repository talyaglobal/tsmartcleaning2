"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/admin/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Building2, User, TrendingUp, TrendingDown } from "lucide-react";
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

type LeaderboardData = {
	participationRates: {
		company: number;
		cleaner: number;
		total: number;
	};
	rankingChanges: Array<{
		date: string;
		avgRankChange: number;
		usersWithRankChange: number;
	}>;
	topPerformers: {
		companies: Array<{
			id: string;
			name: string;
			points: number;
			rank: number;
			rankChange: number;
		}>;
		cleaners: Array<{
			id: string;
			name: string;
			points: number;
			rank: number;
			rankChange: number;
		}>;
	};
};

export function LeaderboardStats() {
	const [data, setData] = useState<LeaderboardData | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch("/api/root-admin/analytics/gamification/leaderboards");
				if (!res.ok) {
					throw new Error("Failed to load leaderboard data");
				}
				const leaderboardData = await res.json();
				setData(leaderboardData);
			} catch (err: any) {
				console.error("Error loading leaderboard data:", err);
				setError(err?.message || "Failed to load leaderboard statistics");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	if (loading) {
		return <LoadingSpinner label="Loading leaderboard statistics..." />;
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
			{/* Participation Rates */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Company Participation</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{data.participationRates.company.toFixed(1)}%</div>
						<div className="text-sm text-slate-500 mt-1">of companies on leaderboard</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Cleaner Participation</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{data.participationRates.cleaner.toFixed(1)}%</div>
						<div className="text-sm text-slate-500 mt-1">of cleaners on leaderboard</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Total Participation</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{data.participationRates.total.toFixed(1)}%</div>
						<div className="text-sm text-slate-500 mt-1">overall participation rate</div>
					</CardContent>
				</Card>
			</div>

			{/* Ranking Changes Over Time */}
			<Card>
				<CardHeader>
					<CardTitle>Ranking Changes Over Time</CardTitle>
					<CardDescription>Average rank changes and users affected</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="h-80">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={data.rankingChanges}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="date" />
								<YAxis yAxisId="left" label={{ value: "Avg Rank Change", angle: -90, position: "insideLeft" }} />
								<YAxis yAxisId="right" orientation="right" label={{ value: "Users", angle: 90, position: "insideRight" }} />
								<Tooltip />
								<Legend />
								<Line
									yAxisId="left"
									type="monotone"
									dataKey="avgRankChange"
									stroke="#3b82f6"
									name="Avg Rank Change"
								/>
								<Line
									yAxisId="right"
									type="monotone"
									dataKey="usersWithRankChange"
									stroke="#10b981"
									name="Users with Rank Change"
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
				</CardContent>
			</Card>

			{/* Top Performers */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<Building2 className="h-5 w-5 text-slate-600" />
							<CardTitle>Top Company Performers</CardTitle>
						</div>
						<CardDescription>Top 10 companies by points</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{data.topPerformers.companies.map((company) => (
								<div key={company.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
									<div className="flex items-center gap-3">
										<div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 font-semibold text-sm">
											{company.rank}
										</div>
										<div>
											<div className="font-medium">{company.name}</div>
											<div className="text-sm text-slate-500">{company.points.toLocaleString()} points</div>
										</div>
									</div>
									<div className="flex items-center gap-2">
										{company.rankChange > 0 ? (
											<Badge variant="default" className="flex items-center gap-1">
												<TrendingUp className="h-3 w-3" />
												+{company.rankChange}
											</Badge>
										) : company.rankChange < 0 ? (
											<Badge variant="secondary" className="flex items-center gap-1">
												<TrendingDown className="h-3 w-3" />
												{company.rankChange}
											</Badge>
										) : (
											<Badge variant="outline">—</Badge>
										)}
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<User className="h-5 w-5 text-slate-600" />
							<CardTitle>Top Cleaner Performers</CardTitle>
						</div>
						<CardDescription>Top 10 cleaners by points</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{data.topPerformers.cleaners.map((cleaner) => (
								<div key={cleaner.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
									<div className="flex items-center gap-3">
										<div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 font-semibold text-sm">
											{cleaner.rank}
										</div>
										<div>
											<div className="font-medium">{cleaner.name}</div>
											<div className="text-sm text-slate-500">{cleaner.points.toLocaleString()} points</div>
										</div>
									</div>
									<div className="flex items-center gap-2">
										{cleaner.rankChange > 0 ? (
											<Badge variant="default" className="flex items-center gap-1">
												<TrendingUp className="h-3 w-3" />
												+{cleaner.rankChange}
											</Badge>
										) : cleaner.rankChange < 0 ? (
											<Badge variant="secondary" className="flex items-center gap-1">
												<TrendingDown className="h-3 w-3" />
												{cleaner.rankChange}
											</Badge>
										) : (
											<Badge variant="outline">—</Badge>
										)}
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

