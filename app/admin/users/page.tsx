import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, MoreVertical } from 'lucide-react'

export default async function AdminUsersPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
  const [customersRes, providersRes] = await Promise.all([
    fetch(`${baseUrl}/api/admin/users?role=customer&limit=20`, {
      cache: 'no-store',
    }).then((r) => r.json()).catch(() => ({ users: [] })),
    fetch(`${baseUrl}/api/providers`, { cache: 'no-store' })
      .then((r) => r.json())
      .catch(() => ({ providers: [] })),
  ])
  const customers = (customersRes.users || []).map((u: any) => ({
    id: u.id,
    name: u.full_name || u.email,
    email: u.email,
    joined: u.created_at ? new Date(u.created_at).toISOString().slice(0, 10) : '',
    bookings: u.total_bookings ?? 0,
    spent: u.total_spent ? `$${u.total_spent}` : '$0',
    status: 'active',
  }))
  const providers = (providersRes.providers || []).map((p: any) => ({
    id: p.id,
    name: p.business_name,
    owner: p.owner_name || '-', // not in schema; placeholder
    email: p.contact_email || '-', // not in schema; placeholder
    joined: p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : '',
    jobs: p.total_bookings ?? 0,
    rating: p.rating ?? 0,
    status: p.is_verified ? 'verified' : 'pending',
  }))

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav userType="admin" userName="Admin User" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">Manage customers and service providers</p>
        </div>

        <Tabs defaultValue="customers" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="customers">
                Customers <Badge className="ml-2" variant="secondary">11,236</Badge>
              </TabsTrigger>
              <TabsTrigger value="providers">
                Providers <Badge className="ml-2" variant="secondary">1,247</Badge>
              </TabsTrigger>
            </TabsList>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." className="pl-9" />
            </div>
          </div>

          <TabsContent value="customers">
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Joined</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Bookings</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Total Spent</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-muted/30">
                        <td className="px-6 py-4 text-sm font-medium">{customer.name}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{customer.email}</td>
                        <td className="px-6 py-4 text-sm">{customer.joined}</td>
                        <td className="px-6 py-4 text-sm">{customer.bookings}</td>
                        <td className="px-6 py-4 text-sm font-semibold">{customer.spent}</td>
                        <td className="px-6 py-4 text-sm">
                          <Badge variant="secondary">{customer.status}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="providers">
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium">Business Name</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Owner</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Joined</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Jobs</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Rating</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {providers.map((provider) => (
                      <tr key={provider.id} className="hover:bg-muted/30">
                        <td className="px-6 py-4 text-sm font-medium">{provider.name}</td>
                        <td className="px-6 py-4 text-sm">{provider.owner}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{provider.email}</td>
                        <td className="px-6 py-4 text-sm">{provider.joined}</td>
                        <td className="px-6 py-4 text-sm">{provider.jobs}</td>
                        <td className="px-6 py-4 text-sm">
                          {provider.rating > 0 ? provider.rating.toFixed(1) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Badge
                            variant={provider.status === 'verified' ? 'secondary' : 'outline'}
                            className={provider.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                          >
                            {provider.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {provider.status === 'pending' ? (
                            <Button variant="outline" size="sm">
                              Review
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
