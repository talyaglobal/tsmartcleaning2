import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function CustomerDashboardLoading() {
  return (
    <div className="min-h-screen bg-white">
      <DashboardNav userType="customer" userName="Loading..." />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-8 w-24" />
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
