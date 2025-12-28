'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from "next/link"
import { PageHeader } from "@/components/admin/PageHeader"
import { DataTable, Column } from "@/components/admin/DataTable"
import { EmptyState } from "@/components/admin/EmptyState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Star, Search, CheckCircle, XCircle, Flag, MessageSquare, BarChart3 } from 'lucide-react'

type Review = {
	id: string
	rating: number
	comment: string | null
	status: 'pending' | 'approved' | 'flagged' | 'rejected'
	customer_name: string
	provider_name: string
	created_at: string
	flagged_reason: string | null
}

export default function ReviewsPage() {
	const [reviews, setReviews] = useState<Review[]>([])
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [ratingFilter, setRatingFilter] = useState<string>('all')

	useEffect(() => {
		fetchReviews()
	}, [statusFilter, ratingFilter])

	const fetchReviews = async () => {
		setLoading(true)
		try {
			const params = new URLSearchParams()
			if (statusFilter !== 'all') {
				params.append('status', statusFilter)
			}
			if (ratingFilter !== 'all') {
				params.append('rating', ratingFilter)
			}
			const res = await fetch(`/api/root-admin/reviews?${params.toString()}`)
			if (res.ok) {
				const data = await res.json()
				setReviews(data.reviews || [])
			} else {
				console.error('Failed to fetch reviews')
				setReviews([])
			}
		} catch (error) {
			console.error('Error fetching reviews:', error)
			setReviews([])
		} finally {
			setLoading(false)
		}
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

		if (statusFilter !== 'all') {
			filtered = filtered.filter((r) => r.status === statusFilter)
		}

		if (ratingFilter !== 'all') {
			const rating = parseInt(ratingFilter)
			filtered = filtered.filter((r) => r.rating === rating)
		}

		return filtered
	}, [reviews, searchQuery, statusFilter, ratingFilter])

	const reviewStats = useMemo(() => {
		const total = reviews.length
		const pending = reviews.filter((r) => r.status === 'pending').length
		const flagged = reviews.filter((r) => r.status === 'flagged').length
		const avgRating =
			reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1)

		return { total, pending, flagged, avgRating }
	}, [reviews])

	const handleReviewAction = async (reviewId: string, action: 'approve' | 'reject' | 'flag', reason?: string) => {
		try {
			const body: any = { action }
			if (reason) {
				body.reason = reason
			}
			const res = await fetch(`/api/root-admin/reviews/${reviewId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			})
			if (res.ok) {
				fetchReviews()
			} else {
				const error = await res.json()
				alert(error.error || 'Failed to update review')
			}
		} catch (error) {
			console.error('Error updating review:', error)
			alert('Failed to update review')
		}
	}

	const columns: Column<Review>[] = [
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
								onClick={() => handleReviewAction(review.id, 'approve')}
							>
								<CheckCircle className="h-4 w-4 text-green-600" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => handleReviewAction(review.id, 'reject')}
							>
								<XCircle className="h-4 w-4 text-red-600" />
							</Button>
						</>
					)}
					{review.status === 'flagged' && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								const reason = prompt('Enter flag reason:')
								if (reason) {
									handleReviewAction(review.id, 'flag', reason)
								}
							}}
						>
							<MessageSquare className="h-4 w-4" />
						</Button>
					)}
					{review.status === 'pending' && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								const reason = prompt('Enter rejection reason (optional):')
								handleReviewAction(review.id, 'reject', reason || undefined)
							}}
							title="Reject with reason"
						>
							<XCircle className="h-4 w-4 text-red-600" />
						</Button>
					)}
				</div>
			),
		},
	]

	return (
		<>
			<PageHeader
				title="Review Management"
				subtitle="Moderate reviews, handle flagged content, and view analytics."
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<span>Reviews</span>
					</div>
				}
				actions={
					<Button variant="outline" size="sm">
						<BarChart3 className="h-4 w-4 mr-2" />
						Analytics
					</Button>
				}
			/>

			{/* Stats */}
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
					value={statusFilter}
					onChange={(e) => setStatusFilter(e.target.value)}
					className="h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="all">All Statuses</option>
					<option value="pending">Pending</option>
					<option value="approved">Approved</option>
					<option value="flagged">Flagged</option>
					<option value="rejected">Rejected</option>
				</select>
				<select
					value={ratingFilter}
					onChange={(e) => setRatingFilter(e.target.value)}
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
				columns={columns}
				data={filteredReviews}
				loading={loading}
				emptyState={
					<EmptyState
						title="No reviews found"
						subtitle="Review moderation interface. Connect to your reviews API endpoint to display data."
						icon={<Star className="h-8 w-8" />}
					/>
				}
			/>
		</>
	)
}
