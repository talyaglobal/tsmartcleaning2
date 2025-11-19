'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
  Upload,
  Eye
} from 'lucide-react'
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

const statusConfig: Record<string, { 
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  icon: React.ComponentType<{ className?: string }>
  color: string
}> = {
  pending: { label: 'Pending', variant: 'outline', icon: Clock, color: 'text-yellow-600' },
  action_required: { label: 'Action Required', variant: 'secondary', icon: AlertCircle, color: 'text-orange-600' },
  passed: { label: 'Verified', variant: 'default', icon: CheckCircle2, color: 'text-green-600' },
  failed: { label: 'Failed', variant: 'destructive', icon: XCircle, color: 'text-red-600' },
  expired: { label: 'Expired', variant: 'outline', icon: AlertCircle, color: 'text-gray-600' },
}

interface Verification {
  id: string
  type: string
  status: string
  vendor?: string
  vendor_ref?: string
  score?: number
  expires_at?: string
  flags?: Record<string, any>
  created_at: string
  updated_at: string
}

interface ProviderVerificationWorkflowProps {
  userId: string
  providerId?: string
}

export function ProviderVerificationWorkflow({ userId, providerId }: ProviderVerificationWorkflowProps) {
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<Record<string, string>>({})

  useEffect(() => {
    loadVerifications()
  }, [userId])

  async function loadVerifications() {
    setLoading(true)
    try {
      const res = await fetch(`/api/verification/status?userId=${encodeURIComponent(userId)}`)
      if (res.ok) {
        const data = await res.json()
        setVerifications(data.verifications || [])
        setSummary(data.summary || {})
      }
    } catch (error) {
      console.error('Failed to load verifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const requiredVerifications = ['government_id', 'face', 'background', 'insurance']
  const optionalVerifications = ['drug', 'vaccination', 'social', 'reference']

  const getVerificationStatus = (type: string) => {
    return summary[type] || 'pending'
  }

  const getVerification = (type: string) => {
    return verifications.find(v => v.type === type)
  }

  const verificationProgress = {
    total: requiredVerifications.length,
    completed: requiredVerifications.filter(
      type => getVerificationStatus(type) === 'passed'
    ).length,
  }

  const allRequiredPassed = requiredVerifications.every(
    type => getVerificationStatus(type) === 'passed'
  )

  const progressPercentage = (verificationProgress.completed / verificationProgress.total) * 100

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading verification status...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {verificationProgress.completed} of {verificationProgress.total} required verifications completed
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>

          {allRequiredPassed && (
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <div className="font-medium text-green-900 dark:text-green-100">
                  All verifications complete!
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  You're ready to accept bookings. Your profile is now visible to customers.
                </div>
              </div>
            </div>
          )}

          {!allRequiredPassed && (
            <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <div>
                <div className="font-medium text-yellow-900 dark:text-yellow-100">
                  Complete required verifications
                </div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  Finish all required verifications to start accepting bookings.
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Required Verifications */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Required Verifications</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {requiredVerifications.map((type) => {
            const status = getVerificationStatus(type)
            const config = statusConfig[status] || statusConfig.pending
            const Icon = verificationIcons[type] || FileText
            const StatusIcon = config.icon
            const verification = getVerification(type)

            return (
              <Card key={type} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-muted ${config.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">{verificationLabels[type]}</CardTitle>
                    </div>
                    <Badge variant={config.variant}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {verification?.expires_at && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Expires:</strong> {new Date(verification.expires_at).toLocaleDateString()}
                    </div>
                  )}
                  {verification?.vendor_ref && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Reference:</strong> {verification.vendor_ref}
                    </div>
                  )}
                  {verification?.score && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Score:</strong> {verification.score}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {status === 'pending' && (
                      <Button asChild className="flex-1">
                        <Link href={`/provider/verification/${type}?userId=${userId}`}>
                          <Upload className="h-4 w-4 mr-2" />
                          Start Verification
                        </Link>
                      </Button>
                    )}
                    {status === 'action_required' && (
                      <Button variant="outline" asChild className="flex-1">
                        <Link href={`/provider/verification/${type}?userId=${userId}`}>
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Complete Verification
                        </Link>
                      </Button>
                    )}
                    {status === 'failed' && (
                      <Button variant="outline" asChild className="flex-1">
                        <Link href={`/provider/verification/${type}?userId=${userId}`}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Retry Verification
                        </Link>
                      </Button>
                    )}
                    {status === 'expired' && (
                      <Button variant="outline" asChild className="flex-1">
                        <Link href={`/provider/verification/${type}?userId=${userId}`}>
                          <Clock className="h-4 w-4 mr-2" />
                          Renew Verification
                        </Link>
                      </Button>
                    )}
                    {status === 'passed' && verification && (
                      <Button variant="outline" asChild className="flex-1">
                        <Link href={`/provider/verification/${type}?userId=${userId}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
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
        <p className="text-sm text-muted-foreground mb-4">
          Optional verifications can help you stand out and get more bookings
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {optionalVerifications.map((type) => {
            const status = getVerificationStatus(type)
            const config = statusConfig[status] || statusConfig.pending
            const Icon = verificationIcons[type] || FileText
            const StatusIcon = config.icon
            const verification = getVerification(type)

            return (
              <Card key={type} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-muted ${config.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">{verificationLabels[type]}</CardTitle>
                    </div>
                    <Badge variant={config.variant}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {verification?.expires_at && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Expires:</strong> {new Date(verification.expires_at).toLocaleDateString()}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {status === 'pending' && (
                      <Button variant="outline" asChild className="flex-1">
                        <Link href={`/provider/verification/${type}?userId=${userId}`}>
                          <Upload className="h-4 w-4 mr-2" />
                          Start Verification
                        </Link>
                      </Button>
                    )}
                    {status === 'action_required' && (
                      <Button variant="outline" asChild className="flex-1">
                        <Link href={`/provider/verification/${type}?userId=${userId}`}>
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Complete Verification
                        </Link>
                      </Button>
                    )}
                    {status === 'passed' && verification && (
                      <Button variant="outline" asChild className="flex-1">
                        <Link href={`/provider/verification/${type}?userId=${userId}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
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
  )
}

