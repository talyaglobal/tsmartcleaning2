'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Clock, XCircle, FileText, Search } from 'lucide-react'
import Link from 'next/link'

interface JobApplication {
  id: string
  job_listing_id: string
  applicant_email: string
  applicant_name: string
  status: string
  created_at: string
  updated_at: string
  job_listing?: {
    id: string
    title: string
    department: string
  }
}

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  pending: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/20',
    text: 'text-yellow-800 dark:text-yellow-200',
    icon: <Clock className="h-4 w-4" />,
  },
  reviewing: {
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    text: 'text-blue-800 dark:text-blue-200',
    icon: <FileText className="h-4 w-4" />,
  },
  interviewing: {
    bg: 'bg-purple-100 dark:bg-purple-900/20',
    text: 'text-purple-800 dark:text-purple-200',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  offered: {
    bg: 'bg-green-100 dark:bg-green-900/20',
    text: 'text-green-800 dark:text-green-200',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  rejected: {
    bg: 'bg-red-100 dark:bg-red-900/20',
    text: 'text-red-800 dark:text-red-200',
    icon: <XCircle className="h-4 w-4" />,
  },
  withdrawn: {
    bg: 'bg-gray-100 dark:bg-gray-900/20',
    text: 'text-gray-800 dark:text-gray-200',
    icon: <XCircle className="h-4 w-4" />,
  },
  hired: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/20',
    text: 'text-emerald-800 dark:text-emerald-200',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
}

function getStatusDisplay(status: string) {
  return status
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default function ApplicationTrackerPage() {
  const [email, setEmail] = React.useState('')
  const [applications, setApplications] = React.useState<JobApplication[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [searched, setSearched] = React.useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError(null)
    setSearched(true)

    try {
      const response = await fetch(`/api/job-applications?applicantEmail=${encodeURIComponent(email)}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch applications')
      }

      const data = await response.json()
      setApplications(data.applications || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load applications. Please try again.')
      setApplications([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Application Tracker</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Track the status of your job applications by entering your email address
          </p>
        </div>

        <Card className="p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                {error}
              </div>
            )}
          </form>
        </Card>

        {searched && !loading && (
          <div className="space-y-4">
            {applications.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Applications Found</h3>
                <p className="text-muted-foreground mb-4">
                  We couldn't find any applications for this email address.
                </p>
                <Button asChild>
                  <Link href="/careers">Browse Open Positions</Link>
                </Button>
              </Card>
            ) : (
              <>
                <div className="text-sm text-muted-foreground mb-4">
                  Found {applications.length} {applications.length === 1 ? 'application' : 'applications'}
                </div>
                {applications.map((application) => {
                  const statusInfo = STATUS_COLORS[application.status] || STATUS_COLORS.pending
                  return (
                    <Card key={application.id} className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-xl font-semibold mb-1">
                                {application.job_listing?.title || 'Job Application'}
                              </h3>
                              {application.job_listing && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {application.job_listing.department}
                                </p>
                              )}
                            </div>
                            <Badge
                              className={`${statusInfo.bg} ${statusInfo.text} border-0 flex items-center gap-1.5`}
                            >
                              {statusInfo.icon}
                              {getStatusDisplay(application.status)}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Applied on {formatDate(application.created_at)}</p>
                            {application.updated_at !== application.created_at && (
                              <p>Last updated {formatDate(application.updated_at)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </>
            )}
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Haven't applied yet? Check out our open positions.
          </p>
          <Button asChild variant="outline">
            <Link href="/careers">View Open Positions</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

