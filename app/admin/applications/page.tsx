'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, Filter, Calendar as CalendarIcon, 
  CheckCircle2, Clock, XCircle, Eye, FileText,
  Mail, Phone, MapPin, Briefcase, User, FileDown, ExternalLink
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface JobApplication {
  id: string
  job_listing_id: string
  applicant_email: string
  applicant_name: string
  applicant_phone?: string
  cover_letter?: string
  resume_url?: string
  portfolio_url?: string
  linkedin_url?: string
  status: 'pending' | 'reviewing' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn' | 'hired'
  notes?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
  address_proof_urls?: string[]
  work_permit_document_url?: string
  photo_url?: string
  id_document_url?: string
  application_data?: any
  job_listing?: {
    id: string
    title: string
    department: string
    employment_type: string
    location_type: string
    location?: string
  }
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewing', label: 'Under Review' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offered', label: 'Offer Extended' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'hired', label: 'Hired' },
]

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewing: 'bg-blue-100 text-blue-800',
  interviewing: 'bg-purple-100 text-purple-800',
  offered: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-800',
  hired: 'bg-emerald-100 text-emerald-800',
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [jobFilter, setJobFilter] = useState('all')
  const [jobListings, setJobListings] = useState<any[]>([])
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [statusUpdate, setStatusUpdate] = useState<{ status: string; notes: string }>({
    status: '',
    notes: '',
  })

  useEffect(() => {
    loadApplications()
    loadJobListings()
  }, [])

  useEffect(() => {
    filterApplications()
  }, [applications, searchQuery, statusFilter, jobFilter])

  const loadApplications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/job-applications')
      const data = await response.json()
      if (data.applications) {
        setApplications(data.applications)
      }
    } catch (error) {
      console.error('Error loading applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const loadJobListings = async () => {
    try {
      const response = await fetch('/api/jobs')
      const data = await response.json()
      if (data.jobs) {
        setJobListings(data.jobs)
      }
    } catch (error) {
      console.error('Error loading job listings:', error)
    }
  }

  const filterApplications = () => {
    let filtered = [...applications]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(app => 
        app.applicant_name.toLowerCase().includes(query) ||
        app.applicant_email.toLowerCase().includes(query) ||
        app.applicant_phone?.toLowerCase().includes(query) ||
        app.job_listing?.title.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter)
    }

    // Job filter
    if (jobFilter !== 'all') {
      filtered = filtered.filter(app => app.job_listing_id === jobFilter)
    }

    setFilteredApplications(filtered)
  }

  const handleViewDetails = (application: JobApplication) => {
    setSelectedApplication(application)
    setStatusUpdate({
      status: application.status,
      notes: application.notes || '',
    })
    setIsDetailsOpen(true)
  }

  const handleUpdateStatus = async () => {
    if (!selectedApplication) return

    try {
      setUpdatingStatus(true)
      const response = await fetch(`/api/job-applications/${selectedApplication.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: statusUpdate.status,
          notes: statusUpdate.notes,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      const data = await response.json()
      setApplications(applications.map(app => 
        app.id === selectedApplication.id ? data.application : app
      ))
      setSelectedApplication(data.application)
      toast.success('Application status updated successfully')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const getStatusCounts = () => {
    const counts: Record<string, number> = {}
    STATUS_OPTIONS.forEach(opt => {
      if (opt.value !== 'all') {
        counts[opt.value] = applications.filter(app => app.status === opt.value).length
      }
    })
    return counts
  }

  const statusCounts = getStatusCounts()

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Job Applications</h1>
        <p className="text-muted-foreground">Review and manage job applications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {STATUS_OPTIONS.filter(opt => opt.value !== 'all').map(opt => (
          <Card key={opt.value}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{opt.label}</p>
                  <p className="text-2xl font-bold mt-1">{statusCounts[opt.value] || 0}</p>
                </div>
                <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', STATUS_COLORS[opt.value])}>
                  {opt.value === 'pending' && <Clock className="h-6 w-6" />}
                  {opt.value === 'reviewing' && <Eye className="h-6 w-6" />}
                  {opt.value === 'interviewing' && <CalendarIcon className="h-6 w-6" />}
                  {opt.value === 'offered' && <CheckCircle2 className="h-6 w-6" />}
                  {opt.value === 'rejected' && <XCircle className="h-6 w-6" />}
                  {opt.value === 'withdrawn' && <XCircle className="h-6 w-6" />}
                  {opt.value === 'hired' && <CheckCircle2 className="h-6 w-6" />}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Job Position</Label>
              <Select value={jobFilter} onValueChange={setJobFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Positions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  {jobListings.map(job => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-muted-foreground">No applications found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map(application => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{application.applicant_name}</h3>
                      <Badge className={STATUS_COLORS[application.status]}>
                        {STATUS_OPTIONS.find(opt => opt.value === application.status)?.label || application.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{application.applicant_email}</span>
                      </div>
                      {application.applicant_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{application.applicant_phone}</span>
                        </div>
                      )}
                      {application.job_listing && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          <span>{application.job_listing.title}</span>
                          <span className="text-xs">• {application.job_listing.department}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        <span>Applied {format(new Date(application.created_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  <Button onClick={() => handleViewDetails(application)} variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Application Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Review application details and update status
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="details">Full Details</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Applicant Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        <p className="font-medium">Name</p>
                        <p className="text-muted-foreground">{selectedApplication.applicant_name}</p>
                      </div>
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-muted-foreground">{selectedApplication.applicant_email}</p>
                      </div>
                      {selectedApplication.applicant_phone && (
                        <div>
                          <p className="font-medium">Phone</p>
                          <p className="text-muted-foreground">{selectedApplication.applicant_phone}</p>
                        </div>
                      )}
                      {selectedApplication.job_listing && (
                        <div>
                          <p className="font-medium">Position</p>
                          <p className="text-muted-foreground">{selectedApplication.job_listing.title}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Application Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Status</Label>
                        <Select 
                          value={statusUpdate.status} 
                          onValueChange={(value) => setStatusUpdate({ ...statusUpdate, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.filter(opt => opt.value !== 'all').map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Notes</Label>
                        <Textarea
                          value={statusUpdate.notes}
                          onChange={(e) => setStatusUpdate({ ...statusUpdate, notes: e.target.value })}
                          placeholder="Add notes about this application..."
                          rows={4}
                        />
                      </div>
                      <Button 
                        onClick={handleUpdateStatus} 
                        disabled={updatingStatus}
                        className="w-full"
                      >
                        {updatingStatus ? 'Updating...' : 'Update Status'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {selectedApplication.cover_letter && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Cover Letter</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {selectedApplication.resume_url && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Resume</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <a 
                          href={selectedApplication.resume_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          View Resume
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </CardContent>
                    </Card>
                  )}

                  {selectedApplication.photo_url && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Profile Photo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <a 
                          href={selectedApplication.photo_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          View Photo
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </CardContent>
                    </Card>
                  )}

                  {selectedApplication.id_document_url && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">ID Document</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <a 
                          href={selectedApplication.id_document_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          View ID Document
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </CardContent>
                    </Card>
                  )}

                  {selectedApplication.work_permit_document_url && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Work Permit</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <a 
                          href={selectedApplication.work_permit_document_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          View Work Permit
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </CardContent>
                    </Card>
                  )}

                  {selectedApplication.address_proof_urls && selectedApplication.address_proof_urls.length > 0 && (
                    <Card className="col-span-2">
                      <CardHeader>
                        <CardTitle className="text-base">Address Proof Documents</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {selectedApplication.address_proof_urls.map((url, index) => (
                          <a 
                            key={index}
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-primary hover:underline"
                          >
                            <FileText className="h-4 w-4" />
                            Address Proof {index + 1}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Full Application Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-96">
                      {JSON.stringify(selectedApplication.application_data || {}, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

