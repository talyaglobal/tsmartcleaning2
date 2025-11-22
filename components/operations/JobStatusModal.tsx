'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
	Clock, 
	MapPin, 
	User, 
	CheckCircle, 
	AlertTriangle, 
	Play, 
	Pause,
	Phone,
	Camera,
	Upload,
	MessageSquare
} from 'lucide-react'

interface Job {
	id: string
	customer: {
		name: string
		phone: string
		address: string
	}
	provider?: {
		id: string
		name: string
		phone: string
	}
	service: {
		name: string
		duration: number
		price: number
	}
	startTime: string
	status: 'scheduled' | 'en_route' | 'in_progress' | 'completed' | 'cancelled'
	location: {
		lat: number
		lng: number
	}
	urgency: 'low' | 'medium' | 'high'
	notes?: string
}

interface JobStatusModalProps {
	isOpen: boolean
	onClose: () => void
	job: Job | null
	onStatusUpdate: (jobId: string, newStatus: Job['status'], updates?: any) => void
}

interface StatusUpdate {
	status: Job['status']
	notes?: string
	estimatedCompletion?: string
	customerNotified?: boolean
	photos?: File[]
	issuesEncountered?: string
	extraServices?: string
	additionalCharges?: number
}

export function JobStatusModal({
	isOpen,
	onClose,
	job,
	onStatusUpdate,
}: JobStatusModalProps) {
	const [selectedStatus, setSelectedStatus] = useState<Job['status']>('')
	const [updateNotes, setUpdateNotes] = useState('')
	const [estimatedCompletion, setEstimatedCompletion] = useState('')
	const [customerNotified, setCustomerNotified] = useState(false)
	const [issuesEncountered, setIssuesEncountered] = useState('')
	const [extraServices, setExtraServices] = useState('')
	const [additionalCharges, setAdditionalCharges] = useState<number | undefined>()
	const [photos, setPhotos] = useState<File[]>([])
	const [loading, setLoading] = useState(false)

	const statusOptions: { value: Job['status']; label: string; color: string; description: string }[] = [
		{
			value: 'scheduled',
			label: 'Scheduled',
			color: 'bg-blue-500',
			description: 'Job is scheduled and waiting to be started'
		},
		{
			value: 'en_route',
			label: 'En Route',
			color: 'bg-yellow-500',
			description: 'Provider is traveling to the location'
		},
		{
			value: 'in_progress',
			label: 'In Progress',
			color: 'bg-green-500',
			description: 'Service is currently being performed'
		},
		{
			value: 'completed',
			label: 'Completed',
			color: 'bg-gray-500',
			description: 'Service has been successfully completed'
		},
		{
			value: 'cancelled',
			label: 'Cancelled',
			color: 'bg-red-500',
			description: 'Job has been cancelled'
		},
	]

	const getNextStatusOptions = (currentStatus: Job['status']): Job['status'][] => {
		switch (currentStatus) {
			case 'scheduled':
				return ['en_route', 'cancelled']
			case 'en_route':
				return ['in_progress', 'scheduled', 'cancelled']
			case 'in_progress':
				return ['completed', 'cancelled']
			case 'completed':
				return []
			case 'cancelled':
				return ['scheduled']
			default:
				return []
		}
	}

	const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files) {
			const newPhotos = Array.from(event.target.files)
			setPhotos(prev => [...prev, ...newPhotos])
		}
	}

	const removePhoto = (index: number) => {
		setPhotos(prev => prev.filter((_, i) => i !== index))
	}

	const handleStatusUpdate = async () => {
		if (!job || !selectedStatus) return

		setLoading(true)
		try {
			const updates: StatusUpdate = {
				status: selectedStatus,
				notes: updateNotes,
				estimatedCompletion,
				customerNotified,
				photos,
				issuesEncountered,
				extraServices,
				additionalCharges,
			}

			await onStatusUpdate(job.id, selectedStatus, updates)
			
			// Reset form
			setSelectedStatus('')
			setUpdateNotes('')
			setEstimatedCompletion('')
			setCustomerNotified(false)
			setIssuesEncountered('')
			setExtraServices('')
			setAdditionalCharges(undefined)
			setPhotos([])
			
			onClose()
		} catch (error) {
			console.error('Error updating job status:', error)
		} finally {
			setLoading(false)
		}
	}

	const getStatusIcon = (status: Job['status']) => {
		switch (status) {
			case 'scheduled': return <Clock className="w-4 h-4" />
			case 'en_route': return <MapPin className="w-4 h-4" />
			case 'in_progress': return <Play className="w-4 h-4" />
			case 'completed': return <CheckCircle className="w-4 h-4" />
			case 'cancelled': return <AlertTriangle className="w-4 h-4" />
		}
	}

	const getUrgencyColor = (urgency: Job['urgency']) => {
		switch (urgency) {
			case 'high': return 'destructive'
			case 'medium': return 'default'
			case 'low': return 'secondary'
		}
	}

	if (!job) return null

	const nextStatusOptions = getNextStatusOptions(job.status)
	const currentStatusInfo = statusOptions.find(s => s.value === job.status)
	
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center justify-between">
						<span>Update Job Status</span>
						<Badge variant={getUrgencyColor(job.urgency)}>
							{job.urgency} priority
						</Badge>
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{/* Current Job Info */}
					<div className="bg-gray-50 p-4 rounded-lg">
						<h3 className="font-semibold mb-3">Job Information</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
							<div>
								<p className="font-medium">Customer</p>
								<p>{job.customer.name}</p>
								<p className="text-gray-600 flex items-center">
									<Phone className="w-3 h-3 mr-1" />
									{job.customer.phone}
								</p>
							</div>
							<div>
								<p className="font-medium">Service</p>
								<p>{job.service.name}</p>
								<p className="text-gray-600">
									{new Date(job.startTime).toLocaleString()} ({job.service.duration}h)
								</p>
							</div>
						</div>
						
						{/* Current Status */}
						<div className="mt-3 pt-3 border-t">
							<p className="font-medium mb-2">Current Status</p>
							<div className="flex items-center space-x-2">
								<div className={`w-3 h-3 rounded-full ${currentStatusInfo?.color}`}></div>
								<span className="font-medium">{currentStatusInfo?.label}</span>
							</div>
							<p className="text-sm text-gray-600 mt-1">{currentStatusInfo?.description}</p>
						</div>
					</div>

					{/* Status Update Section */}
					{nextStatusOptions.length > 0 && (
						<div>
							<h3 className="font-semibold mb-3">Update Status</h3>
							<div className="space-y-3">
								{nextStatusOptions.map((statusValue) => {
									const statusInfo = statusOptions.find(s => s.value === statusValue)!
									return (
										<div
											key={statusValue}
											className={`border rounded-lg p-3 cursor-pointer transition-colors ${
												selectedStatus === statusValue
													? 'border-blue-500 bg-blue-50'
													: 'border-gray-200 hover:border-gray-300'
											}`}
											onClick={() => setSelectedStatus(statusValue)}
										>
											<div className="flex items-center space-x-3">
												<div className={`w-4 h-4 rounded-full ${statusInfo.color}`}></div>
												{getStatusIcon(statusValue)}
												<div>
													<p className="font-medium">{statusInfo.label}</p>
													<p className="text-sm text-gray-600">{statusInfo.description}</p>
												</div>
											</div>
										</div>
									)
								})}
							</div>
						</div>
					)}

					{selectedStatus && (
						<>
							{/* Status-specific fields */}
							{selectedStatus === 'en_route' && (
								<div>
									<label className="block text-sm font-medium mb-2">
										Estimated Arrival Time
									</label>
									<Input
										type="datetime-local"
										value={estimatedCompletion}
										onChange={(e) => setEstimatedCompletion(e.target.value)}
									/>
								</div>
							)}

							{selectedStatus === 'in_progress' && (
								<div>
									<label className="block text-sm font-medium mb-2">
										Estimated Completion Time
									</label>
									<Input
										type="datetime-local"
										value={estimatedCompletion}
										onChange={(e) => setEstimatedCompletion(e.target.value)}
									/>
								</div>
							)}

							{selectedStatus === 'completed' && (
								<>
									<div>
										<label className="block text-sm font-medium mb-2">
											Extra Services Provided
										</label>
										<Textarea
											placeholder="List any additional services provided..."
											value={extraServices}
											onChange={(e) => setExtraServices(e.target.value)}
											rows={2}
										/>
									</div>

									<div>
										<label className="block text-sm font-medium mb-2">
											Additional Charges ($)
										</label>
										<Input
											type="number"
											placeholder="0.00"
											value={additionalCharges || ''}
											onChange={(e) => setAdditionalCharges(parseFloat(e.target.value) || undefined)}
										/>
									</div>

									<div>
										<label className="block text-sm font-medium mb-2">
											Photos (Before/After)
										</label>
										<div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
											<input
												type="file"
												accept="image/*"
												multiple
												onChange={handlePhotoUpload}
												className="hidden"
												id="photo-upload"
											/>
											<label
												htmlFor="photo-upload"
												className="cursor-pointer flex flex-col items-center justify-center space-y-2"
											>
												<Camera className="w-8 h-8 text-gray-400" />
												<span className="text-sm text-gray-600">
													Click to upload photos
												</span>
											</label>
										</div>
										
										{photos.length > 0 && (
											<div className="mt-3 grid grid-cols-3 gap-2">
												{photos.map((photo, index) => (
													<div key={index} className="relative">
														<img
															src={URL.createObjectURL(photo)}
															alt={`Upload ${index + 1}`}
															className="w-full h-20 object-cover rounded"
														/>
														<button
															onClick={() => removePhoto(index)}
															className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
														>
															×
														</button>
													</div>
												))}
											</div>
										)}
									</div>
								</>
							)}

							{selectedStatus === 'cancelled' && (
								<div>
									<label className="block text-sm font-medium mb-2">
										Cancellation Reason
									</label>
									<Select value={updateNotes} onValueChange={setUpdateNotes}>
										<SelectTrigger>
											<SelectValue placeholder="Select reason" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="customer_request">Customer Request</SelectItem>
											<SelectItem value="provider_unavailable">Provider Unavailable</SelectItem>
											<SelectItem value="weather">Weather Conditions</SelectItem>
											<SelectItem value="emergency">Emergency</SelectItem>
											<SelectItem value="technical_issues">Technical Issues</SelectItem>
											<SelectItem value="other">Other</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}

							{/* Issues Encountered */}
							<div>
								<label className="block text-sm font-medium mb-2">
									Issues Encountered (Optional)
								</label>
								<Textarea
									placeholder="Describe any issues, delays, or complications..."
									value={issuesEncountered}
									onChange={(e) => setIssuesEncountered(e.target.value)}
									rows={2}
								/>
							</div>

							{/* Update Notes */}
							<div>
								<label className="block text-sm font-medium mb-2">
									Status Update Notes
								</label>
								<Textarea
									placeholder="Add any additional notes about this status update..."
									value={updateNotes}
									onChange={(e) => setUpdateNotes(e.target.value)}
									rows={3}
								/>
							</div>

							{/* Customer Notification */}
							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id="notify-customer"
									checked={customerNotified}
									onChange={(e) => setCustomerNotified(e.target.checked)}
									className="rounded"
								/>
								<label htmlFor="notify-customer" className="text-sm">
									Send notification to customer
								</label>
							</div>
						</>
					)}

					{/* Action Buttons */}
					<div className="flex justify-end space-x-3 pt-4 border-t">
						<Button variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button 
							onClick={handleStatusUpdate}
							disabled={!selectedStatus || loading}
						>
							{loading ? 'Updating...' : 'Update Status'}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}