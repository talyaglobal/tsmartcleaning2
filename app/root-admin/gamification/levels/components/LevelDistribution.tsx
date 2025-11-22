"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
	PieChart,
	Pie,
	Cell,
} from "recharts";

type LevelDistributionData = {
	companyDistribution: Array<{ level: string; count: number; percentage: number }>;
	cleanerDistribution: Array<{ level: string; count: number; percentage: number }>;
};

type LevelDistributionProps = {
	data: LevelDistributionData;
};

const COLORS = [
	"#3b82f6",
	"#10b981",
	"#f59e0b",
	"#ef4444",
	"#8b5cf6",
	"#ec4899",
	"#06b6d4",
];

export function LevelDistribution({ data }: LevelDistributionProps) {
	return (
		<div className="space-y-6">
			{/* Company Distribution */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<Building2 className="h-5 w-5 text-slate-600" />
						<CardTitle>Company Level Distribution</CardTitle>
					</div>
					<CardDescription>Distribution of companies across different levels</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-6">
						{/* Bar Chart */}
						<div className="h-80">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={data.companyDistribution}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="level" />
									<YAxis />
									<Tooltip
										formatter={(value: number, name: string) => [
											`${value} (${data.companyDistribution.find((d) => d.count === value)?.percentage.toFixed(1)}%)`,
											name,
										]}
									/>
									<Legend />
									<Bar dataKey="count" fill="#3b82f6" name="Companies" />
								</BarChart>
							</ResponsiveContainer>
						</div>

						{/* Pie Chart */}
						<div className="h-80">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={data.companyDistribution}
										cx="50%"
										cy="50%"
										labelLine={false}
										label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
										outerRadius={100}
										fill="#8884d8"
										dataKey="count"
									>
										{data.companyDistribution.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
										))}
									</Pie>
									<Tooltip
										formatter={(value: number) => {
											const item = data.companyDistribution.find((d) => d.count === value);
											return `${value} (${item?.percentage.toFixed(1)}%)`;
										}}
									/>
								</PieChart>
							</ResponsiveContainer>
						</div>

						{/* Table View */}
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b">
										<th className="text-left p-2 font-semibold">Level</th>
										<th className="text-right p-2 font-semibold">Count</th>
										<th className="text-right p-2 font-semibold">Percentage</th>
									</tr>
								</thead>
								<tbody>
									{data.companyDistribution.map((item, idx) => (
										<tr key={idx} className="border-b hover:bg-slate-50">
											<td className="p-2">{item.level}</td>
											<td className="text-right p-2">{item.count.toLocaleString()}</td>
											<td className="text-right p-2">{item.percentage.toFixed(1)}%</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Cleaner Distribution */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<User className="h-5 w-5 text-slate-600" />
						<CardTitle>Cleaner Level Distribution</CardTitle>
					</div>
					<CardDescription>Distribution of cleaners across different levels</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-6">
						{/* Bar Chart */}
						<div className="h-80">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={data.cleanerDistribution}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="level" />
									<YAxis />
									<Tooltip
										formatter={(value: number, name: string) => [
											`${value} (${data.cleanerDistribution.find((d) => d.count === value)?.percentage.toFixed(1)}%)`,
											name,
										]}
									/>
									<Legend />
									<Bar dataKey="count" fill="#10b981" name="Cleaners" />
								</BarChart>
							</ResponsiveContainer>
						</div>

						{/* Pie Chart */}
						<div className="h-80">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={data.cleanerDistribution}
										cx="50%"
										cy="50%"
										labelLine={false}
										label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
										outerRadius={100}
										fill="#8884d8"
										dataKey="count"
									>
										{data.cleanerDistribution.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
										))}
									</Pie>
									<Tooltip
										formatter={(value: number) => {
											const item = data.cleanerDistribution.find((d) => d.count === value);
											return `${value} (${item?.percentage.toFixed(1)}%)`;
										}}
									/>
								</PieChart>
							</ResponsiveContainer>
						</div>

						{/* Table View */}
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b">
										<th className="text-left p-2 font-semibold">Level</th>
										<th className="text-right p-2 font-semibold">Count</th>
										<th className="text-right p-2 font-semibold">Percentage</th>
									</tr>
								</thead>
								<tbody>
									{data.cleanerDistribution.map((item, idx) => (
										<tr key={idx} className="border-b hover:bg-slate-50">
											<td className="p-2">{item.level}</td>
											<td className="text-right p-2">{item.count.toLocaleString()}</td>
											<td className="text-right p-2">{item.percentage.toFixed(1)}%</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

