import React from "react";
import { MetricCard } from "@/components/admin/MetricCard";
import { DollarSign, ClipboardList, XCircle } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase";

export default async function PartnerDashboard() {
	const supabase = createServerSupabase();
	const now = new Date();
	const start30 = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
	const yyyy = now.getFullYear();
	const mm = String(now.getMonth() + 1).padStart(2, "0");
	const monthStart = `${yyyy}-${mm}-01`;

	let gmv30 = 0;
	let gmvMonth = 0;
	let bookings30 = 0;
	let bookingsMonth = 0;
	let cancels30 = 0;
	let total30ForRate = 0;

	try {
		// GMV (Gross Merchandise Volume): sum of completed payment transactions
		const [{ data: tx30 }, { data: txMonth }] = await Promise.all([
			supabase
				.from("transactions")
				.select("amount,created_at")
				.gte("created_at", start30.toISOString())
				.lte("created_at", now.toISOString())
				.eq("status", "completed")
				.eq("transaction_type", "payment"),
			supabase
				.from("transactions")
				.select("amount,created_at")
				.gte("created_at", monthStart)
				.lte("created_at", now.toISOString())
				.eq("status", "completed")
				.eq("transaction_type", "payment"),
		]);
		gmv30 = (tx30 ?? []).reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
		gmvMonth = (txMonth ?? []).reduce((s: number, t: any) => s + Number(t.amount || 0), 0);

		// Bookings (last 30d and this month)
		const bookingsRes = await Promise.all([
			supabase
				.from("bookings")
				.select("id", { count: "exact", head: true })
				.gte("booking_date", start30.toISOString().slice(0, 10))
				.lte("booking_date", now.toISOString().slice(0, 10))
				.in("status", ["confirmed", "completed"]),
			supabase
				.from("bookings")
				.select("id", { count: "exact", head: true })
				.gte("booking_date", monthStart)
				.lte("booking_date", now.toISOString().slice(0, 10))
				.in("status", ["confirmed", "completed"]),
		]);
		bookings30 = bookingsRes[0].count ?? 0;
		bookingsMonth = bookingsRes[1].count ?? 0;

		// Cancellations (last 30d) + total for rate
		const cancelsRes = await Promise.all([
			supabase
				.from("bookings")
				.select("id", { count: "exact", head: true })
				.gte("booking_date", start30.toISOString().slice(0, 10))
				.lte("booking_date", now.toISOString().slice(0, 10))
				.eq("status", "cancelled"),
			supabase
				.from("bookings")
				.select("id", { count: "exact", head: true })
				.gte("booking_date", start30.toISOString().slice(0, 10))
				.lte("booking_date", now.toISOString().slice(0, 10)),
		]);
		cancels30 = cancelsRes[0].count ?? 0;
		total30ForRate = cancelsRes[1].count ?? 0;
	} catch {
		// Defaults already set to 0
	}

	const cancellationRate =
		(total30ForRate ?? 0) > 0 ? Math.round(((cancels30 ?? 0) / (total30ForRate ?? 1)) * 1000) / 10 : 0;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-xl font-semibold text-slate-900">Partner Dashboard</h1>
				<p className="text-sm text-slate-500">Core KPIs at a glance</p>
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
				<MetricCard
					title="GMV (30d)"
					value={`$${gmv30.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
					subtitle={`This month: $${gmvMonth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
					icon={<DollarSign className="w-6 h-6" />}
				/>
				<MetricCard
					title="Bookings (30d)"
					value={`${bookings30 ?? 0}`}
					subtitle={`This month: ${bookingsMonth ?? 0}`}
					icon={<ClipboardList className="w-6 h-6" />}
				/>
				<MetricCard
					title="Cancellations (30d)"
					value={`${cancels30 ?? 0}`}
					subtitle={`Rate: ${cancellationRate}%`}
					icon={<XCircle className="w-6 h-6" />}
				/>
			</div>
		</div>
	);
}


