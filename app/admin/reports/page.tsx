import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Download, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react'

export default function AdminReportsPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav userType="admin" userName="Admin User" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
            <p className="text-muted-foreground">Platform performance and insights</p>
          </div>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Revenue Overview */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Revenue Overview</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Last 7 Days</Button>
              <Button variant="outline" size="sm">Last 30 Days</Button>
              <Button variant="default" size="sm">Last 12 Months</Button>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-2">Total Revenue</div>
              <div className="text-3xl font-bold mb-1">$248,392</div>
              <div className="text-xs text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>+15% from last period</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">Platform Commission</div>
              <div className="text-3xl font-bold mb-1">$37,259</div>
              <div className="text-xs text-muted-foreground">15% commission rate</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">Avg. Booking Value</div>
              <div className="text-3xl font-bold mb-1">$127</div>
              <div className="text-xs text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>+3% from last period</span>
              </div>
            </div>
          </div>
          <div className="mt-6 h-64 flex items-center justify-center bg-muted/30 rounded-lg">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
              <p>Revenue chart visualization would appear here</p>
            </div>
          </div>
        </Card>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">User Growth</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Users</span>
                  <span className="font-semibold">12,483</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '75%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Active Providers</span>
                  <span className="font-semibold">1,247</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '62%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">New This Month</span>
                  <span className="font-semibold">284</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-600" style={{ width: '45%' }} />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Booking Statistics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Total Bookings</span>
                </div>
                <span className="font-semibold">34,892</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Completed</span>
                </div>
                <span className="font-semibold">32,145</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Cancelled</span>
                </div>
                <span className="font-semibold">432</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Success Rate</span>
                </div>
                <span className="font-semibold text-green-600">98.7%</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Service Breakdown */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Service Type Breakdown</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-2">Residential Cleaning</div>
              <div className="text-2xl font-bold mb-2">58%</div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '58%' }} />
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">Commercial Cleaning</div>
              <div className="text-2xl font-bold mb-2">28%</div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '28%' }} />
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">Specialized Services</div>
              <div className="text-2xl font-bold mb-2">14%</div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '14%' }} />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
