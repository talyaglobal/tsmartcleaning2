"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, User, TrendingUp, AlertTriangle } from "lucide-react";
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

type ProgressionAnalyticsData = {
	averageTimeToLevelUp: {
		company: Record<string, number>; // level name -> days
		cleaner: Record<string, number>;
	};
	levelUpRates: {
		company: Record<string, number>; // level name -> percentage
		cleaner: Record<string, number>;
	};
	bottlenecks: Array<{
		level: string;
		userType: "company" | "cleaner";
		avgDaysStuck: number;
		usersAffected: number;
	}>;
};

type ProgressionAnalyticsProps = {
	data: ProgressionAnalyticsData;
};

export function ProgressionAnalytics({ data }: ProgressionAnalyticsProps) {
	// Convert records to arrays for charts
	const companyTimeData = Object.entries(data.averageTimeToLevelUp.company).map(([level, days]) => ({
		level,
		days: Math.round(days),
	}));

	const cleanerTimeData = Object.entries(data.averageTimeToLevelUp.cleaner).map(([level, days]) => ({
		level,
		days: Math.round(days),
	}));

	const companyRateData = Object.entries(data.levelUpRates.company).map(([level, rate]) => ({
		level,
		rate: Math.round(rate * 100) / 100,
	}));

	const cleanerRateData = Object.entries(data.levelUpRates.cleaner).map(([level, rate]) => ({
		level,
		rate: Math.round(rate * 100) / 100,
	}));

	return (
		<div className="space-y-6">
			{/* Average Time to Level Up */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<Building2 className="h-5 w-5 text-slate-600" />
							<CardTitle>Company: Average Time to Level Up</CardTitle>
						</div>
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
						<div className="flex items-center gap-2">
							<User className="h-5 w-5 text-slate-600" />
							<CardTitle>Cleaner: Average Time to Level Up</CardTitle>
						</div>
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

			{/* Level Up Rates */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<TrendingUp className="h-5 w-5 text-slate-600" />
							<CardTitle>Company: Level Up Rates</CardTitle>
						</div>
						<CardDescription>Percentage of users who successfully level up</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-64">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart data={companyRateData}>
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
						<div className="flex items-center gap-2">
							<TrendingUp className="h-5 w-5 text-slate-600" />
							<CardTitle>Cleaner: Level Up Rates</CardTitle>
						</div>
						<CardDescription>Percentage of users who successfully level up</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-64">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart data={cleanerRateData}>
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

			{/* Progression Bottlenecks */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<AlertTriangle className="h-5 w-5 text-amber-600" />
						<CardTitle>Progression Bottlenecks</CardTitle>
					</div>
					<CardDescription>
						Levels where users are getting stuck and taking longer than average to progress
					</CardDescription>
				</CardHeader>
				<CardContent>
					{data.bottlenecks.length === 0 ? (
						<div className="text-center py-8 text-slate-500">
							No bottlenecks detected. Users are progressing smoothly!
						</div>
					) : (
						<div className="space-y-4">
							{data.bottlenecks.map((bottleneck, idx) => (
								<div
									key={idx}
									className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50"
								>
									<div className="flex items-center gap-3">
										{bottleneck.userType === "company" ? (
											<Building2 className="h-5 w-5 text-slate-600" />
										) : (
											<User className="h-5 w-5 text-slate-600" />
										)}
										<div>
											<div className="font-medium">{bottleneck.level}</div>
											<div className="text-sm text-slate-500 capitalize">
												{bottleneck.userType} level
											</div>
										</div>
									</div>
									<div className="flex items-center gap-4">
										<div className="text-right">
											<div className="text-sm text-slate-500">Avg Days Stuck</div>
											<div className="font-semibold">{Math.round(bottleneck.avgDaysStuck)} days</div>
										</div>
										<div className="text-right">
											<div className="text-sm text-slate-500">Users Affected</div>
											<div className="font-semibold">{bottleneck.usersAffected.toLocaleString()}</div>
										</div>
										<Badge variant={bottleneck.avgDaysStuck > 30 ? "destructive" : "secondary"}>
											{bottleneck.avgDaysStuck > 30 ? "Critical" : "Warning"}
										</Badge>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

