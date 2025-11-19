'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Sparkles, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface RedemptionFlowProps {
  userId: string
  orderSubtotal: number
  capPercent?: number
  onRedemptionComplete?: (appliedPoints: number, creditAmount: number) => void
  onCancel?: () => void
}

interface LoyaltyBalance {
  points: number
  tier: string
  tierPoints12m: number
  tierBonus: number
  streakCount: number
  lastBookingAt: string | null
  progressToNext: number
  nextTier: string
  nextThreshold: number
}

export function RedemptionFlow({
  userId,
  orderSubtotal,
  capPercent = 50,
  onRedemptionComplete,
  onCancel,
}: RedemptionFlowProps) {
  const [balance, setBalance] = useState<LoyaltyBalance | null>(null)
  const [requestedPoints, setRequestedPoints] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadBalance()
  }, [userId])

  const loadBalance = async () => {
    try {
      const response = await fetch(`/api/loyalty/balance?user_id=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setBalance(data)
        // Set default to max available if balance exists
        if (data.points > 0) {
          setRequestedPoints(Math.min(data.points, Math.floor((orderSubtotal * capPercent / 100) / 0.1)))
        }
      }
    } catch (error) {
      console.error('Error loading balance:', error)
      toast.error('Failed to load loyalty balance')
    }
  }

  const calculateRedemption = () => {
    if (!balance || orderSubtotal <= 0) return { usablePoints: 0, creditAmount: 0 }

    const minRedeem = 100
    const pointsPerDollar = 10 // 10 points = $1
    const maxByBalance = Math.floor(balance.points / 10) * 10
    const maxByCap = Math.floor((orderSubtotal * (capPercent / 100)) / 0.1 / 10) * 10
    const requested = Math.floor(requestedPoints / 10) * 10

    const usable = Math.max(0, Math.min(maxByBalance, maxByCap, requested))
    const creditAmount = usable * 0.1

    return {
      usablePoints: usable < minRedeem ? 0 : usable,
      creditAmount: usable < minRedeem ? 0 : creditAmount,
      maxByBalance,
      maxByCap,
      minRedeem,
    }
  }

  const handleRedeem = async () => {
    if (!balance) return

    const calculation = calculateRedemption()
    if (calculation.usablePoints < calculation.minRedeem) {
      toast.error(`You need at least ${calculation.minRedeem} points to redeem.`)
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          requested_points: calculation.usablePoints,
          order_subtotal: orderSubtotal,
          cap_percent: capPercent,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Redemption failed')
      }

      if (data.reason === 'BELOW_MINIMUM') {
        toast.error(`You need at least ${calculation.minRedeem} points to redeem.`)
        return
      }

      toast.success(`Redeemed ${calculation.usablePoints} points for $${calculation.creditAmount.toFixed(2)} credit`)

      // Reload balance
      await loadBalance()

      // Callback
      if (onRedemptionComplete) {
        onRedemptionComplete(calculation.usablePoints, calculation.creditAmount)
      }
    } catch (error: any) {
      console.error('Redemption error:', error)
      toast.error(error.message || 'Failed to redeem points')
    } finally {
      setSubmitting(false)
    }
  }

  if (!balance) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Loading loyalty balance...</div>
      </Card>
    )
  }

  const calculation = calculateRedemption()
  const canRedeem = calculation.usablePoints >= calculation.minRedeem

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold">Redeem Points</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Use your loyalty points to get a discount on this order
        </p>
      </div>

      {/* Balance Display */}
      <div className="mb-6 p-4 bg-muted rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Available Points</span>
          <Badge variant="secondary" className="text-lg">
            {balance.points.toLocaleString()}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          10 points = $1.00 credit (max {capPercent}% of order)
        </div>
      </div>

      {/* Points Input */}
      <div className="mb-6">
        <Label htmlFor="points">Points to Redeem</Label>
        <div className="flex items-center gap-2 mt-2">
          <Input
            id="points"
            type="number"
            min={0}
            max={calculation.maxByBalance}
            step={10}
            value={requestedPoints}
            onChange={(e) => setRequestedPoints(Number(e.target.value))}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRequestedPoints(calculation.maxByBalance)}
          >
            Max
          </Button>
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span>Min: {calculation.minRedeem} pts</span>
          <span>Max: {calculation.maxByBalance} pts</span>
        </div>
      </div>

      {/* Calculation Preview */}
      {requestedPoints > 0 && (
        <div className="mb-6 p-4 border rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Points to use:</span>
            <span className="font-semibold">{calculation.usablePoints.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Credit amount:</span>
            <span className="font-semibold text-green-600">
              ${calculation.creditAmount.toFixed(2)}
            </span>
          </div>
          {calculation.usablePoints < calculation.minRedeem && (
            <div className="flex items-center gap-2 text-xs text-yellow-600 mt-2">
              <AlertCircle className="h-4 w-4" />
              <span>Minimum {calculation.minRedeem} points required</span>
            </div>
          )}
          {calculation.usablePoints >= calculation.minRedeem && (
            <div className="flex items-center gap-2 text-xs text-green-600 mt-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Valid redemption</span>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleRedeem}
          disabled={!canRedeem || submitting || loading}
          className="flex-1"
        >
          {submitting ? 'Processing...' : `Redeem ${calculation.usablePoints.toLocaleString()} Points`}
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-2">
          <DollarSign className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-xs text-blue-900">
            <p className="font-semibold mb-1">How it works:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Redeem points in multiples of 10</li>
              <li>Minimum redemption: 100 points ($10 credit)</li>
              <li>Maximum: {capPercent}% of order total or your available balance</li>
              <li>Credit applies to order subtotal (before tax)</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  )
}

