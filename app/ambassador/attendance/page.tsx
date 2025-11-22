'use client'

import React, { useEffect, useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, Column } from '@/components/admin/DataTable'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ClipboardCheck, CheckCircle, XCircle, Clock, Calendar as CalendarIcon, Search } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'

type AttendanceRecord = {
	id: string
	memberId: string
	memberName: string
	date: string
	status: 'present' | 'absent' | 'late' | 'on_leave'
	clockIn?: string
	clockOut?: string
	hoursWorked?: number
	notes?: string
}

export default function AmbassadorAttendancePage() {
	const { user } = useAuth()
	const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
	const [loading, setLoading] = useState(true)
	const [selectedDate, setSelectedDate] = useState<Date>(new Date())
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState<string>('all')

	useEffect(() => {
		if (user?.id) {
			fetchAttendance()
		}
	}, [user?.id, selectedDate, statusFilter])

	const fetchAttendance = async () => {
		if (!user?.id) return
		
		setLoading(true)
		try {
			const dateStr = selectedDate.toISOString().split('T')[0]
			const response = await fetch(
				`/api/ambassador/attendance?ambassadorId=${user.id}&date=${dateStr}&status=${statusFilter === 'all' ? '' : statusFilter}`
			)
			const data = await response.json()
			if (data.attendance) {
				setAttendance(data.attendance.map((a: any) => ({
					id: a.id,
					memberId: a.member_id || a.user_id,
					memberName: a.member_name || a.name || 'N/A',
					date: a.date || a.attendance_date,
					status: a.status || 'absent',
					clockIn: a.clock_in,
					clockOut: a.clock_out,
					hoursWorked: a.hours_worked,
					notes: a.notes,
				})))
			}
		} catch (error) {
			console.error('Error fetching attendance:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleStatusUpdate = async (recordId: string, newStatus: string) => {
		try {
			const response = await fetch(`/api/attendance/${recordId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatus }),
			})
			
			if (response.ok) {
				fetchAttendance()
			}
		} catch (error) {
			console.error('Error updating attendance:', error)
		}
	}

	const filteredAttendance = attendance.filter(record =>
		record.memberName.toLowerCase().includes(searchQuery.toLowerCase())
	)

	const getStatusBadge = (status: string) => {
		const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
			present: 'default',
			late: 'secondary',
			absent: 'destructive',
			on_leave: 'outline',
		}
		return (
			<Badge variant={variants[status] || 'outline'}>
				{status === 'present' ? 'Present' : status === 'late' ? 'Late' : status === 'on_leave' ? 'On Leave' : 'Absent'}
			</Badge>
		)
	}

	const columns: Column<AttendanceRecord>[] = [
		{ key: 'memberName', label: 'Team Member' },
		{ key: 'date', label: 'Date' },
		{ 
			key: 'status', 
			label: 'Status',
			render: (record) => getStatusBadge(record.status)
		},
		{ 
			key: 'clockIn', 
			label: 'Clock In',
			render: (record) => record.clockIn || '-'
		},
		{ 
			key: 'clockOut', 
			label: 'Clock Out',
			render: (record) => record.clockOut || '-'
		},
		{ 
			key: 'hoursWorked', 
			label: 'Hours',
			render: (record) => record.hoursWorked ? `${record.hoursWorked.toFixed(1)}h` : '-'
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (record) => (
				<div className="flex gap-2">
					{record.status !== 'present' && (
						<Button size="sm" onClick={() => handleStatusUpdate(record.id, 'present')}>
							Mark Present
						</Button>
					)}
				</div>
			)
		},
	]

	const stats = {
		present: attendance.filter(a => a.status === 'present').length,
		absent: attendance.filter(a => a.status === 'absent').length,
		late: attendance.filter(a => a.status === 'late').length,
		total: attendance.length,
	}

	if (loading) {
		return <div className="p-6">Loading...</div>
	}

	return (
		<div className="p-6 space-y-6">
			<PageHeader
				title="Attendance"
				description="Track your team's attendance"
			/>

			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Total</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.total}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center gap-2">
							<CheckCircle className="h-4 w-4 text-green-500" />
							Present
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-500">{stats.present}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center gap-2">
							<Clock className="h-4 w-4 text-yellow-500" />
							Late
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-yellow-500">{stats.late}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center gap-2">
							<XCircle className="h-4 w-4 text-red-500" />
							Absent
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-500">{stats.absent}</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Date Selection & Filters</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label className="text-sm font-medium mb-2 block">Select Date</label>
							<Calendar
								mode="single"
								selected={selectedDate}
								onSelect={(date) => date && setSelectedDate(date)}
								className="rounded-md border"
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium">Search</label>
							<div className="relative">
								<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search members..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-9"
								/>
							</div>
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger>
									<SelectValue placeholder="Filter by status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="present">Present</SelectItem>
									<SelectItem value="late">Late</SelectItem>
									<SelectItem value="absent">Absent</SelectItem>
									<SelectItem value="on_leave">On Leave</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Attendance Records ({filteredAttendance.length})</CardTitle>
				</CardHeader>
				<CardContent>
					<DataTable
						data={filteredAttendance}
						columns={columns}
						searchKeys={['memberName']}
					/>
				</CardContent>
			</Card>
		</div>
	)
}
