"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ClaimStatusPage({ params }: { params: { claimId: string } }) {
  const claimId = params.claimId
  const prettyId = decodeURIComponent(claimId)
  const [claim, setClaim] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchClaim()
  }, [claimId])

  async function fetchClaim() {
    try {
      setLoading(true)
      const res = await fetch(`/api/insurance/claims/${encodeURIComponent(claimId)}`)
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load claim')
      }
      setClaim(data.claim)
    } catch (e: any) {
      setError(e?.message || 'Failed to load claim')
    } finally {
      setLoading(false)
    }
  }

  function getStatusBadge(status: string) {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      filed: { label: 'Filed', variant: 'default' },
      under_review: { label: 'Under Review', variant: 'secondary' },
      adjuster_assigned: { label: 'Adjuster Assigned', variant: 'secondary' },
      approved: { label: 'Approved', variant: 'default' },
      denied: { label: 'Denied', variant: 'destructive' },
      paid: { label: 'Paid', variant: 'default' },
    }
    const statusInfo = statusMap[status.toLowerCase()] || { label: status, variant: 'outline' as const }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <h1 className="text-3xl font-bold mb-2">Claim Status</h1>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">Loading claim details...</div>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !claim) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <h1 className="text-3xl font-bold mb-2">Claim Status</h1>
          <Card className="p-6">
            <div className="text-sm text-destructive mb-4">{error || 'Claim not found'}</div>
            <Button variant="outline" asChild>
              <Link href="/insurance/claims">Back to Claims</Link>
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  const timeline = claim.timeline || []

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Claim Status</h1>
            <p className="text-muted-foreground">Claim ID: {claim.claim_code || prettyId}</p>
          </div>
          {getStatusBadge(claim.status)}
        </div>

        <Card className="p-6 mb-6">
          <div className="font-semibold mb-4">Status Timeline</div>
          <div className="mt-4 flex items-center justify-between">
            {timeline.map((t: any, idx: number) => (
              <div key={t.status} className="flex-1 flex items-center">
                <div className={`size-3 rounded-full ${t.done ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                {idx < timeline.length - 1 && <div className="h-0.5 flex-1 bg-muted-foreground/20 mx-2" />}
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            {timeline.map((t: any) => <div key={t.status}>{t.label}</div>)}
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <div className="grid sm:grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <div className="text-muted-foreground mb-1">Incident Type</div>
              <div className="font-medium">{claim.incident_type || '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Filed Date</div>
              <div className="font-medium">
                {claim.created_at
                  ? new Date(claim.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '—'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Incident Date</div>
              <div className="font-medium">
                {claim.incident_date
                  ? new Date(claim.incident_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '—'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Amount Claimed</div>
              <div className="font-medium">
                {claim.amount_claimed ? `$${Number(claim.amount_claimed).toFixed(2)}` : '—'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Policy Number</div>
              <div className="font-medium">
                {claim.insurance_policies?.policy_number || '—'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Plan</div>
              <div className="font-medium">
                {claim.insurance_policies?.insurance_plans?.name || '—'}
              </div>
            </div>
          </div>

          {claim.description && (
            <div className="mt-6 pt-6 border-t">
              <div className="text-muted-foreground mb-2">Description</div>
              <div className="text-sm">{claim.description}</div>
            </div>
          )}

          {claim.insurance_claim_documents && claim.insurance_claim_documents.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <div className="text-muted-foreground mb-2">Documents</div>
              <ul className="text-sm space-y-1">
                {claim.insurance_claim_documents.map((doc: any) => (
                  <li key={doc.id} className="text-muted-foreground">
                    {doc.file_name} ({doc.size_bytes ? `${(doc.size_bytes / 1024).toFixed(1)} KB` : '—'})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/insurance/claims">Back to Claims</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/insurance/file-claim">File New Claim</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}


