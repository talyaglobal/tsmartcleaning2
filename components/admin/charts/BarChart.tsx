import React from "react";
import { ResponsiveContainer, BarChart as RBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

type Props<T extends object> = {
	data: T[];
	xKey: keyof T;
	yKey: keyof T;
	color?: string;
	height?: number;
	rounded?: number;
};

export function BarChart<T extends object>({ data, xKey, yKey, color = "#2563eb", height = 256, rounded = 4 }: Props<T>) {
	return (
		<div style={{ height }}>
			<ResponsiveContainer width="100%" height="100%">
				<RBarChart data={data}>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey={xKey as string} />
					<YAxis />
					<Tooltip />
					<Bar dataKey={yKey as string} fill={color} radius={[rounded, rounded, 0, 0]} />
				</RBarChart>
			</ResponsiveContainer>
		</div>
	);
}

export default BarChart;


