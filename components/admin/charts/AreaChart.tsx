import React from "react";
import { ResponsiveContainer, AreaChart as RAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

type Props<T extends object> = {
	data: T[];
	xKey: keyof T;
	yKey: keyof T;
	color?: string;
	height?: number;
	fillOpacity?: number;
};

export function AreaChart<T extends object>({ data, xKey, yKey, color = "#2563eb", height = 256, fillOpacity = 0.15 }: Props<T>) {
	return (
		<div style={{ height }}>
			<ResponsiveContainer width="100%" height="100%">
				<RAreaChart data={data}>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey={xKey as string} />
					<YAxis />
					<Tooltip />
					<Area type="monotone" dataKey={yKey as string} stroke={color} fill={color} fillOpacity={fillOpacity} />
				</RAreaChart>
			</ResponsiveContainer>
		</div>
	);
}

export default AreaChart;


