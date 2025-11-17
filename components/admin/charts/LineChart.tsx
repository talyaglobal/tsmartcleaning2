import React from "react";
import { ResponsiveContainer, LineChart as RLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

type Props<T extends object> = {
	data: T[];
	xKey: keyof T;
	yKey: keyof T;
	color?: string;
	height?: number;
};

export function LineChart<T extends object>({ data, xKey, yKey, color = "#2563eb", height = 256 }: Props<T>) {
	return (
		<div style={{ height }}>
			<ResponsiveContainer width="100%" height="100%">
				<RLineChart data={data}>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey={xKey as string} />
					<YAxis />
					<Tooltip />
					<Line type="monotone" dataKey={yKey as string} stroke={color} strokeWidth={2} />
				</RLineChart>
			</ResponsiveContainer>
		</div>
	);
}

export default LineChart;


