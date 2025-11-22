'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { MapPin, Clock, Star, User, Phone, Truck, AlertTriangle } from 'lucide-react'

interface Provider {
	id: string
	business_name: string
	user_id: string
	availability_status: 'available' | 'busy' | 'offline'
	rating: number
	total_bookings: number
	service_radius: number
	location?: {
		lat: number
		lng: number
		distance?: number
	}
	user?: {
		phone: string
	}
	activeJobs?: number
	skills?: string[]
	nextAvailable?: string
}

interface Job {
	id: string
	customer: {
		name: string
		phone: string
		address: string
	}
	service: {
		name: string
		duration: number
		price: number
		requirements?: string[]
	}
	startTime: string
	status: string
	location: {
		lat: number
		lng: number
	}
	urgency: 'low' | 'medium' | 'high'
	notes?: string
}

interface JobAssignmentModalProps {
	isOpen: boolean
	onClose: () => void
	job: Job | null
	onAssign: (jobId: string, providerId: string, notes?: string) => void
}

export function JobAssignmentModal({
	isOpen,
	onClose,
	job,
	onAssign,
}: JobAssignmentModalProps) {
	const [providers, setProviders] = useState<Provider[]>([])
	const [selectedProviderId, setSelectedProviderId] = useState('')
	const [assignmentNotes, setAssignmentNotes] = useState('')
	const [loading, setLoading] = useState(false)
	const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'workload' | 'availability'>('distance')

	useEffect(() => {
		if (isOpen && job) {
			fetchAvailableProviders()
		}
	}, [isOpen, job])

	const fetchAvailableProviders = async () => {
		if (!job) return

		setLoading(true)
		try {
			const params = new URLSearchParams({
				lat: job.location.lat.toString(),
				lng: job.location.lng.toString(),
				serviceType: job.service.name,
			})

			const response = await fetch(`/api/providers/available?${params}`)
			if (response.ok) {
				const data = await response.json()
				setProviders(data.providers || [])
			}
		} catch (error) {
			console.error('Error fetching providers:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleAssign = async () => {
		if (!job || !selectedProviderId) return

		await onAssign(job.id, selectedProviderId, assignmentNotes)
		setSelectedProviderId('')
		setAssignmentNotes('')
		onClose()
	}

	const getProviderScore = (provider: Provider): number => {
		let score = 0
		
		// Distance factor (40%)
		const maxDistance = 50
		const distanceScore = provider.location?.distance 
			? Math.max(0, (maxDistance - provider.location.distance) / maxDistance * 40)
			: 0

		// Rating factor (30%)
		const ratingScore = (provider.rating || 0) / 5 * 30

		// Workload factor (20%)
		const maxJobs = 5
		const workloadScore = Math.max(0, (maxJobs - (provider.activeJobs || 0)) / maxJobs * 20)

		// Availability factor (10%)
		const availabilityScore = provider.availability_status === 'available' ? 10 : 0

		return distanceScore + ratingScore + workloadScore + availabilityScore
	}

	const sortProviders = (providers: Provider[]): Provider[] => {
		return [...providers].sort((a, b) => {
			switch (sortBy) {
				case 'distance':
					return (a.location?.distance || Infinity) - (b.location?.distance || Infinity)
				case 'rating':
					return (b.rating || 0) - (a.rating || 0)
				case 'workload':
					return (a.activeJobs || 0) - (b.activeJobs || 0)
				case 'availability':
					if (a.availability_status === 'available' && b.availability_status !== 'available') return -1
					if (b.availability_status === 'available' && a.availability_status !== 'available') return 1
					return getProviderScore(b) - getProviderScore(a)
				default:
					return getProviderScore(b) - getProviderScore(a)
			}
		})
	}

	const getUrgencyColor = (urgency: Job['urgency']) => {
		switch (urgency) {
			case 'high': return 'destructive'
			case 'medium': return 'default'
			case 'low': return 'secondary'
		}
	}

	const getAvailabilityColor = (status: Provider['availability_status']) => {
		switch (status) {
			case 'available': return 'bg-green-500'
			case 'busy': return 'bg-yellow-500'
			case 'offline': return 'bg-red-500'
		}
	}

	const formatDistance = (distance?: number) => {
		if (!distance) return 'Unknown'
		return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}mi`
	}

	if (!job) return null

	const sortedProviders = sortProviders(providers)

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center justify-between">
						<span>Assign Provider to Job</span>
						<Badge variant={getUrgencyColor(job.urgency)}>
							{job.urgency} priority
						</Badge>
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{/* Job Details */}
					<div className="bg-gray-50 p-4 rounded-lg">
						<h3 className="font-semibold mb-3">Job Details</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
							<div>
								<p className="font-medium">Customer</p>
								<p>{job.customer.name}</p>
								<p className="text-gray-600">{job.customer.phone}</p>
								<p className="text-gray-600 flex items-center mt-1">
									<MapPin className="w-3 h-3 mr-1" />
									{job.customer.address}
								</p>
							</div>
							<div>
								<p className="font-medium">Service</p>
								<p>{job.service.name}</p>
								<p className="text-gray-600 flex items-center">
									<Clock className="w-3 h-3 mr-1" />
									{new Date(job.startTime).toLocaleString()} ({job.service.duration}h)
								</p>
								<p className="text-gray-600">${job.service.price}</p>
							</div>
						</div>
						{job.notes && (
							<div className="mt-3 p-2 bg-yellow-50 border-l-4 border-yellow-400">
								<p className="text-sm text-yellow-800">{job.notes}</p>
							</div>
						)}
					</div>

					{/* Sort Options */}
					<div className="flex items-center space-x-4">
						<label className="text-sm font-medium">Sort by:</label>
						<Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
							<SelectTrigger className="w-48">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="distance">Closest Distance</SelectItem>
								<SelectItem value="rating">Highest Rating</SelectItem>
								<SelectItem value="workload">Least Busy</SelectItem>
								<SelectItem value="availability">Best Match</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Provider Selection */}
					<div>
						<h3 className="font-semibold mb-3">
							Available Providers ({sortedProviders.length})
						</h3>
						
						{loading ? (
							<div className="text-center py-8">Loading providers...</div>
						) : sortedProviders.length === 0 ? (
							<div className="text-center py-8 text-gray-500">
								<AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
								<p>No available providers found for this location and time</p>
							</div>
						) : (
							<div className="space-y-3 max-h-96 overflow-y-auto">
								{sortedProviders.map((provider) => (
									<div
										key={provider.id}
										className={`border rounded-lg p-4 cursor-pointer transition-colors ${
											selectedProviderId === provider.id
												? 'border-blue-500 bg-blue-50'
												: 'border-gray-200 hover:border-gray-300'
										}`}
										onClick={() => setSelectedProviderId(provider.id)}
									>
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<div className="flex items-center space-x-3 mb-2">
													<div className={`w-3 h-3 rounded-full ${getAvailabilityColor(provider.availability_status)}`}></div>
													<h4 className="font-medium">{provider.business_name}</h4>
													<Badge variant="outline" className="text-xs">
														Score: {getProviderScore(provider).toFixed(0)}
													</Badge>
												</div>
												
												<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
													<div className="flex items-center">
														<MapPin className="w-4 h-4 mr-1" />
														{formatDistance(provider.location?.distance)}
													</div>
													<div className="flex items-center">
														<Star className="w-4 h-4 mr-1" />
														{provider.rating?.toFixed(1) || 'N/A'} ({provider.total_bookings || 0})
													</div>
													<div className="flex items-center">
														<Truck className="w-4 h-4 mr-1" />
														{provider.activeJobs || 0} active jobs
													</div>
													<div className="flex items-center">
														<Phone className="w-4 h-4 mr-1" />
														{provider.user?.phone || 'No phone'}
													</div>
												</div>

												{provider.skills && provider.skills.length > 0 && (
													<div className="mt-2">
														<div className="flex flex-wrap gap-1">
															{provider.skills.map((skill, index) => (
																<Badge key={index} variant="outline" className="text-xs">
																	{skill}
																</Badge>
															))}
														</div>
													</div>
												)}

												{provider.nextAvailable && (
													<div className="mt-2 text-xs text-yellow-600">
														Next available: {provider.nextAvailable}
													</div>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Assignment Notes */}
					<div>
						<label className="block text-sm font-medium mb-2">
							Assignment Notes (Optional)
						</label>
						<Textarea
							placeholder="Add any specific instructions or notes for this assignment..."
							value={assignmentNotes}
							onChange={(e) => setAssignmentNotes(e.target.value)}
							rows={3}
						/>
					</div>

					{/* Action Buttons */}
					<div className="flex justify-end space-x-3 pt-4 border-t">
						<Button variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button 
							onClick={handleAssign} 
							disabled={!selectedProviderId}
						>
							Assign Provider
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}