import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PartnerDashboardLoading() {
	return (
		<div className="space-y-6">
			<div>
				<Skeleton className="h-6 w-48 mb-2" />
				<Skeleton className="h-4 w-64" />
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
				{[1, 2, 3, 4].map((i) => (
					<Card key={i} className="p-6">
						<Skeleton className="h-4 w-24 mb-3" />
						<Skeleton className="h-7 w-28" />
						<Skeleton className="h-4 w-40 mt-3" />
					</Card>
				))}
			</div>
		</div>
	);
}


