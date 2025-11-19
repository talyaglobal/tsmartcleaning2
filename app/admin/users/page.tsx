import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { UserManagement } from '@/components/admin/UserManagement'

export default async function AdminUsersPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
  const [customersRes, providersRes] = await Promise.all([
    fetch(`${baseUrl}/api/admin/users?role=customer&limit=50`, {
      cache: 'no-store',
    }).then((r) => r.json()).catch(() => ({ users: [], total: 0 })),
    fetch(`${baseUrl}/api/providers`, { cache: 'no-store' })
      .then((r) => r.json())
      .catch(() => ({ providers: [], total: 0 })),
  ])
  
  const customers = customersRes.users || []
  const providers = providersRes.providers || []
  const customersTotal = customersRes.total || 0
  const providersTotal = providersRes.total || providers.length

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav userType="admin" userName="Admin User" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">Manage customers and service providers</p>
        </div>

        <UserManagement
          initialCustomers={customers}
          initialProviders={providers}
          customersTotal={customersTotal}
          providersTotal={providersTotal}
        />
      </div>
    </div>
  )
}
