"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { createAnonSupabase } from '@/lib/supabase'
import { ArrowLeft, FileText, Download, Calendar, DollarSign, Shield, AlertCircle } from 'lucide-react'

export default function ClaimStatusPage({ params }: { params: { claimId: string } }) {
  const claimId = params.claimId
  const [userId, setUserId] = useState<string | null>(null)
  const [claim, setClaim] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createAnonSupabase()
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data?.user?.id || null
      setUserId(uid)
      
      if (!uid) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/insurance/claims/${encodeURIComponent(claimId)}`)
        const data = await res.json()
        
        if (!res.ok) {
          throw new Error(data?.error || 'Failed to fetch claim')
        }
        
        setClaim(data.claim)
      } catch (err: any) {
        console.error('Error fetching claim:', err)
        setError(err.message || 'Failed to load claim')
      } finally {
        setLoading(false)
      }
    })
  }, [claimId])

  function getStatusBadge(status: string) {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      filed: { label: 'Filed', variant: 'default' },
      under_review: { label: 'Under Review', variant: 'secondary' },
      adjuster_assigned: { label: 'Adjuster Assigned', variant: 'secondary' },
      approved: { label: 'Approved', variant: 'default' },
      denied: { label: 'Denied', variant: 'destructive' },
      paid: { label: 'Paid', variant: 'default' },
    }
    const statusInfo = statusMap[status?.toLowerCase()] || { label: status || 'Unknown', variant: 'outline' as const }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  function formatDate(dateString: string | null | undefined) {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  function formatDateTime(dateString: string | null | undefined) {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  function formatCurrency(amount: number | string | null | undefined) {
    if (amount === null || amount === undefined) return '—'
    return `$${Number(amount).toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/insurance/claims">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Claims
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-6">Claim Details</h1>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">Loading claim details...</div>
          </Card>
        </div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/insurance/claims">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Claims
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-6">Claim Details</h1>
          <Card className="p-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Please sign in to view claim details.</p>
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

  if (error || !claim) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/insurance/claims">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Claims
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-6">Claim Details</h1>
          <Card className="p-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Unable to load claim</h2>
              <p className="text-sm text-muted-foreground mb-6">
                {error || 'Claim not found or you do not have permission to view it.'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" asChild>
                  <Link href="/insurance/claims">Back to Claims</Link>
                </Button>
                <Button asChild>
                  <Link href="/insurance/file-claim">File New Claim</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const timeline = claim.timeline || []
  const documents = claim.insurance_claim_documents || []
  const policy = claim.insurance_policies

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/insurance/claims">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Claims
            </Link>
          </Button>
        </div>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Claim #{claim.claim_code || claim.id}</h1>
            <p className="text-muted-foreground">Filed {formatDate(claim.created_at)}</p>
          </div>
          {getStatusBadge(claim.status)}
        </div>

        {/* Status Timeline */}
        <Card className="p-6 mb-6">
          <div className="font-semibold mb-4">Status Timeline</div>
          <div className="mt-4 flex items-center justify-between">
            {timeline.map((t: any, idx: number) => (
              <div key={t.status} className="flex-1 flex items-center">
                <div className={`size-3 rounded-full ${t.done ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                {idx < timeline.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 ${t.done ? 'bg-primary' : 'bg-muted-foreground/20'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            {timeline.map((t: any) => (
              <div key={t.status} className="text-center flex-1">
                <div>{t.label}</div>
                {t.timestamp && (
                  <div className="text-[10px] mt-1 opacity-75">
                    {new Date(t.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Claim Information */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Claim Information
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">Incident Type</div>
                <div className="font-medium">{claim.incident_type || '—'}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Incident Date</div>
                <div className="font-medium">{formatDate(claim.incident_date)}</div>
              </div>
              {claim.incident_time && (
                <div>
                  <div className="text-muted-foreground mb-1">Incident Time</div>
                  <div className="font-medium">{claim.incident_time}</div>
                </div>
              )}
              <div>
                <div className="text-muted-foreground mb-1">Amount Claimed</div>
                <div className="font-medium text-lg">{formatCurrency(claim.amount_claimed)}</div>
              </div>
              {claim.amount_paid !== null && claim.amount_paid !== undefined && (
                <div>
                  <div className="text-muted-foreground mb-1">Amount Paid</div>
                  <div className="font-medium text-lg text-primary">{formatCurrency(claim.amount_paid)}</div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Policy Information
            </h3>
            <div className="space-y-4 text-sm">
              {policy && (
                <>
                  <div>
                    <div className="text-muted-foreground mb-1">Policy Number</div>
                    <div className="font-medium">{policy.policy_number || '—'}</div>
                  </div>
                  {policy.insurance_plans && (
                    <div>
                      <div className="text-muted-foreground mb-1">Plan</div>
                      <div className="font-medium">{policy.insurance_plans.name || policy.insurance_plans.code || '—'}</div>
                    </div>
                  )}
                  {policy.effective_date && (
                    <div>
                      <div className="text-muted-foreground mb-1">Effective Date</div>
                      <div className="font-medium">{formatDate(policy.effective_date)}</div>
                    </div>
                  )}
                  {policy.status && (
                    <div>
                      <div className="text-muted-foreground mb-1">Policy Status</div>
                      <Badge variant={policy.status === 'active' ? 'default' : 'outline'}>
                        {policy.status}
                      </Badge>
                    </div>
                  )}
                </>
              )}
              {!policy && (
                <div className="text-muted-foreground">No policy information available</div>
              )}
            </div>
          </Card>
        </div>

        {/* Description */}
        {claim.description && (
          <Card className="p-6 mb-6">
            <h3 className="font-semibold mb-4">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{claim.description}</p>
          </Card>
        )}

        {/* Documents */}
        {documents.length > 0 && (
          <Card className="p-6 mb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Supporting Documents
            </h3>
            <div className="space-y-2">
              {documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{doc.file_name}</div>
                      {doc.size_bytes && (
                        <div className="text-xs text-muted-foreground">
                          {(doc.size_bytes / 1024).toFixed(1)} KB
                        </div>
                      )}
                    </div>
                  </div>
                  {doc.storage_path && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`/api/insurance/claims/${encodeURIComponent(claimId)}/documents?path=${encodeURIComponent(doc.storage_path)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        View
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Additional Details */}
        <Card className="p-6 mb-6">
          <h3 className="font-semibold mb-4">Additional Details</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground mb-1">Claim ID</div>
              <div className="font-mono text-xs">{claim.id}</div>
            </div>
            {claim.claim_code && (
              <div>
                <div className="text-muted-foreground mb-1">Claim Code</div>
                <div className="font-mono text-xs">{claim.claim_code}</div>
              </div>
            )}
            <div>
              <div className="text-muted-foreground mb-1">Created</div>
              <div className="font-medium">{formatDateTime(claim.created_at)}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Last Updated</div>
              <div className="font-medium">{formatDateTime(claim.updated_at)}</div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/insurance/file-claim">File New Claim</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/insurance/claims">View All Claims</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/insurance">Learn About Coverage</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
