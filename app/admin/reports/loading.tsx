import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminReportsLoading() {
  return (
    <div className="min-h-screen bg-white">
      <DashboardNav userType="admin" userName="Admin User" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-8 w-24 mb-1" />
              <Skeleton className="h-4 w-20" />
            </Card>
          ))}
        </div>

        <Card className="p-6 mb-6">
          <Skeleton className="h-64 w-full" />
        </Card>

        <Card className="p-6">
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    </div>
  )
}
