'use client'

import { useState, useEffect, useMemo } from 'react'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Search, Filter, Download, Eye, FileText, Mail, Phone, MapPin,
  CheckCircle2, Clock, XCircle, User, Calendar, Briefcase
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface JobApplication {
  id: string
  applicant_name: string
  applicant_email: string
  applicant_phone?: string
  status: 'pending' | 'reviewing' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn' | 'hired'
  created_at: string
  updated_at: string
  job_listing?: {
    id: string
    title: string
    department: string
  }
  resume_url?: string
  cover_letter?: string
  notes?: string
  reviewed_by?: string
  reviewed_at?: string
  // Extended fields
  first_name?: string
  last_name?: string
  date_of_birth?: string
  address_city?: string
  address_state?: string
  years_experience?: number
  photo_url?: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewing: 'bg-blue-100 text-blue-800',
  interviewing: 'bg-purple-100 text-purple-800',
  offered: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-800',
  hired: 'bg-emerald-100 text-emerald-800',
}

export default function AdminJobApplicationsPage() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [notesDialogOpen, setNotesDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [notes, setNotes] = useState('')

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  useEffect(() => {
    loadApplications()
  }, [statusFilter, dateFilter])

  const loadApplications = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      
      const response = await fetch(`/api/job-applications?${params.toString()}`)
      const data = await response.json()
      setApplications(data.applications || [])
    } catch (error) {
      console.error('Error loading applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredApplications = useMemo(() => {
    let filtered = applications

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(app => 
        app.applicant_name.toLowerCase().includes(query) ||
        app.applicant_email.toLowerCase().includes(query) ||
        app.id.toLowerCase().includes(query) ||
        app.job_listing?.title.toLowerCase().includes(query)
      )
    }

    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0]
      filtered = filtered.filter(app => app.created_at.startsWith(today))
    } else if (dateFilter === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      filtered = filtered.filter(app => new Date(app.created_at) >= weekAgo)
    } else if (dateFilter === 'month') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      filtered = filtered.filter(app => new Date(app.created_at) >= monthAgo)
    }

    return filtered
  }, [applications, searchQuery, dateFilter])

  const handleViewDetails = (application: JobApplication) => {
    setSelectedApplication(application)
    setDetailDialogOpen(true)
  }

  const handleUpdateStatus = async () => {
    if (!selectedApplication || !newStatus) return

    try {
      const response = await fetch(`/api/job-applications/${selectedApplication.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          notes: notes || selectedApplication.notes,
        }),
      })

      if (response.ok) {
        await loadApplications()
        setStatusDialogOpen(false)
        setDetailDialogOpen(false)
        setSelectedApplication(null)
        setNewStatus('')
        setNotes('')
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const stats = useMemo(() => {
    return {
      total: applications.length,
      pending: applications.filter(a => a.status === 'pending').length,
      reviewing: applications.filter(a => a.status === 'reviewing').length,
      interviewing: applications.filter(a => a.status === 'interviewing').length,
      hired: applications.filter(a => a.status === 'hired').length,
    }
  }, [applications])

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav userType="admin" userName="Admin User" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Job Applications</h1>
          <p className="text-muted-foreground">Review and manage job applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Total</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Reviewing</div>
            <div className="text-2xl font-bold text-blue-600">{stats.reviewing}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Interviewing</div>
            <div className="text-2xl font-bold text-purple-600">{stats.interviewing}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Hired</div>
            <div className="text-2xl font-bold text-green-600">{stats.hired}</div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or application ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="interviewing">Interviewing</SelectItem>
                <SelectItem value="offered">Offered</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Applications Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Applicant</th>
                  <th className="text-left p-4 font-medium">Position</th>
                  <th className="text-left p-4 font-medium">Date Applied</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Loading applications...
                    </td>
                  </tr>
                ) : filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No applications found
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((app) => (
                    <tr key={app.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {app.photo_url ? (
                            <img
                              src={app.photo_url}
                              alt={app.applicant_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{app.applicant_name}</div>
                            <div className="text-sm text-muted-foreground">{app.applicant_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{app.job_listing?.title || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">{app.job_listing?.department || ''}</div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {format(new Date(app.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="p-4">
                        <Badge className={cn(STATUS_COLORS[app.status] || 'bg-gray-100 text-gray-800')}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(app)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Application Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
              <DialogDescription>
                Application ID: {selectedApplication?.id}
              </DialogDescription>
            </DialogHeader>
            {selectedApplication && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Applicant Name</Label>
                    <p className="font-medium">{selectedApplication.applicant_name}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="font-medium">{selectedApplication.applicant_email}</p>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <p className="font-medium">{selectedApplication.applicant_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <Label>Position</Label>
                    <p className="font-medium">{selectedApplication.job_listing?.title || 'N/A'}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge className={cn(STATUS_COLORS[selectedApplication.status] || 'bg-gray-100 text-gray-800')}>
                      {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <Label>Date Applied</Label>
                    <p className="font-medium">{format(new Date(selectedApplication.created_at), 'PPpp')}</p>
                  </div>
                </div>

                {selectedApplication.cover_letter && (
                  <div>
                    <Label>Cover Letter</Label>
                    <div className="mt-2 p-4 bg-muted rounded-lg">
                      <p className="whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                    </div>
                  </div>
                )}

                {selectedApplication.resume_url && (
                  <div>
                    <Label>Resume</Label>
                    <div className="mt-2">
                      <Link
                        href={selectedApplication.resume_url}
                        target="_blank"
                        className="inline-flex items-center gap-2 text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        View Resume
                      </Link>
                    </div>
                  </div>
                )}

                {selectedApplication.notes && (
                  <div>
                    <Label>Internal Notes</Label>
                    <div className="mt-2 p-4 bg-muted rounded-lg">
                      <p className="whitespace-pre-wrap">{selectedApplication.notes}</p>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNewStatus(selectedApplication.status)
                      setNotes(selectedApplication.notes || '')
                      setStatusDialogOpen(true)
                    }}
                  >
                    Update Status
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Update Status Dialog */}
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Application Status</DialogTitle>
              <DialogDescription>
                Update the status and add notes for this application
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="interviewing">Interviewing</SelectItem>
                    <SelectItem value="offered">Offered</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add internal notes..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateStatus}>
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

