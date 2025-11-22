"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/admin/LoadingSpinner";
import { MetricCard } from "@/components/admin/MetricCard";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	BarChart,
	Bar,
} from "recharts";

type RevenueData = {
	mrr: {
		current: number;
		target: number;
		trend: Array<{ month: string; mrr: number; target: number }>;
	};
	clv: {
		average: number;
		bySegment: Array<{ segment: string; clv: number }>;
	};
	churnRate: {
		current: number;
		previous: number;
		trend: Array<{ month: string; rate: number }>;
	};
	revenuePerUser: {
		companies: number;
		cleaners: number;
		average: number;
		trend: Array<{ month: string; rpu: number }>;
	};
};

export function RevenueInsights() {
	const [data, setData] = useState<RevenueData | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			setError(null);
			try {
				// For now, we'll use mock data structure
				// In production, this would fetch from an API endpoint
				// const res = await fetch("/api/root-admin/analytics/revenue");
				// const revenueData = await res.json();
				
				// Mock data structure - replace with actual API call
				setData({
					mrr: {
						current: 1850,
						target: 2000,
						trend: [],
					},
					clv: {
						average: 0,
						bySegment: [],
					},
					churnRate: {
						current: 0,
						previous: 0,
						trend: [],
					},
					revenuePerUser: {
						companies: 0,
						cleaners: 0,
						average: 0,
						trend: [],
					},
				});
			} catch (err: any) {
				console.error("Error loading revenue data:", err);
				setError(err?.message || "Failed to load revenue insights");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	if (loading) {
		return <LoadingSpinner label="Loading revenue insights..." />;
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
			{/* Key Metrics */}
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
				<MetricCard
					title="Monthly Recurring Revenue"
					value={`$${data.mrr.current.toLocaleString()}`}
					subtitle={`Target: $${data.mrr.target.toLocaleString()}`}
					change={{
						value: ((data.mrr.current / data.mrr.target) * 100).toFixed(1),
						positive: data.mrr.current >= data.mrr.target * 0.9,
						label: `${((data.mrr.current / data.mrr.target) * 100).toFixed(1)}% of target`,
					}}
				/>
				<MetricCard
					title="Customer Lifetime Value"
					value={`$${data.clv.average.toLocaleString()}`}
					subtitle="Average CLV"
				/>
				<MetricCard
					title="Churn Rate"
					value={`${data.churnRate.current.toFixed(2)}%`}
					subtitle={`Previous: ${data.churnRate.previous.toFixed(2)}%`}
					change={{
						value: data.churnRate.current - data.churnRate.previous,
						positive: data.churnRate.current < data.churnRate.previous,
						label: data.churnRate.current < data.churnRate.previous ? "Improving" : "Increasing",
					}}
				/>
				<MetricCard
					title="Revenue per User"
					value={`$${data.revenuePerUser.average.toFixed(2)}`}
					subtitle={`Companies: $${data.revenuePerUser.companies.toFixed(2)} | Cleaners: $${data.revenuePerUser.cleaners.toFixed(2)}`}
				/>
			</div>

			{/* MRR Trend */}
			{data.mrr.trend.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>MRR Trend</CardTitle>
						<CardDescription>Monthly recurring revenue over time</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-80">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart data={data.mrr.trend}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="month" />
									<YAxis />
									<Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "MRR"]} />
									<Legend />
									<Line type="monotone" dataKey="mrr" stroke="#3b82f6" name="MRR" />
									<Line type="monotone" dataKey="target" stroke="#ef4444" strokeDasharray="5 5" name="Target" />
								</LineChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>
			)}

			{/* CLV by Segment */}
			{data.clv.bySegment.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Customer Lifetime Value by Segment</CardTitle>
						<CardDescription>CLV breakdown by user segment</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-80">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={data.clv.bySegment}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="segment" />
									<YAxis />
									<Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "CLV"]} />
									<Legend />
									<Bar dataKey="clv" fill="#10b981" name="CLV" />
								</BarChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Churn Rate Trend */}
			{data.churnRate.trend.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Churn Rate Trend</CardTitle>
						<CardDescription>Monthly churn rate over time</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-80">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart data={data.churnRate.trend}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="month" />
									<YAxis label={{ value: "Churn Rate (%)", angle: -90, position: "insideLeft" }} />
									<Tooltip formatter={(value: number) => [`${value.toFixed(2)}%`, "Churn Rate"]} />
									<Legend />
									<Line type="monotone" dataKey="rate" stroke="#ef4444" name="Churn Rate" />
								</LineChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Revenue per User Trend */}
			{data.revenuePerUser.trend.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Revenue per User Trend</CardTitle>
						<CardDescription>Average revenue per user over time</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-80">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart data={data.revenuePerUser.trend}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="month" />
									<YAxis label={{ value: "Revenue ($)", angle: -90, position: "insideLeft" }} />
									<Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "RPU"]} />
									<Legend />
									<Line type="monotone" dataKey="rpu" stroke="#f59e0b" name="Revenue per User" />
								</LineChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

