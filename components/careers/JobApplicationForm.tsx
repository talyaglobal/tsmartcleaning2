'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Upload, X, Loader2 } from 'lucide-react'

interface JobListing {
  id: string
  title: string
  department: string
  employment_type: string
  location_type: string
  location?: string
}

interface JobApplicationFormProps {
  job: JobListing | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function JobApplicationForm({ job, open, onOpenChange, onSuccess }: JobApplicationFormProps) {
  const [formData, setFormData] = React.useState({
    applicantName: '',
    applicantEmail: '',
    applicantPhone: '',
    coverLetter: '',
    portfolioUrl: '',
    linkedinUrl: '',
  })
  const [resumeFile, setResumeFile] = React.useState<File | null>(null)
  const [resumeFileName, setResumeFileName] = React.useState<string>('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setFormData({
        applicantName: '',
        applicantEmail: '',
        applicantPhone: '',
        coverLetter: '',
        portfolioUrl: '',
        linkedinUrl: '',
      })
      setResumeFile(null)
      setResumeFileName('')
      setError(null)
    }
  }, [open])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      const allowedExtensions = ['.pdf', '.doc', '.docx']
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        setError('Please upload a PDF, DOC, or DOCX file')
        return
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        setError('File size must be less than 5MB')
        return
      }

      setResumeFile(file)
      setResumeFileName(file.name)
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!job) return

    // Validate required fields
    if (!formData.applicantName.trim()) {
      setError('Please enter your name')
      return
    }

    if (!formData.applicantEmail.trim()) {
      setError('Please enter your email')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.applicantEmail)) {
      setError('Please enter a valid email address')
      return
    }

    if (!resumeFile) {
      setError('Please upload your resume')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('jobListingId', job.id)
      formDataToSend.append('applicantName', formData.applicantName)
      formDataToSend.append('applicantEmail', formData.applicantEmail)
      if (formData.applicantPhone) {
        formDataToSend.append('applicantPhone', formData.applicantPhone)
      }
      if (formData.coverLetter) {
        formDataToSend.append('coverLetter', formData.coverLetter)
      }
      if (formData.portfolioUrl) {
        formDataToSend.append('portfolioUrl', formData.portfolioUrl)
      }
      if (formData.linkedinUrl) {
        formDataToSend.append('linkedinUrl', formData.linkedinUrl)
      }
      formDataToSend.append('resume', resumeFile)

      const response = await fetch('/api/job-applications', {
        method: 'POST',
        body: formDataToSend,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to submit application')
      }

      const data = await response.json()
      
      // Success - close dialog and reset form
      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
      
      // Show success message (you could use a toast library here)
      alert('Application submitted successfully! We\'ll be in touch soon.')
    } catch (err: any) {
      setError(err.message || 'Failed to submit application. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!job) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for {job.title}</DialogTitle>
          <DialogDescription>
            {job.department} • {job.employment_type} • {job.location_type === 'remote' ? 'Remote' : job.location || 'Location TBD'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="applicantName">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="applicantName"
              value={formData.applicantName}
              onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
              placeholder="John Doe"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="applicantEmail">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="applicantEmail"
              type="email"
              value={formData.applicantEmail}
              onChange={(e) => setFormData({ ...formData, applicantEmail: e.target.value })}
              placeholder="john@example.com"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="applicantPhone">Phone Number</Label>
            <Input
              id="applicantPhone"
              type="tel"
              value={formData.applicantPhone}
              onChange={(e) => setFormData({ ...formData, applicantPhone: e.target.value })}
              placeholder="+1 (555) 123-4567"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resume">
              Resume/CV <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="resume"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                disabled={isSubmitting}
                className="cursor-pointer"
              />
              {resumeFileName && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="truncate max-w-[200px]">{resumeFileName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setResumeFile(null)
                      setResumeFileName('')
                      const input = document.getElementById('resume') as HTMLInputElement
                      if (input) input.value = ''
                    }}
                    className="text-destructive hover:text-destructive/80"
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              PDF, DOC, or DOCX format, max 5MB
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverLetter">Cover Letter</Label>
            <Textarea
              id="coverLetter"
              value={formData.coverLetter}
              onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
              placeholder="Tell us why you're interested in this position..."
              rows={6}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
            <Input
              id="linkedinUrl"
              type="url"
              value={formData.linkedinUrl}
              onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
              placeholder="https://linkedin.com/in/yourprofile"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="portfolioUrl">Portfolio/Website</Label>
            <Input
              id="portfolioUrl"
              type="url"
              value={formData.portfolioUrl}
              onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
              placeholder="https://yourportfolio.com"
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

