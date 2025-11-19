'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Shield, 
  FileText, 
  UserCheck, 
  Syringe, 
  Pill, 
  Building2,
  Search,
  Filter
} from 'lucide-react'

interface Verification {
  id: string
  user_id: string
  type: string
  status: string
  vendor?: string
  vendor_ref?: string
  score?: number
  expires_at?: string
  flags?: Record<string, any>
  created_at: string
  updated_at: string
  user?: {
    full_name: string
    email: string
  }
  provider?: {
    business_name: string
    id: string
  }
}

const verificationLabels: Record<string, string> = {
  government_id: 'Government ID',
  face: 'Face Verification',
  background: 'Background Check',
  insurance: 'Insurance',
  drug: 'Drug Test',
  vaccination: 'Vaccination',
  social: 'Social Security',
  reference: 'Reference Check',
}

const statusConfig: Record<string, { 
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  icon: React.ComponentType<{ className?: string }>
}> = {
  pending: { label: 'Pending Review', variant: 'outline', icon: Clock },
  action_required: { label: 'Action Required', variant: 'secondary', icon: AlertCircle },
  passed: { label: 'Approved', variant: 'default', icon: CheckCircle2 },
  failed: { label: 'Rejected', variant: 'destructive', icon: XCircle },
  expired: { label: 'Expired', variant: 'outline', icon: AlertCircle },
}

export function ProviderVerificationReview() {
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'action_required' | 'passed' | 'failed'>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null)

  useEffect(() => {
    loadVerifications()
  }, [filter])

  async function loadVerifications() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('status', filter)
      }
      const res = await fetch(`/api/admin/verifications?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setVerifications(data.verifications || [])
      }
    } catch (error) {
      console.error('Failed to load verifications:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateVerificationStatus(verificationId: string, status: 'passed' | 'failed', notes?: string) {
    try {
      const res = await fetch(`/api/admin/verifications/${verificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      })
      if (res.ok) {
        await loadVerifications()
        setSelectedVerification(null)
        alert('Verification status updated successfully')
      } else {
        alert('Failed to update verification status')
      }
    } catch (error) {
      console.error('Failed to update verification:', error)
      alert('Failed to update verification status')
    }
  }

  const filteredVerifications = verifications.filter(v => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        v.user?.full_name?.toLowerCase().includes(query) ||
        v.user?.email?.toLowerCase().includes(query) ||
        v.provider?.business_name?.toLowerCase().includes(query) ||
        verificationLabels[v.type]?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const pendingCount = verifications.filter(v => v.status === 'pending').length
  const actionRequiredCount = verifications.filter(v => v.status === 'action_required').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Provider Verification Review</h2>
          <p className="text-muted-foreground">Review and approve provider verifications</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Badge variant="outline" className="text-yellow-600">
              {pendingCount} Pending
            </Badge>
          )}
          {actionRequiredCount > 0 && (
            <Badge variant="outline" className="text-orange-600">
              {actionRequiredCount} Action Required
            </Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or business..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={filter} onValueChange={(value: any) => setFilter(value)}>
              <TabsList>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="action_required">Action Required</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Verifications List */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">Loading verifications...</div>
          </CardContent>
        </Card>
      ) : filteredVerifications.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              No verifications found matching your criteria
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredVerifications.map((verification) => {
            const config = statusConfig[verification.status] || statusConfig.pending
            const StatusIcon = config.icon

            return (
              <Card key={verification.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-semibold">
                          {verification.user?.full_name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {verification.user?.email}
                        </div>
                        {verification.provider && (
                          <div className="text-sm text-muted-foreground">
                            Business: {verification.provider.business_name}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={config.variant}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                      <Badge variant="outline">
                        {verificationLabels[verification.type] || verification.type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {verification.vendor_ref && (
                      <div className="text-sm">
                        <strong>Reference:</strong> {verification.vendor_ref}
                      </div>
                    )}
                    {verification.score && (
                      <div className="text-sm">
                        <strong>Score:</strong> {verification.score}
                      </div>
                    )}
                    {verification.expires_at && (
                      <div className="text-sm">
                        <strong>Expires:</strong> {new Date(verification.expires_at).toLocaleDateString()}
                      </div>
                    )}
                    {verification.flags && Object.keys(verification.flags).length > 0 && (
                      <div className="text-sm">
                        <strong>Flags:</strong>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                          {JSON.stringify(verification.flags, null, 2)}
                        </pre>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Submitted: {new Date(verification.created_at).toLocaleString()}
                    </div>
                    {verification.status === 'pending' || verification.status === 'action_required' ? (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => updateVerificationStatus(verification.id, 'passed')}
                          className="flex-1"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateVerificationStatus(verification.id, 'failed')}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedVerification(verification)}
                        >
                          View Details
                        </Button>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground pt-2">
                        Last updated: {new Date(verification.updated_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Detail Modal (simplified - could be a proper modal component) */}
      {selectedVerification && (
        <Card className="fixed inset-4 z-50 overflow-auto bg-background border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Verification Details</CardTitle>
              <Button variant="ghost" onClick={() => setSelectedVerification(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <strong>Provider:</strong> {selectedVerification.user?.full_name}
              </div>
              <div>
                <strong>Type:</strong> {verificationLabels[selectedVerification.type]}
              </div>
              <div>
                <strong>Status:</strong> {statusConfig[selectedVerification.status]?.label}
              </div>
              {selectedVerification.flags && (
                <div>
                  <strong>Details:</strong>
                  <pre className="mt-2 p-4 bg-muted rounded overflow-auto">
                    {JSON.stringify(selectedVerification.flags, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

