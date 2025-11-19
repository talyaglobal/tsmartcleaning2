'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { JobApplicationForm } from './JobApplicationForm'
import { MapPin, Briefcase, Clock, Search, Filter, X } from 'lucide-react'

interface JobListing {
  id: string
  title: string
  description: string
  category: string
  department: string
  employment_type: string
  location_type: string
  location?: string
  salary_display?: string
  posted_at: string
  application_deadline?: string
}

interface JobListingsProps {
  initialJobs?: JobListing[]
}

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'design', label: 'Design' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'customer-success', label: 'Customer Success' },
  { value: 'operations', label: 'Operations' },
  { value: 'product', label: 'Product' },
  { value: 'other', label: 'Other' },
]

const DEPARTMENTS = [
  { value: '', label: 'All Departments' },
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Design', label: 'Design' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Customer Success', label: 'Customer Success' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Product', label: 'Product' },
  { value: 'Other', label: 'Other' },
]

const EMPLOYMENT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
]

const LOCATION_TYPES = [
  { value: '', label: 'All Locations' },
  { value: 'remote', label: 'Remote' },
  { value: 'on-site', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
]

export function JobListings({ initialJobs = [] }: JobListingsProps) {
  const [jobs, setJobs] = React.useState<JobListing[]>(initialJobs)
  const [loading, setLoading] = React.useState(false)
  const [selectedJob, setSelectedJob] = React.useState<JobListing | null>(null)
  const [applicationFormOpen, setApplicationFormOpen] = React.useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = React.useState('')
  const [category, setCategory] = React.useState('')
  const [department, setDepartment] = React.useState('')
  const [employmentType, setEmploymentType] = React.useState('')
  const [locationType, setLocationType] = React.useState('')

  const fetchJobs = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (category) params.append('category', category)
      if (department) params.append('department', department)
      if (employmentType) params.append('employmentType', employmentType)
      if (locationType) params.append('locationType', locationType)

      const response = await fetch(`/api/jobs?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch jobs')

      const data = await response.json()
      setJobs(data.jobs || [])
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, category, department, employmentType, locationType])

  React.useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const handleApply = (job: JobListing) => {
    setSelectedJob(job)
    setApplicationFormOpen(true)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setCategory('')
    setDepartment('')
    setEmploymentType('')
    setLocationType('')
  }

  const hasActiveFilters = searchQuery || category || department || employmentType || locationType

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Posted today'
    if (diffDays <= 7) return `Posted ${diffDays} days ago`
    return `Posted ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  return (
    <>
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept.value} value={dept.value}>
                    {dept.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={employmentType} onValueChange={setEmploymentType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={locationType} onValueChange={setLocationType}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                {LOCATION_TYPES.map((loc) => (
                  <SelectItem key={loc.value} value={loc.value}>
                    {loc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading jobs...
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No jobs found matching your criteria.</p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} found
            </div>
            {jobs.map((job) => (
              <Card key={job.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          <span>{job.department}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{job.employment_type.replace('-', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {job.location_type === 'remote' ? 'Remote' : job.location || 'Location TBD'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm line-clamp-3">{job.description}</p>
                    {job.salary_display && (
                      <Badge variant="secondary">{job.salary_display}</Badge>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDate(job.posted_at)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:min-w-[120px]">
                    <Button
                      onClick={() => handleApply(job)}
                      className="w-full sm:w-auto"
                    >
                      Apply
                    </Button>
                    {job.application_deadline && new Date(job.application_deadline) > new Date() && (
                      <p className="text-xs text-muted-foreground text-center sm:text-left">
                        Deadline: {new Date(job.application_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <JobApplicationForm
        job={selectedJob}
        open={applicationFormOpen}
        onOpenChange={setApplicationFormOpen}
        onSuccess={() => {
          // Optionally refresh jobs or show success message
        }}
      />
    </>
  )
}

