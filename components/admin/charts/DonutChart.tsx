import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

type Slice = { name: string; value: number; color?: string };

type Props = {
	data: Slice[];
	height?: number;
	innerRadius?: number;
	outerRadius?: number;
};

const DEFAULT_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function DonutChart({ data, height = 240, innerRadius = 60, outerRadius = 90 }: Props) {
	return (
		<div style={{ height }}>
			<ResponsiveContainer width="100%" height="100%">
				<PieChart>
					<Tooltip />
					<Pie data={data} dataKey="value" nameKey="name" innerRadius={innerRadius} outerRadius={outerRadius} paddingAngle={2}>
						{data.map((entry, idx) => (
							<Cell key={`cell-${idx}`} fill={entry.color ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length]} />
						))}
					</Pie>
				</PieChart>
			</ResponsiveContainer>
		</div>
	);
}

export default DonutChart;


