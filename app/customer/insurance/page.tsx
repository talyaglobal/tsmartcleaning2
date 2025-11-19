'use client'

import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorMessage } from '@/components/ui/error-message'
import { SkeletonLoader } from '@/components/ui/skeleton-loader'
import { ErrorFallback } from '@/components/ui/fallback'
import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { createAnonSupabase } from '@/lib/supabase'
import { useRetry } from '@/lib/hooks/use-retry'
import { 
  ShieldCheck, 
  Download, 
  Calendar, 
  AlertCircle, 
  ChevronRight, 
  FileText, 
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Info
} from 'lucide-react'

export default function CustomerInsuranceManagement() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('User')
  const [policy, setPolicy] = useState<any | null>(null)
  const [claims, setClaims] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null)
  
  // Loading states
  const [loading, setLoading] = useState(true)
  const [loadingPolicy, setLoadingPolicy] = useState(false)
  const [loadingClaims, setLoadingClaims] = useState(false)
  const [loadingPlans, setLoadingPlans] = useState(false)
  
  // Error states
  const [error, setError] = useState<Error | null>(null)
  const [policyError, setPolicyError] = useState<Error | null>(null)
  const [claimsError, setClaimsError] = useState<Error | null>(null)
  const [plansError, setPlansError] = useState<Error | null>(null)

  // Fetch functions
  const fetchPolicy = useCallback(async (uid: string) => {
    const res = await fetch(`/api/insurance/policies?user_id=${encodeURIComponent(uid)}`)
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to load policy')
    }
    const data = await res.json()
    return (data.policies || [])[0] || null
  }, [])

  const fetchClaims = useCallback(async (uid: string) => {
    const res = await fetch(`/api/insurance/claims?user_id=${encodeURIComponent(uid)}`)
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to load claims')
    }
    const data = await res.json()
    return data.claims || []
  }, [])

  const fetchPlans = useCallback(async () => {
    const res = await fetch('/api/insurance/plans')
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to load plans')
    }
    const data = await res.json()
    return data.plans || []
  }, [])

  // Retry hooks
  const policyRetry = useRetry(fetchPolicy, { maxRetries: 3 })
  const claimsRetry = useRetry(fetchClaims, { maxRetries: 3 })
  const plansRetry = useRetry(fetchPlans, { maxRetries: 3 })

  const loadData = useCallback(async (uid: string) => {
    setError(null)
    setLoading(true)

    try {
      // Load policy
      setLoadingPolicy(true)
      setPolicyError(null)
      try {
        const policyData = await policyRetry.execute(uid)
        setPolicy(policyData)
      } catch (err) {
        setPolicyError(err as Error)
      } finally {
        setLoadingPolicy(false)
      }

      // Load claims
      setLoadingClaims(true)
      setClaimsError(null)
      try {
        const claimsData = await claimsRetry.execute(uid)
        setClaims(claimsData)
      } catch (err) {
        setClaimsError(err as Error)
      } finally {
        setLoadingClaims(false)
      }

      // Load plans
      setLoadingPlans(true)
      setPlansError(null)
      try {
        const plansData = await plansRetry.execute()
        setPlans(plansData)
      } catch (err) {
        setPlansError(err as Error)
      } finally {
        setLoadingPlans(false)
      }
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [policyRetry, claimsRetry, plansRetry])

  useEffect(() => {
    const supabase = createAnonSupabase()
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data?.user?.id || null
      setUserId(uid)
      
      // Get user name from metadata
      const name = data?.user?.user_metadata?.name || 
                   data?.user?.user_metadata?.full_name || 
                   data?.user?.email?.split('@')[0] || 
                   'User'
      setUserName(name)

      if (uid) {
        await loadData(uid)
      } else {
        setLoading(false)
      }
    }).catch((err) => {
      setError(err as Error)
      setLoading(false)
    })
  }, [loadData])

  // Calculate days until renewal
  const getDaysUntilRenewal = () => {
    if (!policy?.expiration_date) return null
    const expiration = new Date(policy.expiration_date)
    const today = new Date()
    const diffTime = expiration.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysUntilRenewal = getDaysUntilRenewal()
  const showRenewalReminder = daysUntilRenewal !== null && daysUntilRenewal <= 30 && daysUntilRenewal > 0

  // Format currency
  const formatCurrency = (amount: number | string | null) => {
    if (!amount) return '—'
    return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    const normalized = status?.replace('_', ' ').toLowerCase() || ''
    if (normalized.includes('active') || normalized.includes('approved') || normalized.includes('paid')) {
      return <Badge variant="default" className="bg-green-600">{status.replace('_', ' ')}</Badge>
    }
    if (normalized.includes('pending') || normalized.includes('review') || normalized.includes('filed')) {
      return <Badge variant="secondary">{status.replace('_', ' ')}</Badge>
    }
    if (normalized.includes('denied') || normalized.includes('cancelled') || normalized.includes('expired')) {
      return <Badge variant="destructive">{status.replace('_', ' ')}</Badge>
    }
    return <Badge variant="outline">{status.replace('_', ' ')}</Badge>
  }

  // Get available upgrade plans
  const getAvailablePlans = () => {
    if (!policy?.insurance_plans?.code || !plans.length) return []
    const currentCode = policy.insurance_plans.code
    const planOrder = ['basic', 'premium', 'ultimate']
    const currentIndex = planOrder.indexOf(currentCode)
    return plans.filter(p => planOrder.indexOf(p.code) > currentIndex)
  }

  const availableUpgrades = getAvailablePlans()

  // Show error fallback if critical error
  if (error && !userId) {
    return (
      <div className="min-h-screen bg-muted/30">
        <DashboardNav userType="customer" userName={userName} />
        <ErrorFallback 
          error={error} 
          onRetry={() => window.location.reload()} 
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav userType="customer" userName={userName} />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Insurance Protection</h1>
          <p className="text-muted-foreground">Manage your coverage, claims, and documents</p>
        </div>

        {/* Global Error Message */}
        {error && (
          <ErrorMessage
            error={error}
            title="Failed to load data"
            onRetry={() => userId && loadData(userId)}
            onDismiss={() => setError(null)}
            className="mb-6"
          />
        )}

        {/* Renewal Reminder Alert */}
        {showRenewalReminder && policy && (
          <Alert className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-900 dark:text-orange-100">Renewal Reminder</AlertTitle>
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              Your {policy.insurance_plans?.name} plan expires in {daysUntilRenewal} {daysUntilRenewal === 1 ? 'day' : 'days'} on {new Date(policy.expiration_date).toLocaleDateString()}.
              {policy.auto_renew ? (
                ' Your plan will auto-renew unless you cancel.'
              ) : (
                ' Renew now to avoid a coverage gap.'
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Coverage Summary */}
        {loadingPolicy ? (
          <Card className="p-6 mb-6">
            <SkeletonLoader count={3} variant="text" />
          </Card>
        ) : policyError ? (
          <Card className="p-6 mb-6">
            <ErrorMessage
              error={policyError}
              title="Failed to load policy"
              onRetry={() => userId && policyRetry.execute(userId).then(setPolicy).catch(() => {})}
              onDismiss={() => setPolicyError(null)}
            />
          </Card>
        ) : policy ? (
          <>
            <Card className="p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <div className="text-sm text-muted-foreground">Current Plan</div>
                  </div>
                  <div className="text-xl font-semibold mb-1">
                    {policy.insurance_plans?.name} — {getStatusBadge(policy.status)}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Policy Number: <span className="font-mono font-medium">{policy.policy_number}</span></div>
                    <div>Coverage period: {new Date(policy.effective_date).toLocaleDateString()} → {new Date(policy.expiration_date).toLocaleDateString()}</div>
                    <div>Billing: {policy.billing_cycle === 'annual' ? 'Annual' : 'Monthly'} · Auto-renew: {policy.auto_renew ? 'On' : 'Off'}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild>
                    <Link href={`/api/insurance/certificate?name=${encodeURIComponent(userName)}`}>
                      <Download className="h-4 w-4 mr-2" />
                      Certificate
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Policy Details Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Policy Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="coverage">
                    <AccordionTrigger>Coverage Limits & Benefits</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm font-medium">Property Damage</div>
                            <div className="text-lg font-semibold">{formatCurrency(policy.insurance_plans?.property_damage_limit)}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Liability Coverage</div>
                            <div className="text-lg font-semibold">{formatCurrency(policy.insurance_plans?.liability_limit)}</div>
                          </div>
                          {policy.insurance_plans?.theft_limit && (
                            <div>
                              <div className="text-sm font-medium">Theft Protection</div>
                              <div className="text-lg font-semibold">{formatCurrency(policy.insurance_plans.theft_limit)}</div>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm font-medium">Deductible</div>
                            <div className="text-lg font-semibold">{formatCurrency(policy.insurance_plans?.deductible)}</div>
                          </div>
                          {policy.insurance_plans?.key_replacement_limit && (
                            <div>
                              <div className="text-sm font-medium">Key Replacement</div>
                              <div className="text-lg font-semibold">{formatCurrency(policy.insurance_plans.key_replacement_limit)}</div>
                            </div>
                          )}
                          {policy.insurance_plans?.emergency_cleans_per_year !== undefined && (
                            <div>
                              <div className="text-sm font-medium">Emergency Cleans</div>
                              <div className="text-lg font-semibold">{policy.insurance_plans.emergency_cleans_per_year} per year</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="billing">
                    <AccordionTrigger>Billing Information</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Billing Cycle</span>
                          <span className="font-medium">{policy.billing_cycle === 'annual' ? 'Annual' : 'Monthly'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Current Price</span>
                          <span className="font-medium">
                            {formatCurrency(
                              policy.billing_cycle === 'annual' 
                                ? policy.insurance_plans?.annual_price 
                                : policy.insurance_plans?.monthly_price
                            )}
                            /{policy.billing_cycle === 'annual' ? 'year' : 'month'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Auto-Renewal</span>
                          <span className="font-medium">{policy.auto_renew ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Next Renewal Date</span>
                          <span className="font-medium">{new Date(policy.expiration_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </>
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
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="p-5 flex flex-col gap-3">
            <div className="font-semibold">File a Claim</div>
            <div className="text-sm text-muted-foreground">Report an incident and upload evidence.</div>
            <Button asChild><Link href="/insurance/file-claim">Start</Link></Button>
          </Card>
          <Card className="p-5 flex flex-col gap-3">
            <div className="font-semibold">View Certificate</div>
            <div className="text-sm text-muted-foreground">Download your certificate PDF.</div>
            <Button variant="outline" asChild>
              <Link href={`/api/insurance/certificate?name=${encodeURIComponent(userName)}`}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Link>
            </Button>
          </Card>
          {policy && availableUpgrades.length > 0 && (
            <Card className="p-5 flex flex-col gap-3">
              <div className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Upgrade Plan
              </div>
              <div className="text-sm text-muted-foreground">Get more coverage with a higher tier plan.</div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">View Upgrades</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Upgrade Your Insurance Plan</DialogTitle>
                    <DialogDescription>
                      Compare available plans and upgrade to get more coverage and benefits.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {availableUpgrades.map((plan) => (
                      <Card key={plan.id} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{plan.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(policy.billing_cycle === 'annual' ? plan.annual_price : plan.monthly_price)}
                              /{policy.billing_cycle === 'annual' ? 'year' : 'month'}
                            </p>
                          </div>
                          <Badge variant="default">Upgrade</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div>
                            <span className="text-muted-foreground">Property Damage: </span>
                            <span className="font-medium">{formatCurrency(plan.property_damage_limit)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Liability: </span>
                            <span className="font-medium">{formatCurrency(plan.liability_limit)}</span>
                          </div>
                          {plan.theft_limit && (
                            <div>
                              <span className="text-muted-foreground">Theft: </span>
                              <span className="font-medium">{formatCurrency(plan.theft_limit)}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Deductible: </span>
                            <span className="font-medium">{formatCurrency(plan.deductible)}</span>
                          </div>
                        </div>
                        <Button asChild className="w-full">
                          <Link href={`/insurance?upgrade=${plan.code}`}>Upgrade to {plan.name}</Link>
                        </Button>
                      </Card>
                    ))}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" asChild>
                      <Link href="/insurance#pricing">View All Plans</Link>
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </Card>
          )}
          {(!policy || availableUpgrades.length === 0) && (
            <Card className="p-5 flex flex-col gap-3">
              <div className="font-semibold">Upgrade/Downgrade</div>
              <div className="text-sm text-muted-foreground">
                {policy ? 'You\'re on the highest tier plan.' : 'Change plan tier at renewal.'}
              </div>
              <Button variant="outline" disabled>Manage</Button>
            </Card>
          )}
        </div>

        {/* Claims History */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-3">Claims History</h2>
          <Card className="p-6">
            {loadingClaims ? (
              <SkeletonLoader count={3} variant="list" />
            ) : claimsError ? (
              <ErrorMessage
                error={claimsError}
                title="Failed to load claims"
                onRetry={() => userId && claimsRetry.execute(userId).then(setClaims).catch(() => {})}
                onDismiss={() => setClaimsError(null)}
              />
            ) : claims.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <div className="text-sm text-muted-foreground mb-4">No claims yet.</div>
                <Button asChild variant="outline">
                  <Link href="/insurance/file-claim">File Your First Claim</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {claims.map((claim) => (
                  <Card key={claim.id} className="p-4">
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedClaim(expandedClaim === claim.id ? null : claim.id)}
                    >
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Claim ID</div>
                          <div className="font-mono text-sm font-medium">{claim.claim_code}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Type</div>
                          <div className="text-sm">{claim.incident_type}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Filed</div>
                          <div className="text-sm">{new Date(claim.created_at).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Status</div>
                          <div>{getStatusBadge(claim.status)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Amount</div>
                          <div className="text-sm font-medium">{formatCurrency(claim.amount_claimed)}</div>
                        </div>
                      </div>
                      <ChevronRight 
                        className={`h-5 w-5 text-muted-foreground transition-transform ${
                          expandedClaim === claim.id ? 'rotate-90' : ''
                        }`}
                      />
                    </div>
                    {expandedClaim === claim.id && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Incident Date</div>
                          <div className="text-sm">
                            {new Date(claim.incident_date).toLocaleDateString()}
                            {claim.incident_time && ` at ${claim.incident_time}`}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Description</div>
                          <div className="text-sm">{claim.description}</div>
                        </div>
                        {claim.insurance_policies && (
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Policy Number</div>
                            <div className="text-sm font-mono">{claim.insurance_policies.policy_number}</div>
                          </div>
                        )}
                        {claim.insurance_claim_documents && claim.insurance_claim_documents.length > 0 && (
                          <div>
                            <div className="text-xs text-muted-foreground mb-2">Documents</div>
                            <div className="flex flex-wrap gap-2">
                              {claim.insurance_claim_documents.map((doc: any) => (
                                <Badge key={doc.id} variant="outline" className="text-xs">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {doc.file_name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/customer/insurance/claims/${claim.id}`}>View Details</Link>
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
