import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/admin/PageHeader'
import { Users, Calendar, DollarSign, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function AdminDashboard() {
  const recentActivity = [
    {
      id: 1,
      type: 'user',
      message: 'New provider registered: Sparkle Clean Co.',
      time: '2 hours ago',
      status: 'pending'
    },
    {
      id: 2,
      type: 'booking',
      message: 'Booking #1234 completed successfully',
      time: '3 hours ago',
      status: 'success'
    },
    {
      id: 3,
      type: 'alert',
      message: 'Provider verification pending review',
      time: '5 hours ago',
      status: 'warning'
    },
    {
      id: 4,
      type: 'payment',
      message: 'Payment processed: $150.00',
      time: '6 hours ago',
      status: 'success'
    }
  ]

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav userType="admin" userName="Admin User" />
      
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          eyebrow="Administration"
          title="Admin Dashboard"
          subtitle="Platform overview and management"
          withBorder
        />

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Total Users</div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold mb-1">12,483</div>
            <div className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>+18% from last month</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Active Providers</div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold mb-1">1,247</div>
            <div className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>+8% from last month</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Total Bookings</div>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold mb-1">34,892</div>
            <div className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>+24% from last month</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Platform Revenue</div>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold mb-1">$248K</div>
            <div className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>+15% from last month</span>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Quick Stats */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Quick Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending Verifications</span>
                <span className="font-semibold">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Bookings Today</span>
                <span className="font-semibold">142</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Dispute Cases Open</span>
                <span className="font-semibold">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg. Customer Rating</span>
                <span className="font-semibold">4.8 / 5.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg. Provider Rating</span>
                <span className="font-semibold">4.7 / 5.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Platform Commission</span>
                <span className="font-semibold">15%</span>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                  <div className="flex-shrink-0 mt-1">
                    {activity.status === 'success' && (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                    {activity.status === 'warning' && (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                    {activity.status === 'pending' && (
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* System Health */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">System Health</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-2">API Response Time</div>
              <div className="text-2xl font-bold text-green-600">142ms</div>
              <div className="text-xs text-muted-foreground mt-1">Normal</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">Database Health</div>
              <div className="text-2xl font-bold text-green-600">100%</div>
              <div className="text-xs text-muted-foreground mt-1">All systems operational</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">Payment Gateway</div>
              <div className="text-2xl font-bold text-green-600">Active</div>
              <div className="text-xs text-muted-foreground mt-1">No issues detected</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
