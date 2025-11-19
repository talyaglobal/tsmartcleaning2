"use client"

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import Link from 'next/link'
import { createAnonSupabase } from '@/lib/supabase'
import { Search, Filter, X, ChevronLeft, ChevronRight, ArrowUpDown, Eye, FileText } from 'lucide-react'

type Claim = {
  id: string
  claim_code: string
  status: 'filed' | 'under_review' | 'adjuster_assigned' | 'approved' | 'denied' | 'paid'
  incident_type: string
  incident_date: string
  amount_claimed: number | null
  description: string
  created_at: string
  updated_at: string
  user_id: string
  policy_id: string
  insurance_policies?: {
    policy_number: string
  }
  insurance_claim_documents?: Array<{
    id: string
    file_url: string
    file_name: string
    document_type: string
  }>
}

type SortField = 'created_at' | 'incident_date' | 'amount_claimed' | 'status'
type SortDirection = 'asc' | 'desc'

const ITEMS_PER_PAGE = 10

export default function InsuranceClaimsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)

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

  const filteredAndSortedClaims = useMemo(() => {
    let filtered = [...claims]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.claim_code.toLowerCase().includes(query) ||
          c.incident_type.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.insurance_policies?.policy_number?.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'incident_date':
          aValue = new Date(a.incident_date).getTime()
          bValue = new Date(b.incident_date).getTime()
          break
        case 'amount_claimed':
          aValue = a.amount_claimed ?? 0
          bValue = b.amount_claimed ?? 0
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [claims, searchQuery, statusFilter, sortField, sortDirection])

  const paginatedClaims = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredAndSortedClaims.slice(startIndex, endIndex)
  }, [filteredAndSortedClaims, currentPage])

  const totalPages = Math.ceil(filteredAndSortedClaims.length / ITEMS_PER_PAGE)

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchQuery, statusFilter, sortField, sortDirection])

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

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  function formatDate(dateString: string | null | undefined) {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function formatCurrency(amount: number | null | undefined) {
    if (amount === null || amount === undefined) return '—'
    return `$${Number(amount).toFixed(2)}`
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

        {/* Filters and Search */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by claim code, incident type, policy..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="filed">Filed</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="adjuster_assigned">Adjuster Assigned</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select
              value={`${sortField}_${sortDirection}`}
              onValueChange={(value) => {
                const [field, direction] = value.split('_') as [SortField, SortDirection]
                setSortField(field)
                setSortDirection(direction)
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at_desc">Newest First</SelectItem>
                <SelectItem value="created_at_asc">Oldest First</SelectItem>
                <SelectItem value="incident_date_desc">Incident Date (Newest)</SelectItem>
                <SelectItem value="incident_date_asc">Incident Date (Oldest)</SelectItem>
                <SelectItem value="amount_claimed_desc">Amount (High to Low)</SelectItem>
                <SelectItem value="amount_claimed_asc">Amount (Low to High)</SelectItem>
                <SelectItem value="status_asc">Status (A-Z)</SelectItem>
                <SelectItem value="status_desc">Status (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active filters display */}
          {(searchQuery || statusFilter !== 'all') && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-1 hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Status: {statusFilter.replace('_', ' ')}
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="ml-1 hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </Card>

        {/* Results count */}
        {filteredAndSortedClaims.length > 0 && (
          <div className="text-sm text-muted-foreground mb-4">
            Showing {paginatedClaims.length} of {filteredAndSortedClaims.length} claim{filteredAndSortedClaims.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* Claims List */}
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
        ) : filteredAndSortedClaims.length === 0 ? (
          <Card className="p-8">
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔍</div>
              <h2 className="text-xl font-semibold mb-2">No claims found</h2>
              <p className="text-sm text-muted-foreground mb-6">
                No claims match your current filters. Try adjusting your search or filters.
              </p>
              <Button variant="outline" onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
              }}>
                Clear Filters
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedClaims.map((claim) => (
                <Card key={claim.id} className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">Claim #{claim.claim_code || claim.id}</h3>
                        {getStatusBadge(claim.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Filed {formatDate(claim.created_at)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedClaim(claim)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Quick View
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/insurance/claims/${encodeURIComponent(claim.claim_code || claim.id)}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Incident Type</div>
                      <div className="text-sm font-medium">{claim.incident_type || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Incident Date</div>
                      <div className="text-sm font-medium">{formatDate(claim.incident_date)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Amount Claimed</div>
                      <div className="text-sm font-medium">{formatCurrency(claim.amount_claimed)}</div>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
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

      {/* Claim Detail Modal */}
      {selectedClaim && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedClaim(null)
          }}
        >
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-semibold">Claim Details</h2>
                <p className="text-sm text-muted-foreground">{selectedClaim.claim_code}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedClaim(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Section */}
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-3">Status</h3>
                {getStatusBadge(selectedClaim.status)}
              </div>

              {/* Claim Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Incident Type</label>
                  <p className="text-sm font-medium mt-1">{selectedClaim.incident_type}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Incident Date</label>
                  <p className="text-sm font-medium mt-1">{formatDate(selectedClaim.incident_date)}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Amount Claimed</label>
                  <p className="text-sm font-medium mt-1">{formatCurrency(selectedClaim.amount_claimed)}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Policy Number</label>
                  <p className="text-sm font-medium mt-1">
                    {selectedClaim.insurance_policies?.policy_number || '—'}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Filed Date</label>
                  <p className="text-sm font-medium mt-1">{formatDate(selectedClaim.created_at)}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Last Updated</label>
                  <p className="text-sm font-medium mt-1">{formatDate(selectedClaim.updated_at)}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-muted-foreground">Description</label>
                <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">
                  {selectedClaim.description}
                </p>
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-3">Documents</h3>
                {selectedClaim.insurance_claim_documents &&
                selectedClaim.insurance_claim_documents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedClaim.insurance_claim_documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border border-slate-200 rounded-md"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium">{doc.file_name}</p>
                            <p className="text-xs text-muted-foreground">{doc.document_type}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={doc.file_url} target="_blank" rel="noreferrer">
                            View
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No documents uploaded</p>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 flex gap-2">
                <Button variant="outline" asChild className="flex-1">
                  <Link href={`/insurance/claims/${encodeURIComponent(selectedClaim.claim_code || selectedClaim.id)}`}>
                    View Full Details
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedClaim(null)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

