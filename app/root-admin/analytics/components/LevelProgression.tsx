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
} from "recharts";

type LevelData = {
	userDistribution: {
		company: Array<{ level: string; count: number; percentage: number }>;
		cleaner: Array<{ level: string; count: number; percentage: number }>;
	};
	levelUpRates: {
		company: Record<string, number>;
		cleaner: Record<string, number>;
	};
	averageTimeToLevelUp: {
		company: Record<string, number>;
		cleaner: Record<string, number>;
	};
};

export function LevelProgression() {
	const [data, setData] = useState<LevelData | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch("/api/root-admin/analytics/gamification/levels");
				if (!res.ok) {
					throw new Error("Failed to load level data");
				}
				const levelData = await res.json();
				setData(levelData);
			} catch (err: any) {
				console.error("Error loading level data:", err);
				setError(err?.message || "Failed to load level progression");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	if (loading) {
		return <LoadingSpinner label="Loading level progression..." />;
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

	const companyLevelUpData = Object.entries(data.levelUpRates.company).map(([level, rate]) => ({
		level,
		rate: Math.round(rate * 100) / 100,
	}));

	const cleanerLevelUpData = Object.entries(data.levelUpRates.cleaner).map(([level, rate]) => ({
		level,
		rate: Math.round(rate * 100) / 100,
	}));

	const companyTimeData = Object.entries(data.averageTimeToLevelUp.company).map(([level, days]) => ({
		level,
		days: Math.round(days),
	}));

	const cleanerTimeData = Object.entries(data.averageTimeToLevelUp.cleaner).map(([level, days]) => ({
		level,
		days: Math.round(days),
	}));

	return (
		<div className="space-y-6">
			{/* User Distribution by Level */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<Building2 className="h-5 w-5 text-slate-600" />
							<CardTitle>Company Level Distribution</CardTitle>
						</div>
						<CardDescription>Distribution of companies across levels</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-64">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={data.userDistribution.company}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="level" />
									<YAxis />
									<Tooltip />
									<Legend />
									<Bar dataKey="count" fill="#3b82f6" name="Companies" />
								</BarChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<User className="h-5 w-5 text-slate-600" />
							<CardTitle>Cleaner Level Distribution</CardTitle>
						</div>
						<CardDescription>Distribution of cleaners across levels</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-64">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={data.userDistribution.cleaner}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="level" />
									<YAxis />
									<Tooltip />
									<Legend />
									<Bar dataKey="count" fill="#10b981" name="Cleaners" />
								</BarChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Level Up Rates */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Company Level Up Rates</CardTitle>
						<CardDescription>Percentage of companies who reached each level</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-64">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart data={companyLevelUpData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="level" />
									<YAxis label={{ value: "Rate (%)", angle: -90, position: "insideLeft" }} />
									<Tooltip formatter={(value: number) => [`${value}%`, "Level Up Rate"]} />
									<Legend />
									<Line type="monotone" dataKey="rate" stroke="#3b82f6" name="Rate (%)" />
								</LineChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Cleaner Level Up Rates</CardTitle>
						<CardDescription>Percentage of cleaners who reached each level</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-64">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart data={cleanerLevelUpData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="level" />
									<YAxis label={{ value: "Rate (%)", angle: -90, position: "insideLeft" }} />
									<Tooltip formatter={(value: number) => [`${value}%`, "Level Up Rate"]} />
									<Legend />
									<Line type="monotone" dataKey="rate" stroke="#10b981" name="Rate (%)" />
								</LineChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Average Time to Level Up */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Company: Average Time to Level Up</CardTitle>
						<CardDescription>Average days to progress from one level to the next</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-64">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={companyTimeData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="level" />
									<YAxis label={{ value: "Days", angle: -90, position: "insideLeft" }} />
									<Tooltip formatter={(value: number) => [`${value} days`, "Average Time"]} />
									<Legend />
									<Bar dataKey="days" fill="#3b82f6" name="Days" />
								</BarChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Cleaner: Average Time to Level Up</CardTitle>
						<CardDescription>Average days to progress from one level to the next</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-64">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={cleanerTimeData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="level" />
									<YAxis label={{ value: "Days", angle: -90, position: "insideLeft" }} />
									<Tooltip formatter={(value: number) => [`${value} days`, "Average Time"]} />
									<Legend />
									<Bar dataKey="days" fill="#10b981" name="Days" />
								</BarChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

