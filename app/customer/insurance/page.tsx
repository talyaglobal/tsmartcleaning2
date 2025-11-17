'use client'

import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createAnonSupabase } from '@/lib/supabase'

export default function CustomerInsuranceManagement() {
  const [userId, setUserId] = useState<string | null>(null)
  const [policy, setPolicy] = useState<any | null>(null)
  const [claims, setClaims] = useState<any[]>([])

  useEffect(() => {
    const supabase = createAnonSupabase()
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data?.user?.id || null
      setUserId(uid)
      if (uid) {
        const polRes = await fetch(`/api/insurance/policies?user_id=${encodeURIComponent(uid)}`)
        const polData = await polRes.json()
        setPolicy((polData.policies || [])[0] || null)
        const clRes = await fetch(`/api/insurance/claims?user_id=${encodeURIComponent(uid)}`)
        const clData = await clRes.json()
        setClaims(clData.claims || [])
      }
    })
  }, [])

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav userType="customer" userName="User" />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Insurance Protection</h1>
          <p className="text-muted-foreground">Manage your coverage, claims, and documents</p>
        </div>

        {/* Coverage Summary */}
        {policy ? (
          <Card className="p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Current Plan</div>
                <div className="text-xl font-semibold">
                  {policy.insurance_plans?.name} — {policy.status?.replace('_',' ')}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Coverage period: {policy.effective_date} → {policy.expiration_date} · Auto-renew: {policy.auto_renew ? 'On' : 'Off'}
                </div>
              </div>
              <div className="flex gap-2">
                <Button asChild><Link href={`/api/insurance/certificate?name=${encodeURIComponent('User')}`}>View Certificate</Link></Button>
                <Button variant="outline" disabled>Manage</Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Current Plan</div>
                <div className="text-xl font-semibold">No active insurance</div>
                <div className="text-sm text-muted-foreground mt-1">Add protection to unlock coverage and fast claims.</div>
              </div>
              <div className="flex gap-2">
                <Button asChild><Link href="/insurance#pricing">Compare Plans</Link></Button>
                <Button variant="outline" asChild><Link href="/insurance">Learn More</Link></Button>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-5 flex flex-col gap-3">
            <div className="font-semibold">File a Claim</div>
            <div className="text-sm text-muted-foreground">Report an incident and upload evidence.</div>
            <Button asChild><Link href="/insurance/file-claim">Start</Link></Button>
          </Card>
          <Card className="p-5 flex flex-col gap-3">
            <div className="font-semibold">View Certificate</div>
            <div className="text-sm text-muted-foreground">Download your certificate PDF.</div>
            <Button variant="outline" asChild><Link href={`/api/insurance/certificate?name=${encodeURIComponent('User')}`}>Download</Link></Button>
          </Card>
          <Card className="p-5 flex flex-col gap-3">
            <div className="font-semibold">Upgrade/Downgrade</div>
            <div className="text-sm text-muted-foreground">Change plan tier at renewal.</div>
            <Button variant="outline" disabled>Manage</Button>
          </Card>
        </div>

        {/* Claims History */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-3">Claims History</h2>
          <Card className="p-6">
            {claims.length === 0 ? (
              <div className="text-sm text-muted-foreground">No claims yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2">Claim ID</th>
                      <th className="py-2">Type</th>
                      <th className="py-2">Filed</th>
                      <th className="py-2">Status</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.map((c) => (
                      <tr key={c.id} className="border-t">
                        <td className="py-2">{c.claim_code}</td>
                        <td className="py-2">{c.incident_type}</td>
                        <td className="py-2">{new Date(c.created_at).toLocaleDateString()}</td>
                        <td className="py-2">{c.status.replace('_',' ')}</td>
                        <td className="py-2 text-right">{c.amount_claimed ? `$${Number(c.amount_claimed).toFixed(2)}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}


