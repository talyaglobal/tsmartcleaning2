'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle } from 'lucide-react'

type VerificationType =
  | 'government_id'
  | 'face'
  | 'social'
  | 'background'
  | 'reference'
  | 'drug'
  | 'vaccination'
  | 'insurance'

type StatusMap = Partial<Record<VerificationType, string>>

interface OnboardingChecklistProps {
  userId: string
  tier?: 'standard' | 'premium'
}

export function OnboardingChecklist({ userId, tier = 'standard' }: OnboardingChecklistProps) {
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [status, setStatus] = useState<StatusMap>({})
  const [error, setError] = useState<string | null>(null)

  const requiredTypes: VerificationType[] = useMemo(() => {
    const base: VerificationType[] = ['government_id', 'face', 'reference']
    if (tier === 'premium') return [...base, 'background', 'drug', 'insurance']
    return base
  }, [tier])

  async function loadStatus() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/verification/status?userId=${encodeURIComponent(userId)}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to load status')
      setStatus(json?.summary ?? {})
    } catch (e: any) {
      setError(e?.message || 'Failed to load status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function start(types?: VerificationType[]) {
    setStarting(true)
    setError(null)
    try {
      const res = await fetch('/api/verification/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          types: types && types.length > 0 ? types : requiredTypes,
          tier,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to start verification')
      await loadStatus()
    } catch (e: any) {
      setError(e?.message || 'Failed to start verification')
    } finally {
      setStarting(false)
    }
  }

  const allPassed = requiredTypes.every((t) => status[t] === 'passed')

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold mb-1">
            Onboarding Checklist {tier === 'premium' ? <Badge>Premium</Badge> : null}
          </h3>
          <p className="text-sm text-muted-foreground">
            Complete these steps to unlock bookings and payouts.
          </p>
        </div>
        <div className="text-right">
          {allPassed ? (
            <Badge className="bg-green-600">All set</Badge>
          ) : (
            <Badge variant="secondary">In progress</Badge>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {requiredTypes.map((t) => {
          const s = status[t] ?? (loading ? 'loading' : 'pending')
          const good = s === 'passed'
          const warn = s === 'action_required' || s === 'failed' || s === 'expired'
          return (
            <div key={t} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {good ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : warn ? (
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-muted" />
                )}
                <span className="text-sm capitalize">{t.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs capitalize">{s}</Badge>
                {!good && (
                  <Button size="sm" variant="outline" onClick={() => start([t])} disabled={starting}>
                    {starting ? 'Starting...' : 'Start'}
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          We may request biometric and background consent where applicable.
        </div>
        {!allPassed && (
          <Button size="sm" onClick={() => start()} disabled={starting}>
            {starting ? 'Starting...' : 'Start all'}
          </Button>
        )}
      </div>

      {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}
    </Card>
  )
}


