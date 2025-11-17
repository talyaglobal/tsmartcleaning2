"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { createAnonSupabase } from '@/lib/supabase'
import type { Metadata } from 'next'

export default function InsuranceClaimsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createAnonSupabase()
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data?.user?.id || null
      setUserId(uid)
      if (uid) {
        try {
          const res = await fetch(`/api/insurance/claims?user_id=${encodeURIComponent(uid)}`)
          const data = await res.json()
          setClaims(data.claims || [])
        } catch (error) {
          console.error('Error fetching claims:', error)
        }
      }
      setLoading(false)
    })
  }, [])

  function getStatusBadge(status: string) {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      filed: { label: 'Filed', variant: 'default' },
      under_review: { label: 'Under Review', variant: 'secondary' },
      adjuster_assigned: { label: 'Adjuster Assigned', variant: 'secondary' },
      approved: { label: 'Approved', variant: 'default' },
      denied: { label: 'Denied', variant: 'outline' },
      paid: { label: 'Paid', variant: 'default' },
    }
    const statusInfo = statusMap[status.toLowerCase()] || { label: status, variant: 'outline' as const }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <h1 className="text-3xl font-bold mb-6">My Claims</h1>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">Loading claims...</div>
          </Card>
        </div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <h1 className="text-3xl font-bold mb-6">My Claims</h1>
          <Card className="p-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Please sign in to view your insurance claims.</p>
              <div className="flex gap-2 justify-center">
                <Button asChild><Link href="/login">Sign In</Link></Button>
                <Button variant="outline" asChild><Link href="/signup">Create Account</Link></Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Claims</h1>
            <p className="text-muted-foreground">View and track your insurance claims</p>
          </div>
          <Button asChild>
            <Link href="/insurance/file-claim">File New Claim</Link>
          </Button>
        </div>

        {claims.length === 0 ? (
          <Card className="p-8">
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📋</div>
              <h2 className="text-xl font-semibold mb-2">No claims yet</h2>
              <p className="text-sm text-muted-foreground mb-6">
                You haven't filed any insurance claims. If you need to file a claim, click the button below.
              </p>
              <Button asChild>
                <Link href="/insurance/file-claim">File a Claim</Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => (
              <Card key={claim.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">Claim #{claim.claim_code || claim.id}</h3>
                      {getStatusBadge(claim.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Filed {new Date(claim.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/insurance/claims/${encodeURIComponent(claim.claim_code || claim.id)}`}>
                      View Details
                    </Link>
                  </Button>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Incident Type</div>
                    <div className="text-sm font-medium">{claim.incident_type || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Incident Date</div>
                    <div className="text-sm font-medium">
                      {claim.incident_date
                        ? new Date(claim.incident_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Amount Claimed</div>
                    <div className="text-sm font-medium">
                      {claim.amount_claimed ? `$${Number(claim.amount_claimed).toFixed(2)}` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Policy</div>
                    <div className="text-sm font-medium">
                      {claim.insurance_policies?.policy_number || '—'}
                    </div>
                  </div>
                </div>

                {claim.description && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-xs text-muted-foreground mb-1">Description</div>
                    <div className="text-sm text-muted-foreground line-clamp-2">{claim.description}</div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Card className="p-6 bg-secondary/40">
            <h3 className="font-semibold mb-2">Need to file a claim?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              If you've experienced an incident during a cleaning service, you can file a claim online.
              Our team will review it and get back to you within 2 business days.
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/insurance/file-claim">File a Claim</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/insurance">Learn About Coverage</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

