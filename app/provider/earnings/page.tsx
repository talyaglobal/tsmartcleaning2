import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, TrendingUp, CreditCard, Calendar } from 'lucide-react'

export default async function ProviderEarningsPage({
  searchParams,
}: {
  searchParams?: { userId?: string }
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
  const userId = searchParams?.userId || ''
  const res = await fetch(
    `${baseUrl}/api/transactions?role=provider&userId=${encodeURIComponent(userId)}`,
    { cache: 'no-store' }
  )
    .then((r) => r.json())
    .catch(() => ({ transactions: [] }))
  const transactions = (res.transactions || []).map((t: any) => ({
    id: t.id,
    date: (t.created_at || '').slice(0, 10),
    service: t.bookings?.service_id ? `Service #${t.bookings.service_id}` : 'Service',
    customer: t.bookings?.customer_id ? `#${t.bookings.customer_id}` : '-',
    amount: `$${Number(t.amount || 0).toFixed(2)}`,
    status: t.status || 'completed',
  }))
  const totalEarnings =
    (res.transactions || []).reduce((s: number, t: any) => s + Number(t.amount || 0), 0) || 0

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav userType="provider" userName="Sarah Johnson" />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Earnings</h1>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Total Earnings</div>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold mb-1">${totalEarnings.toFixed(2)}</div>
            <div className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>+0% from last month</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">This Month</div>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">
              $
              {(
                (res.transactions || [])
                  .filter((t: any) => (t.created_at || '').slice(0, 7) === new Date().toISOString().slice(0, 7))
                  .reduce((s: number, t: any) => s + Number(t.amount || 0), 0) || 0
              ).toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              {transactions.length} transactions
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Available Balance</div>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">$0.00</div>
            <Button size="sm" className="mt-2">Withdraw</Button>
          </Card>
        </div>

        {/* Payment Method */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Payment Method</h3>
              <p className="text-sm text-muted-foreground">
                Bank Account: •••• 4567
              </p>
            </div>
            <Button variant="outline">Update</Button>
          </div>
        </Card>

        {/* Transaction History */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Service</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Customer</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4 text-sm">{transaction.date}</td>
                      <td className="px-6 py-4 text-sm font-medium">{transaction.service}</td>
                      <td className="px-6 py-4 text-sm">{transaction.customer}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">
                        {transaction.amount}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.status === 'paid'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-yellow-50 text-yellow-700'
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Button variant="ghost" size="sm">View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
