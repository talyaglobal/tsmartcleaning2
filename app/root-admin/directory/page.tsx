'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from "next/link"
import { PageHeader } from "@/components/admin/PageHeader"
import { DataTable, Column } from "@/components/admin/DataTable"
import { EmptyState } from "@/components/admin/EmptyState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MapPinned, Search, ShieldCheck, Star, Clock, CheckCircle, XCircle, AlertCircle, Plus, Edit, Eye, Flag, AlertTriangle, Award, FileCheck, UserCheck, Building2, History, AlertCircle as AlertCircleIcon } from 'lucide-react'

type Company = {
	id: string
	name: string
	slug: string | null
	city: string | null
	state: string | null
	country: string | null
	verified: boolean
	averageRating: number | null
	totalReviews: number
	created_at: string
	status?: string
	description?: string | null
	logoUrl?: string | null
}

type Review = {
	id: string
	rating: number
	comment: string | null
	status: 'pending' | 'approved' | 'flagged' | 'rejected'
	created_at: string
	customer_name: string
	provider_name: string
	flagged_reason?: string | null
}

type BookingRequest = {
	id: string
	customer_name: string
	customer_email: string
	service_type: string
	requested_date: string
	created_at: string
	response_time_hours: number | null
	sla_met: boolean | null
	status: 'pending' | 'responded' | 'converted' | 'expired'
	converted: boolean
}

export default function DirectoryPage() {
	const [activeTab, setActiveTab] = useState<'companies' | 'reviews' | 'requests'>('companies')
	const [companies, setCompanies] = useState<Company[]>([])
	const [reviews, setReviews] = useState<Review[]>([])
	const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([])
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [verifiedFilter, setVerifiedFilter] = useState<string>('all')
	
	// Company management dialogs
	const [companyDialogOpen, setCompanyDialogOpen] = useState(false)
	const [editingCompany, setEditingCompany] = useState<Company | null>(null)
	const [companyFormData, setCompanyFormData] = useState({
		name: '',
		description: '',
		city: '',
		state: '',
		country: '',
		email: '',
		phone: '',
		website: '',
	})
	
	// Review moderation
	const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('all')
	const [reviewRatingFilter, setReviewRatingFilter] = useState<string>('all')
	const [moderationDialogOpen, setModerationDialogOpen] = useState(false)
	const [selectedReview, setSelectedReview] = useState<Review | null>(null)
	const [moderationReason, setModerationReason] = useState('')
	const [moderationAction, setModerationAction] = useState<'approve' | 'reject' | 'flag'>('approve')
	
	// Booking request filters
	const [requestStatusFilter, setRequestStatusFilter] = useState<string>('all')
	const [slaFilter, setSlaFilter] = useState<string>('all')
	
	// Company verification/credentials
	const [companyDetailDialogOpen, setCompanyDetailDialogOpen] = useState(false)
	const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
	const [companyCredentials, setCompanyCredentials] = useState<any>(null)
	const [loadingCredentials, setLoadingCredentials] = useState(false)
	
	// Review audit trail
	const [reviewAuditDialogOpen, setReviewAuditDialogOpen] = useState(false)
	const [reviewAuditTrail, setReviewAuditTrail] = useState<any[]>([])
	const [loadingAuditTrail, setLoadingAuditTrail] = useState(false)

	useEffect(() => {
		fetchData()
	}, [activeTab, reviewStatusFilter, reviewRatingFilter, requestStatusFilter, slaFilter])

	const fetchData = async () => {
		setLoading(true)
		try {
			if (activeTab === 'companies') {
				const res = await fetch('/api/companies/search?limit=100', { cache: 'no-store' })
				if (res.ok) {
					const data = await res.json()
					setCompanies(data.results || [])
				}
			} else if (activeTab === 'reviews') {
				const params = new URLSearchParams()
				if (reviewStatusFilter !== 'all') params.append('status', reviewStatusFilter)
				if (reviewRatingFilter !== 'all') params.append('rating', reviewRatingFilter)
				params.append('limit', '100')
				const res = await fetch(`/api/root-admin/reviews?${params.toString()}`)
				if (res.ok) {
					const data = await res.json()
					setReviews(data.reviews || [])
				} else {
					setReviews([])
				}
			} else if (activeTab === 'requests') {
				const params = new URLSearchParams()
				if (requestStatusFilter !== 'all') params.append('status', requestStatusFilter)
				if (slaFilter !== 'all') params.append('slaFilter', slaFilter)
				params.append('limit', '100')
				const res = await fetch(`/api/root-admin/booking-requests?${params.toString()}`)
				if (res.ok) {
					const data = await res.json()
					setBookingRequests(data.requests || [])
				} else {
					setBookingRequests([])
				}
			}
		} catch (error) {
			console.error('Error fetching data:', error)
		} finally {
			setLoading(false)
		}
	}

	const filteredCompanies = useMemo(() => {
		let filtered = companies

		if (searchQuery) {
			const query = searchQuery.toLowerCase()
			filtered = filtered.filter(
				(c) =>
					c.name.toLowerCase().includes(query) ||
					c.city?.toLowerCase().includes(query) ||
					c.state?.toLowerCase().includes(query)
			)
		}

		if (verifiedFilter === 'verified') {
			filtered = filtered.filter((c) => c.verified)
		} else if (verifiedFilter === 'unverified') {
			filtered = filtered.filter((c) => !c.verified)
		}

		return filtered
	}, [companies, searchQuery, verifiedFilter])

	const companyColumns: Column<Company>[] = [
		{
			key: 'name',
			header: 'Company',
			render: (company) => (
				<div>
					<Link
						href={`/companies/${company.slug || company.id}`}
						className="font-medium text-blue-600 hover:underline"
					>
						{company.name}
					</Link>
					{company.verified && (
						<Badge variant="secondary" className="ml-2">
							<ShieldCheck className="h-3 w-3 mr-1" />
							Verified
						</Badge>
					)}
				</div>
			),
		},
		{
			key: 'location',
			header: 'Location',
			render: (company) =>
				[company.city, company.state, company.country].filter(Boolean).join(', ') || '—',
		},
		{
			key: 'rating',
			header: 'Rating',
			render: (company) => (
				<div className="flex items-center gap-1">
					<Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
					<span className="text-sm">
						{(company.averageRating || 0).toFixed(1)} ({company.totalReviews})
					</span>
				</div>
			),
		},
		{
			key: 'status',
			header: 'Status',
			render: (company) => {
				const status = company.status || 'active'
				return (
					<Badge
						variant={
							status === 'active'
								? 'default'
								: status === 'suspended'
								? 'destructive'
								: 'secondary'
						}
					>
						{status}
					</Badge>
				)
			},
		},
		{
			key: 'created_at',
			header: 'Created',
			render: (company) => new Date(company.created_at).toLocaleDateString(),
		},
		{
			key: 'actions',
			header: 'Actions',
			render: (company) => (
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							setSelectedCompany(company)
							setCompanyDetailDialogOpen(true)
							loadCompanyCredentials(company.id)
						}}
						title="View details and verifications"
					>
						<Eye className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							setEditingCompany(company)
							setCompanyFormData({
								name: company.name,
								description: company.description || '',
								city: company.city || '',
								state: company.state || '',
								country: company.country || '',
								email: '',
								phone: '',
								website: '',
							})
							setCompanyDialogOpen(true)
						}}
						title="Edit company"
					>
						<Edit className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleVerifyCompany(company.id, !company.verified)}
					>
						{company.verified ? 'Unverify' : 'Verify'}
					</Button>
					<select
						value={company.status || 'active'}
						onChange={(e) => handleStatusChange(company.id, e.target.value as any)}
						className="h-8 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="active">Active</option>
						<option value="inactive">Inactive</option>
						<option value="suspended">Suspend</option>
					</select>
				</div>
			),
		},
	]

	const handleVerifyCompany = async (companyId: string, verified: boolean) => {
		try {
			const res = await fetch(`/api/root-admin/companies/${companyId}/verify`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ verified }),
			})
			if (res.ok) {
				fetchData()
			} else {
				const error = await res.json()
				alert(error.error || 'Failed to update verification')
			}
		} catch (error) {
			console.error('Error updating company verification:', error)
			alert('Failed to update verification')
		}
	}

	const handleStatusChange = async (companyId: string, status: 'active' | 'inactive' | 'suspended') => {
		try {
			const res = await fetch(`/api/root-admin/companies/${companyId}/status`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status }),
			})
			if (res.ok) {
				fetchData()
			} else {
				const error = await res.json()
				alert(error.error || 'Failed to update status')
			}
		} catch (error) {
			console.error('Error updating company status:', error)
			alert('Failed to update status')
		}
	}

	const handleSaveCompany = async () => {
		try {
			const url = editingCompany
				? `/api/root-admin/companies/${editingCompany.id}`
				: '/api/root-admin/companies'
			const method = editingCompany ? 'PATCH' : 'POST'
			
			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(companyFormData),
			})
			
			if (res.ok) {
				setCompanyDialogOpen(false)
				setEditingCompany(null)
				setCompanyFormData({
					name: '',
					description: '',
					city: '',
					state: '',
					country: '',
					email: '',
					phone: '',
					website: '',
				})
				fetchData()
			} else {
				const error = await res.json()
				alert(error.error || 'Failed to save company')
			}
		} catch (error) {
			console.error('Error saving company:', error)
			alert('Failed to save company')
		}
	}

	const loadCompanyCredentials = async (companyId: string) => {
		setLoadingCredentials(true)
		try {
			const res = await fetch(`/api/root-admin/companies/${companyId}/credentials`)
			if (res.ok) {
				const data = await res.json()
				setCompanyCredentials(data)
			}
		} catch (error) {
			console.error('Error loading company credentials:', error)
		} finally {
			setLoadingCredentials(false)
		}
	}

	const handleUpdateCredential = async (badge: string, value: boolean) => {
		if (!selectedCompany) return
		try {
			const res = await fetch(`/api/root-admin/companies/${selectedCompany.id}/credentials`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ badge, value }),
			})
			if (res.ok) {
				loadCompanyCredentials(selectedCompany.id)
				fetchData()
			} else {
				const error = await res.json()
				alert(error.error || 'Failed to update credential')
			}
		} catch (error) {
			console.error('Error updating credential:', error)
			alert('Failed to update credential')
		}
	}

	const handleUpdateVerification = async (verificationId: string, status: string) => {
		if (!selectedCompany) return
		try {
			const res = await fetch(`/api/root-admin/companies/${selectedCompany.id}/credentials`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ verificationId, verificationStatus: status }),
			})
			if (res.ok) {
				loadCompanyCredentials(selectedCompany.id)
			} else {
				const error = await res.json()
				alert(error.error || 'Failed to update verification')
			}
		} catch (error) {
			console.error('Error updating verification:', error)
			alert('Failed to update verification')
		}
	}

	const loadReviewAuditTrail = async (reviewId: string) => {
		setLoadingAuditTrail(true)
		try {
			// Fetch audit logs for this review
			const res = await fetch(`/api/root-admin/audit-logs?resource=review&resourceId=${reviewId}`)
			if (res.ok) {
				const data = await res.json()
				setReviewAuditTrail(data.logs || [])
			}
		} catch (error) {
			console.error('Error loading audit trail:', error)
			setReviewAuditTrail([])
		} finally {
			setLoadingAuditTrail(false)
		}
	}

	const handleReviewAction = async (review: Review, action: 'approve' | 'reject' | 'flag', reason?: string) => {
		try {
			const body: any = { action }
			if (reason) {
				body.reason = reason
			}
			const res = await fetch(`/api/root-admin/reviews/${review.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			})
			if (res.ok) {
				setModerationDialogOpen(false)
				setSelectedReview(null)
				setModerationReason('')
				fetchData()
			} else {
				const error = await res.json()
				alert(error.error || 'Failed to update review')
			}
		} catch (error) {
			console.error('Error updating review:', error)
			alert('Failed to update review')
		}
	}

	const openModerationDialog = (review: Review, action: 'approve' | 'reject' | 'flag') => {
		setSelectedReview(review)
		setModerationAction(action)
		setModerationReason('')
		setModerationDialogOpen(true)
	}

	const filteredReviews = useMemo(() => {
		let filtered = reviews
		if (searchQuery) {
			const query = searchQuery.toLowerCase()
			filtered = filtered.filter(
				(r) =>
					r.customer_name.toLowerCase().includes(query) ||
					r.provider_name.toLowerCase().includes(query) ||
					r.comment?.toLowerCase().includes(query)
			)
		}
		return filtered
	}, [reviews, searchQuery])

	const reviewColumns: Column<Review>[] = [
		{
			key: 'rating',
			header: 'Rating',
			render: (review) => (
				<div className="flex items-center gap-1">
					<Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
					<span className="font-medium">{review.rating}</span>
				</div>
			),
		},
		{
			key: 'customer_name',
			header: 'Customer',
		},
		{
			key: 'provider_name',
			header: 'Provider',
		},
		{
			key: 'comment',
			header: 'Comment',
			render: (review) => (
				<div className="max-w-md">
					<p className="text-sm truncate">{review.comment || 'No comment'}</p>
				</div>
			),
		},
		{
			key: 'status',
			header: 'Status',
			render: (review) => (
				<Badge
					variant={
						review.status === 'approved'
							? 'default'
							: review.status === 'flagged'
							? 'destructive'
							: review.status === 'pending'
							? 'secondary'
							: 'outline'
					}
				>
					{review.status === 'flagged' && <Flag className="h-3 w-3 mr-1" />}
					{review.status}
				</Badge>
			),
		},
		{
			key: 'created_at',
			header: 'Date',
			render: (review) => new Date(review.created_at).toLocaleDateString(),
		},
		{
			key: 'actions',
			header: 'Actions',
			render: (review) => (
				<div className="flex items-center gap-2">
					{review.status === 'pending' && (
						<>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => openModerationDialog(review, 'approve')}
								title="Approve review"
							>
								<CheckCircle className="h-4 w-4 text-green-600" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => openModerationDialog(review, 'reject')}
								title="Reject review"
							>
								<XCircle className="h-4 w-4 text-red-600" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => openModerationDialog(review, 'flag')}
								title="Flag review"
							>
								<Flag className="h-4 w-4 text-orange-600" />
							</Button>
						</>
					)}
					{review.status === 'flagged' && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => openModerationDialog(review, 'approve')}
							title="Approve flagged review"
						>
							<CheckCircle className="h-4 w-4 text-green-600" />
						</Button>
					)}
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							setSelectedReview(review)
							loadReviewAuditTrail(review.id)
							setReviewAuditDialogOpen(true)
						}}
						title="View audit trail"
					>
						<History className="h-4 w-4" />
					</Button>
				</div>
			),
		},
	]

	const filteredRequests = useMemo(() => {
		let filtered = bookingRequests
		if (searchQuery) {
			const query = searchQuery.toLowerCase()
			filtered = filtered.filter(
				(r) =>
					r.customer_name.toLowerCase().includes(query) ||
					r.customer_email.toLowerCase().includes(query) ||
					r.service_type.toLowerCase().includes(query)
			)
		}
		return filtered
	}, [bookingRequests, searchQuery])

	const handleEscalateRequest = async (requestId: string) => {
		try {
			const res = await fetch(`/api/root-admin/booking-requests/${requestId}/escalate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			})
			if (res.ok) {
				alert('Request escalated successfully')
				fetchData()
			} else {
				const error = await res.json()
				alert(error.error || 'Failed to escalate request')
			}
		} catch (error) {
			console.error('Error escalating request:', error)
			alert('Failed to escalate request')
		}
	}

	const requestColumns: Column<BookingRequest>[] = [
		{
			key: 'customer_name',
			header: 'Customer',
			render: (req) => (
				<div>
					<p className="font-medium">{req.customer_name}</p>
					<p className="text-xs text-slate-500">{req.customer_email}</p>
				</div>
			),
		},
		{
			key: 'service_type',
			header: 'Service',
		},
		{
			key: 'requested_date',
			header: 'Requested Date',
			render: (req) => new Date(req.requested_date).toLocaleDateString(),
		},
		{
			key: 'created_at',
			header: 'Requested',
			render: (req) => {
				const created = new Date(req.created_at)
				const now = new Date()
				const hoursAgo = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
				const isOverdue = hoursAgo > 24
				return (
					<div>
						<p className="text-sm">{created.toLocaleDateString()}</p>
						<p className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
							{hoursAgo.toFixed(1)}h ago
						</p>
					</div>
				)
			},
		},
		{
			key: 'response_time_hours',
			header: 'Response Time',
			render: (req) => {
				if (req.response_time_hours === null) {
					const created = new Date(req.created_at)
					const now = new Date()
					const hoursAgo = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
					const isOverdue = hoursAgo > 24
					const isWarning = hoursAgo > 18 && hoursAgo <= 24
					return (
						<div className="flex items-center gap-1">
							<Clock className={`h-4 w-4 ${
								isOverdue ? 'text-red-500' : 
								isWarning ? 'text-orange-500' : 
								'text-slate-400'
							}`} />
							<span className={
								isOverdue ? 'text-red-600 font-medium' : 
								isWarning ? 'text-orange-600 font-medium' : 
								''
							}>
								{hoursAgo.toFixed(1)}h
							</span>
							{isOverdue && (
								<Badge variant="destructive" className="ml-1">
									<AlertTriangle className="h-3 w-3 mr-1" />
									Overdue
								</Badge>
							)}
							{isWarning && (
								<Badge variant="outline" className="ml-1 border-orange-500 text-orange-600">
									<AlertCircle className="h-3 w-3 mr-1" />
									Warning
								</Badge>
							)}
						</div>
					)
				}
				return (
					<div className="flex items-center gap-1">
						<Clock className="h-4 w-4 text-slate-400" />
						<span>{req.response_time_hours.toFixed(1)}h</span>
					</div>
				)
			},
		},
		{
			key: 'sla_met',
			header: 'SLA',
			render: (req) =>
				req.sla_met === true ? (
					<Badge variant="default" className="bg-green-100 text-green-700">
						<CheckCircle className="h-3 w-3 mr-1" />
						Met
					</Badge>
				) : req.sla_met === false ? (
					<Badge variant="destructive">
						<XCircle className="h-3 w-3 mr-1" />
						Missed
					</Badge>
				) : (
					<span className="text-slate-400">—</span>
				),
		},
		{
			key: 'status',
			header: 'Status',
			render: (req) => (
				<Badge
					variant={
						req.status === 'converted'
							? 'default'
							: req.status === 'responded'
							? 'secondary'
							: 'outline'
					}
				>
					{req.status}
				</Badge>
			),
		},
		{
			key: 'converted',
			header: 'Converted',
			render: (req) => (req.converted ? <CheckCircle className="h-4 w-4 text-green-500" /> : <span className="text-slate-400">—</span>),
		},
		{
			key: 'actions',
			header: 'Actions',
			render: (req) => {
				const created = new Date(req.created_at)
				const now = new Date()
				const hoursAgo = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
				const isOverdue = hoursAgo > 24 && req.status === 'pending'
				
				return (
					<div className="flex items-center gap-2">
						{isOverdue && (
							<Button
								variant="destructive"
								size="sm"
								onClick={() => handleEscalateRequest(req.id)}
								title="Escalate overdue request"
							>
								<AlertTriangle className="h-4 w-4 mr-1" />
								Escalate
							</Button>
						)}
					</div>
				)
			},
		},
	]

	const reviewStats = useMemo(() => {
		const total = reviews.length
		const pending = reviews.filter((r) => r.status === 'pending').length
		const flagged = reviews.filter((r) => r.status === 'flagged').length
		const avgRating =
			reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1)
		return { total, pending, flagged, avgRating }
	}, [reviews])

	const slaStats = useMemo(() => {
		const total = bookingRequests.length
		const met = bookingRequests.filter((r) => r.sla_met === true).length
		const missed = bookingRequests.filter((r) => r.sla_met === false).length
		const avgResponseTime =
			bookingRequests
				.filter((r) => r.response_time_hours !== null)
				.reduce((sum, r) => sum + (r.response_time_hours || 0), 0) /
			bookingRequests.filter((r) => r.response_time_hours !== null).length
		return { total, met, missed, avgResponseTime: avgResponseTime || 0 }
	}, [bookingRequests])

	return (
		<>
			<PageHeader
				title="Directory"
				subtitle="Manage companies, reviews, and booking requests."
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<span>Directory</span>
					</div>
				}
				tabs={
					<div className="flex gap-1 border-b border-slate-200">
						<button
							onClick={() => setActiveTab('companies')}
							className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
								activeTab === 'companies'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-slate-600 hover:text-slate-900'
							}`}
						>
							Companies
						</button>
						<button
							onClick={() => setActiveTab('reviews')}
							className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
								activeTab === 'reviews'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-slate-600 hover:text-slate-900'
							}`}
						>
							Reviews
						</button>
						<button
							onClick={() => setActiveTab('requests')}
							className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
								activeTab === 'requests'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-slate-600 hover:text-slate-900'
							}`}
						>
							Booking Requests
						</button>
					</div>
				}
			/>

			{activeTab === 'companies' && (
				<>
					{/* Filters and Actions */}
					<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
							<Input
								placeholder="Search companies..."
								className="pl-9"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
						<select
							value={verifiedFilter}
							onChange={(e) => setVerifiedFilter(e.target.value)}
							className="h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="all">All Companies</option>
							<option value="verified">Verified Only</option>
							<option value="unverified">Unverified Only</option>
						</select>
						<Button
							onClick={() => {
								setEditingCompany(null)
								setCompanyFormData({
									name: '',
									description: '',
									city: '',
									state: '',
									country: '',
									email: '',
									phone: '',
									website: '',
								})
								setCompanyDialogOpen(true)
							}}
						>
							<Plus className="h-4 w-4 mr-2" />
							Add Company
						</Button>
					</div>

					{/* Companies Table */}
					<DataTable
						columns={companyColumns}
						data={filteredCompanies}
						loading={loading}
						emptyState={
							<EmptyState
								title="No companies found"
								description="There are no companies matching your filters."
								icon={<MapPinned className="h-8 w-8" />}
							/>
						}
					/>
				</>
			)}

			{activeTab === 'reviews' && (
				<>
					{/* Review Stats */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
						<div className="bg-white rounded-lg border border-slate-200 p-4">
							<p className="text-sm text-slate-600 mb-1">Total Reviews</p>
							<p className="text-2xl font-semibold">{reviewStats.total}</p>
						</div>
						<div className="bg-white rounded-lg border border-slate-200 p-4">
							<p className="text-sm text-slate-600 mb-1">Pending</p>
							<p className="text-2xl font-semibold text-yellow-600">{reviewStats.pending}</p>
						</div>
						<div className="bg-white rounded-lg border border-slate-200 p-4">
							<p className="text-sm text-slate-600 mb-1">Flagged</p>
							<p className="text-2xl font-semibold text-red-600">{reviewStats.flagged}</p>
						</div>
						<div className="bg-white rounded-lg border border-slate-200 p-4">
							<p className="text-sm text-slate-600 mb-1">Avg Rating</p>
							<p className="text-2xl font-semibold">{reviewStats.avgRating.toFixed(1)}</p>
						</div>
					</div>

					{/* Filters */}
					<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
							<Input
								placeholder="Search by customer, provider, or comment..."
								className="pl-9"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
						<select
							value={reviewStatusFilter}
							onChange={(e) => setReviewStatusFilter(e.target.value)}
							className="h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="all">All Statuses</option>
							<option value="pending">Pending</option>
							<option value="approved">Approved</option>
							<option value="flagged">Flagged</option>
							<option value="rejected">Rejected</option>
						</select>
						<select
							value={reviewRatingFilter}
							onChange={(e) => setReviewRatingFilter(e.target.value)}
							className="h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="all">All Ratings</option>
							<option value="5">5 Stars</option>
							<option value="4">4 Stars</option>
							<option value="3">3 Stars</option>
							<option value="2">2 Stars</option>
							<option value="1">1 Star</option>
						</select>
					</div>

					{/* Reviews Table */}
					<DataTable
						columns={reviewColumns}
						data={filteredReviews}
						loading={loading}
						emptyState={
							<EmptyState
								title="No reviews found"
								description="There are no reviews matching your filters."
								icon={<Star className="h-8 w-8" />}
							/>
						}
					/>
				</>
			)}

			{activeTab === 'requests' && (
				<>
					{/* SLA Stats */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
						<div className="bg-white rounded-lg border border-slate-200 p-4">
							<p className="text-sm text-slate-600 mb-1">Total Requests</p>
							<p className="text-2xl font-semibold">{slaStats.total}</p>
						</div>
						<div className="bg-white rounded-lg border border-slate-200 p-4">
							<p className="text-sm text-slate-600 mb-1">SLA Met</p>
							<p className="text-2xl font-semibold text-green-600">{slaStats.met}</p>
						</div>
						<div className="bg-white rounded-lg border border-slate-200 p-4">
							<p className="text-sm text-slate-600 mb-1">SLA Missed</p>
							<p className="text-2xl font-semibold text-red-600">{slaStats.missed}</p>
						</div>
						<div className="bg-white rounded-lg border border-slate-200 p-4">
							<p className="text-sm text-slate-600 mb-1">Avg Response Time</p>
							<p className="text-2xl font-semibold">{slaStats.avgResponseTime.toFixed(1)}h</p>
						</div>
					</div>

					{/* Filters */}
					<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
							<Input
								placeholder="Search by customer name, email, service..."
								className="pl-9"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
						<select
							value={requestStatusFilter}
							onChange={(e) => setRequestStatusFilter(e.target.value)}
							className="h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="all">All Statuses</option>
							<option value="pending">Pending</option>
							<option value="responded">Responded</option>
							<option value="converted">Converted</option>
							<option value="expired">Expired</option>
						</select>
						<select
							value={slaFilter}
							onChange={(e) => setSlaFilter(e.target.value)}
							className="h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="all">All SLA</option>
							<option value="met">SLA Met</option>
							<option value="missed">SLA Missed</option>
						</select>
					</div>

					{/* Requests Table */}
					<DataTable
						columns={requestColumns}
						data={filteredRequests}
						loading={loading}
						emptyState={
							<EmptyState
								title="No booking requests found"
								description="There are no booking requests matching your filters."
								icon={<Clock className="h-8 w-8" />}
							/>
						}
					/>
				</>
			)}

			{/* Company Edit/Create Dialog */}
			<Dialog open={companyDialogOpen} onOpenChange={setCompanyDialogOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{editingCompany ? 'Edit Company' : 'Add New Company'}</DialogTitle>
						<DialogDescription>
							{editingCompany ? 'Update company information.' : 'Create a new company profile.'}
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="name">Company Name *</Label>
							<Input
								id="name"
								value={companyFormData.name}
								onChange={(e) => setCompanyFormData({ ...companyFormData, name: e.target.value })}
								placeholder="Enter company name"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								value={companyFormData.description}
								onChange={(e) => setCompanyFormData({ ...companyFormData, description: e.target.value })}
								placeholder="Enter company description"
								rows={3}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="grid gap-2">
								<Label htmlFor="city">City</Label>
								<Input
									id="city"
									value={companyFormData.city}
									onChange={(e) => setCompanyFormData({ ...companyFormData, city: e.target.value })}
									placeholder="City"
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="state">State</Label>
								<Input
									id="state"
									value={companyFormData.state}
									onChange={(e) => setCompanyFormData({ ...companyFormData, state: e.target.value })}
									placeholder="State"
								/>
							</div>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="country">Country</Label>
							<Input
								id="country"
								value={companyFormData.country}
								onChange={(e) => setCompanyFormData({ ...companyFormData, country: e.target.value })}
								placeholder="Country"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								value={companyFormData.email}
								onChange={(e) => setCompanyFormData({ ...companyFormData, email: e.target.value })}
								placeholder="company@example.com"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="phone">Phone</Label>
							<Input
								id="phone"
								value={companyFormData.phone}
								onChange={(e) => setCompanyFormData({ ...companyFormData, phone: e.target.value })}
								placeholder="+1 (555) 123-4567"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="website">Website</Label>
							<Input
								id="website"
								value={companyFormData.website}
								onChange={(e) => setCompanyFormData({ ...companyFormData, website: e.target.value })}
								placeholder="https://example.com"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setCompanyDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleSaveCompany}>
							{editingCompany ? 'Save Changes' : 'Create Company'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Company Detail Dialog with Credentials & Badges */}
			<Dialog open={companyDetailDialogOpen} onOpenChange={setCompanyDetailDialogOpen}>
				<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Company Details & Verifications</DialogTitle>
						<DialogDescription>
							{selectedCompany && `Manage credentials, badges, and verifications for ${selectedCompany.name}`}
						</DialogDescription>
					</DialogHeader>
					{loadingCredentials ? (
						<div className="py-8 text-center text-slate-500">Loading credentials...</div>
					) : companyCredentials && selectedCompany ? (
						<div className="grid gap-6 py-4">
							{/* Company Info */}
							<div className="border-b border-slate-200 pb-4">
								<h3 className="font-semibold mb-2">Company Information</h3>
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<p className="text-slate-600">Name</p>
										<p className="font-medium">{selectedCompany.name}</p>
									</div>
									<div>
										<p className="text-slate-600">Location</p>
										<p className="font-medium">
											{[selectedCompany.city, selectedCompany.state, selectedCompany.country].filter(Boolean).join(', ') || '—'}
										</p>
									</div>
									{selectedCompany.description && (
										<div className="col-span-2">
											<p className="text-slate-600">Description</p>
											<p className="font-medium">{selectedCompany.description}</p>
										</div>
									)}
								</div>
							</div>

							{/* Badges */}
							<div className="border-b border-slate-200 pb-4">
								<h3 className="font-semibold mb-3">Badges & Credentials</h3>
								<div className="grid grid-cols-2 gap-3">
									<div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
										<div className="flex items-center gap-2">
											<ShieldCheck className="h-5 w-5 text-blue-500" />
											<span className="font-medium">Verified</span>
										</div>
										<Button
											variant={companyCredentials.badges?.verified ? "default" : "outline"}
											size="sm"
											onClick={() => handleUpdateCredential('verified', !companyCredentials.badges?.verified)}
										>
											{companyCredentials.badges?.verified ? 'Verified' : 'Not Verified'}
										</Button>
									</div>
									<div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
										<div className="flex items-center gap-2">
											<UserCheck className="h-5 w-5 text-green-500" />
											<span className="font-medium">Identity Verified</span>
										</div>
										<Badge variant={companyCredentials.badges?.identityVerified ? "default" : "secondary"}>
											{companyCredentials.badges?.identityVerified ? 'Yes' : 'No'}
										</Badge>
									</div>
									<div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
										<div className="flex items-center gap-2">
											<FileCheck className="h-5 w-5 text-purple-500" />
											<span className="font-medium">Background Checked</span>
										</div>
										<Badge variant={companyCredentials.badges?.backgroundChecked ? "default" : "secondary"}>
											{companyCredentials.badges?.backgroundChecked ? 'Yes' : 'No'}
										</Badge>
									</div>
									<div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
										<div className="flex items-center gap-2">
											<Award className="h-5 w-5 text-orange-500" />
											<span className="font-medium">Insured</span>
										</div>
										<Badge variant={companyCredentials.badges?.insured ? "default" : "secondary"}>
											{companyCredentials.badges?.insured ? 'Yes' : 'No'}
										</Badge>
									</div>
								</div>
							</div>

							{/* Verifications */}
							<div>
								<h3 className="font-semibold mb-3">Verification Details</h3>
								{companyCredentials.verifications && companyCredentials.verifications.length > 0 ? (
									<div className="space-y-3">
										{companyCredentials.verifications.map((verification: any) => (
											<div key={verification.id} className="p-3 border border-slate-200 rounded-lg">
												<div className="flex items-center justify-between mb-2">
													<div>
														<p className="font-medium capitalize">{verification.type?.replace(/_/g, ' ')}</p>
														<p className="text-xs text-slate-500">
															{verification.vendor && `Vendor: ${verification.vendor}`}
															{verification.vendor_ref && ` • Ref: ${verification.vendor_ref}`}
														</p>
													</div>
													<select
														value={verification.status || 'pending'}
														onChange={(e) => handleUpdateVerification(verification.id, e.target.value)}
														className="h-8 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
													>
														<option value="pending">Pending</option>
														<option value="action_required">Action Required</option>
														<option value="passed">Passed</option>
														<option value="failed">Failed</option>
														<option value="expired">Expired</option>
													</select>
												</div>
												<div className="flex items-center gap-4 text-xs text-slate-600">
													<span>Status: <strong className="capitalize">{verification.status}</strong></span>
													{verification.expires_at && (
														<span>
															Expires: {new Date(verification.expires_at).toLocaleDateString()}
														</span>
													)}
													{verification.score !== null && (
														<span>Score: {verification.score}</span>
													)}
												</div>
												{verification.flags && Object.keys(verification.flags).length > 0 && (
													<div className="mt-2 p-2 bg-yellow-50 rounded text-xs">
														<strong>Flags:</strong> {JSON.stringify(verification.flags)}
													</div>
												)}
											</div>
										))}
									</div>
								) : (
									<p className="text-sm text-slate-500">No verifications found for this company.</p>
								)}
							</div>
						</div>
					) : (
						<div className="py-8 text-center text-slate-500">No credentials data available</div>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={() => {
							setCompanyDetailDialogOpen(false)
							setSelectedCompany(null)
							setCompanyCredentials(null)
						}}>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Review Moderation Dialog */}
			<Dialog open={moderationDialogOpen} onOpenChange={setModerationDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{moderationAction === 'approve' && 'Approve Review'}
							{moderationAction === 'reject' && 'Reject Review'}
							{moderationAction === 'flag' && 'Flag Review'}
						</DialogTitle>
						<DialogDescription>
							{selectedReview && (
								<div className="mt-2">
									<p className="text-sm">
										<strong>Customer:</strong> {selectedReview.customer_name}
									</p>
									<p className="text-sm">
										<strong>Provider:</strong> {selectedReview.provider_name}
									</p>
									<p className="text-sm mt-2">
										<strong>Rating:</strong> {selectedReview.rating} / 5
									</p>
									{selectedReview.comment && (
										<div className="mt-2 p-2 bg-slate-50 rounded">
											<p className="text-sm">
												<strong>Comment:</strong> {selectedReview.comment}
											</p>
										</div>
									)}
								</div>
							)}
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						{(moderationAction === 'reject' || moderationAction === 'flag') && (
							<div className="grid gap-2">
								<Label htmlFor="reason">
									Reason {moderationAction === 'flag' && '*'}
								</Label>
								<Textarea
									id="reason"
									value={moderationReason}
									onChange={(e) => setModerationReason(e.target.value)}
									placeholder={
										moderationAction === 'flag'
											? 'Enter reason for flagging this review...'
											: 'Enter rejection reason (optional)...'
									}
									rows={3}
								/>
							</div>
						)}
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setModerationDialogOpen(false)}>
							Cancel
						</Button>
						<Button
							onClick={() => {
								if (selectedReview) {
									if (moderationAction === 'flag' && !moderationReason.trim()) {
										alert('Please provide a reason for flagging this review')
										return
									}
									handleReviewAction(
										selectedReview,
										moderationAction,
										moderationReason || undefined
									)
								}
							}}
							variant={moderationAction === 'approve' ? 'default' : moderationAction === 'flag' ? 'destructive' : 'outline'}
						>
							{moderationAction === 'approve' && 'Approve'}
							{moderationAction === 'reject' && 'Reject'}
							{moderationAction === 'flag' && 'Flag Review'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Review Audit Trail Dialog */}
			<Dialog open={reviewAuditDialogOpen} onOpenChange={setReviewAuditDialogOpen}>
				<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Review Audit Trail</DialogTitle>
						<DialogDescription>
							Complete history of actions taken on this review
						</DialogDescription>
					</DialogHeader>
					{loadingAuditTrail ? (
						<div className="py-8 text-center text-slate-500">Loading audit trail...</div>
					) : reviewAuditTrail.length > 0 ? (
						<div className="space-y-3 py-4">
							{reviewAuditTrail.map((log: any, index: number) => (
								<div key={index} className="p-3 border border-slate-200 rounded-lg">
									<div className="flex items-center justify-between mb-1">
										<span className="font-medium text-sm">{log.action || log.event_type}</span>
										<span className="text-xs text-slate-500">
											{new Date(log.created_at || log.timestamp).toLocaleString()}
										</span>
									</div>
									{log.actor && (
										<p className="text-xs text-slate-600">By: {log.actor}</p>
									)}
									{log.reason && (
										<p className="text-xs text-slate-600 mt-1">Reason: {log.reason}</p>
									)}
									{log.payload && typeof log.payload === 'object' && (
										<details className="mt-2">
											<summary className="text-xs text-slate-500 cursor-pointer">View details</summary>
											<pre className="mt-1 p-2 bg-slate-50 rounded text-xs overflow-auto">
												{JSON.stringify(log.payload, null, 2)}
											</pre>
										</details>
									)}
								</div>
							))}
						</div>
					) : (
						<div className="py-8 text-center text-slate-500">No audit trail available</div>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={() => {
							setReviewAuditDialogOpen(false)
							setReviewAuditTrail([])
						}}>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
