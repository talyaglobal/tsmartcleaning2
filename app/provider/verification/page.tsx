import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Clock, AlertCircle, Shield, FileText, UserCheck, Syringe, Pill, Building2 } from 'lucide-react'
import { createServerSupabase } from '@/lib/supabase'
import EnsureDashboardUser from '@/components/auth/EnsureDashboardUser'
import Link from 'next/link'

const verificationIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  government_id: FileText,
  face: UserCheck,
  background: Shield,
  insurance: Building2,
  drug: Pill,
  vaccination: Syringe,
  social: UserCheck,
  reference: UserCheck,
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

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'Pending', variant: 'outline', icon: Clock },
  action_required: { label: 'Action Required', variant: 'secondary', icon: AlertCircle },
  passed: { label: 'Verified', variant: 'default', icon: CheckCircle2 },
  failed: { label: 'Failed', variant: 'destructive', icon: XCircle },
  expired: { label: 'Expired', variant: 'outline', icon: AlertCircle },
}

export default async function ProviderVerificationPage({
  searchParams,
}: {
  searchParams?: { userId?: string }
}) {
  const userId = searchParams?.userId || ''
  const supabase = createServerSupabase()

  let providerProfile: any = null
  let verifications: any[] = []
  let verificationSummary: Record<string, string> = {}

  if (userId) {
    // Get provider profile
    const { data: profile } = await supabase
      .from('provider_profiles')
      .select('*, users:profiles!provider_profiles_user_id_fkey(full_name)')
      .eq('user_id', userId)
      .single()
    providerProfile = profile

    // Get verification status
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    try {
      const res = await fetch(
        `${baseUrl}/api/verification/status?userId=${encodeURIComponent(userId)}`,
        { cache: 'no-store' }
      ).then((r) => r.json()).catch(() => ({ verifications: [], summary: {} }))
      
      verifications = res.verifications || []
      verificationSummary = res.summary || {}
    } catch (error) {
      console.error('Error fetching verification status:', error)
    }
  }

  const requiredVerifications = ['government_id', 'face', 'background', 'insurance']
  const optionalVerifications = ['drug', 'vaccination', 'social', 'reference']

  const getVerificationStatus = (type: string) => {
    return verificationSummary[type] || 'pending'
  }

  const allRequiredPassed = requiredVerifications.every(
    (type) => getVerificationStatus(type) === 'passed'
  )

  const verificationProgress = {
    total: requiredVerifications.length,
    completed: requiredVerifications.filter(
      (type) => getVerificationStatus(type) === 'passed'
    ).length,
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <EnsureDashboardUser paramKey="userId" />
      <DashboardNav userType="provider" userName={providerProfile?.users?.full_name || "Provider"} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Verification Status</h1>
          <p className="text-muted-foreground">Complete your verification to start accepting bookings</p>
        </div>

        {/* Verification Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Verification Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {verificationProgress.completed} of {verificationProgress.total} required verifications completed
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round((verificationProgress.completed / verificationProgress.total) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all"
                    style={{ width: `${(verificationProgress.completed / verificationProgress.total) * 100}%` }}
                  />
                </div>
              </div>
              
              {allRequiredPassed && (
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-md">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium text-green-900">All verifications complete!</div>
                    <div className="text-sm text-green-700">You're ready to accept bookings.</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Required Verifications */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Required Verifications</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {requiredVerifications.map((type) => {
              const status = getVerificationStatus(type)
              const config = statusConfig[status] || statusConfig.pending
              const Icon = verificationIcons[type] || FileText
              const StatusIcon = config.icon
              const verification = verifications.find((v: any) => v.type === type)

              return (
                <Card key={type}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <CardTitle className="text-lg">{verificationLabels[type]}</CardTitle>
                      </div>
                      <Badge variant={config.variant}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {verification?.expires_at && (
                        <div className="text-sm text-muted-foreground">
                          Expires: {new Date(verification.expires_at).toLocaleDateString()}
                        </div>
                      )}
                      {verification?.vendor_ref && (
                        <div className="text-sm text-muted-foreground">
                          Reference: {verification.vendor_ref}
                        </div>
                      )}
                      {status === 'pending' && (
                        <Button asChild>
                          <Link href={`/provider/verification/${type}?userId=${userId}`}>
                            Start Verification
                          </Link>
                        </Button>
                      )}
                      {status === 'action_required' && (
                        <Button variant="outline" asChild>
                          <Link href={`/provider/verification/${type}?userId=${userId}`}>
                            Complete Verification
                          </Link>
                        </Button>
                      )}
                      {status === 'failed' && (
                        <Button variant="outline" asChild>
                          <Link href={`/provider/verification/${type}?userId=${userId}`}>
                            Retry Verification
                          </Link>
                        </Button>
                      )}
                      {status === 'expired' && (
                        <Button variant="outline" asChild>
                          <Link href={`/provider/verification/${type}?userId=${userId}`}>
                            Renew Verification
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Optional Verifications */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Optional Verifications</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {optionalVerifications.map((type) => {
              const status = getVerificationStatus(type)
              const config = statusConfig[status] || statusConfig.pending
              const Icon = verificationIcons[type] || FileText
              const StatusIcon = config.icon
              const verification = verifications.find((v: any) => v.type === type)

              return (
                <Card key={type}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <CardTitle className="text-lg">{verificationLabels[type]}</CardTitle>
                      </div>
                      <Badge variant={config.variant}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {verification?.expires_at && (
                        <div className="text-sm text-muted-foreground">
                          Expires: {new Date(verification.expires_at).toLocaleDateString()}
                        </div>
                      )}
                      {status === 'pending' && (
                        <Button variant="outline" asChild>
                          <Link href={`/provider/verification/${type}?userId=${userId}`}>
                            Start Verification
                          </Link>
                        </Button>
                      )}
                      {status === 'action_required' && (
                        <Button variant="outline" asChild>
                          <Link href={`/provider/verification/${type}?userId=${userId}`}>
                            Complete Verification
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

