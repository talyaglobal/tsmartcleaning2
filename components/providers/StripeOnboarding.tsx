'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CreditCard } from 'lucide-react'

interface StripeConnectStatus {
	hasAccount: boolean
	isVerified: boolean
	canReceivePayouts: boolean
	requiresAction: boolean
	actionUrl?: string
	payoutsEnabled: boolean
	detailsSubmitted: boolean
	requirements?: string[]
}

export function StripeOnboarding({ providerId }: { providerId: string }) {
	const [status, setStatus] = useState<StripeConnectStatus | null>(null)
	const [loading, setLoading] = useState(false)

	const checkStripeStatus = async () => {
		setLoading(true)
		try {
			const response = await fetch(`/api/providers/${providerId}/stripe-status`)
			if (response.ok) {
				const data = await response.json()
				setStatus(data)
			}
		} catch (error) {
			console.error('Error checking Stripe status:', error)
		} finally {
			setLoading(false)
		}
	}

	const startStripeOnboarding = async () => {
		setLoading(true)
		try {
			const response = await fetch(`/api/providers/${providerId}/stripe-onboard`, {
				method: 'POST',
			})
			if (response.ok) {
				const { url } = await response.json()
				if (url) window.location.href = url
			}
		} catch (error) {
			console.error('Error starting Stripe onboarding:', error)
			alert('Failed to start onboarding process')
		} finally {
			setLoading(false)
		}
	}

	const refreshStripeAccount = async () => {
		setLoading(true)
		try {
			const response = await fetch(`/api/providers/${providerId}/stripe-refresh`, {
				method: 'POST',
			})
			if (response.ok) {
				const { url } = await response.json()
				if (url) window.location.href = url
			}
		} catch (error) {
			console.error('Error refreshing Stripe account:', error)
		} finally {
			setLoading(false)
		}
	}

	const getProgressPercentage = () => {
		if (!status) return 0
		if (status.payoutsEnabled) return 100
		if (status.detailsSubmitted) return 75
		if (status.hasAccount) return 50
		return 25
	}

	const getStatusBadge = () => {
		if (!status) return <Badge variant="secondary">Checking...</Badge>
		if (status.payoutsEnabled) return <Badge variant="default">✓ Active</Badge>
		if (status.requiresAction) return <Badge variant="destructive">Action Required</Badge>
		if (status.hasAccount) return <Badge variant="secondary">In Progress</Badge>
		return <Badge variant="outline">Not Started</Badge>
	}

	return (
		<div className="max-w-2xl mx-auto p-6">
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center space-x-2">
							<CreditCard className="w-6 h-6" />
							<span>Payment Setup</span>
						</CardTitle>
						{getStatusBadge()}
					</div>
					<p className="text-gray-600">
						Set up your payment account to receive earnings from completed jobs.
					</p>
				</CardHeader>
				<CardContent className="space-y-6">
					<div>
						<div className="flex justify-between items-center mb-2">
							<span className="text-sm font-medium">Setup Progress</span>
							<span className="text-sm text-gray-600">{getProgressPercentage()}%</span>
						</div>
						<Progress value={getProgressPercentage()} className="w-full" />
					</div>

					<div className="flex gap-3">
						<Button onClick={startStripeOnboarding} disabled={loading}>
							Start Onboarding
						</Button>
						<Button variant="outline" onClick={refreshStripeAccount} disabled={loading}>
							Refresh
						</Button>
						<Button variant="ghost" onClick={checkStripeStatus} disabled={loading}>
							Check Status
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}


