'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Upload, X, Loader2, ArrowLeft, ArrowRight, FileText, Briefcase, Calendar, MapPin, User, Mail, Phone, Home, BriefcaseIcon, Clock, Users } from 'lucide-react'
import Link from 'next/link'
import { generateBreadcrumbSchema } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ApplicationStepContent } from '@/components/careers/ApplicationStepContent'

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

interface JobListing {
  id: string
  title: string
  department: string
  employment_type: string
  location_type: string
  location?: string
}

// Validation schemas for each step
const Step1Schema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  middleName: z.string().optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  dateOfBirth: z.date({ required_error: 'Date of birth is required' }).refine(
    (date) => {
      const age = new Date().getFullYear() - date.getFullYear()
      return age >= 18
    },
    { message: 'You must be at least 18 years old' }
  ),
  gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say']).optional(),
  preferredLanguage: z.string().min(1, 'Preferred language is required'),
  otherLanguage: z.string().optional(),
  ssnSin: z.string().optional(), // Optional, can be provided later
})

const Step2Schema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number is required'),
  alternativePhone: z.string().optional(),
  preferredContactMethod: z.array(z.string()).min(1, 'Select at least one contact method'),
  bestTimeToReach: z.array(z.string()).optional(),
})

const Step3Schema = z.object({
  country: z.enum(['USA', 'Canada'], { required_error: 'Country is required' }),
  addressLine1: z.string().min(2, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State/Province is required'),
  zipCode: z.string().min(3, 'ZIP/Postal code is required'),
  addressYears: z.number().int().min(0),
  addressMonths: z.number().int().min(0).max(11),
  previousAddress: z.object({
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  }).optional(),
})

const Step4Schema = z.object({
  addressProofFiles: z.array(z.instanceof(File)).min(1, 'At least one proof of address document is required'),
})

const Step5Schema = z.object({
  workEligibilityCountry: z.enum(['USA', 'Canada'], { required_error: 'Country is required' }),
  workAuthorizationType: z.string().min(1, 'Work authorization type is required'),
  workPermitNumber: z.string().optional(),
  workPermitExpiry: z.date().optional(),
  workPermitDocument: z.instanceof(File).optional(),
})

const Step6Schema = z.object({
  photo: z.instanceof(File).optional(),
  idType: z.string().min(1, 'ID type is required'),
  idNumber: z.string().min(1, 'ID number is required'),
  idExpiry: z.date().optional(),
  idDocument: z.instanceof(File).optional(),
})

const Step7Schema = z.object({
  availabilityDays: z.array(z.string()).min(1, 'Select at least one day'),
  availabilityHours: z.string().min(1, 'Availability hours are required'),
  preferredLocations: z.array(z.string()).optional(),
  transportation: z.string().min(1, 'Transportation method is required'),
  hasVehicle: z.boolean().optional(),
  vehicleDetails: z.string().optional(),
})

const Step8Schema = z.object({
  yearsExperience: z.number().int().min(0),
  previousEmployers: z.array(z.object({
    name: z.string(),
    position: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    reasonForLeaving: z.string().optional(),
  })).optional(),
  references: z.array(z.object({
    name: z.string(),
    relationship: z.string(),
    phone: z.string(),
    email: z.string().email().optional(),
  })).min(2, 'At least 2 references are required'),
  emergencyContact: z.object({
    name: z.string().min(2, 'Emergency contact name is required'),
    relationship: z.string().min(2, 'Relationship is required'),
    phone: z.string().min(10, 'Phone number is required'),
    email: z.string().email().optional(),
  }),
})

const FormSchema = z.object({
  jobListingId: z.string().min(1, 'Please select a job position'),
  step1: Step1Schema,
  step2: Step2Schema,
  step3: Step3Schema,
  step4: Step4Schema,
  step5: Step5Schema,
  step6: Step6Schema,
  step7: Step7Schema,
  step8: Step8Schema,
  resume: z.instanceof(File).optional(),
  coverLetter: z.string().optional(),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
})

type FormValues = z.infer<typeof FormSchema>

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME',
  'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA',
  'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

const CANADIAN_PROVINCES = [
  'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'
]

export default function JobApplicationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobId = searchParams.get('jobId')

  const [step, setStep] = React.useState<Step>(1)
  const [jobListing, setJobListing] = React.useState<JobListing | null>(null)
  const [availableJobs, setAvailableJobs] = React.useState<JobListing[]>([])
  const [loadingJob, setLoadingJob] = React.useState(false)
  const [loadingJobs, setLoadingJobs] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [autoSaveStatus, setAutoSaveStatus] = React.useState<'saved' | 'saving' | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    mode: 'onChange',
    defaultValues: {
      jobListingId: jobId || '',
      step1: {
        firstName: '',
        middleName: '',
        lastName: '',
        gender: undefined,
        preferredLanguage: '',
        otherLanguage: '',
        ssnSin: '',
      },
      step2: {
        email: '',
        phone: '',
        alternativePhone: '',
        preferredContactMethod: [],
        bestTimeToReach: [],
      },
      step3: {
        country: undefined,
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
        addressYears: 0,
        addressMonths: 0,
      },
      step4: {
        addressProofFiles: [],
      },
      step5: {
        workEligibilityCountry: undefined,
        workAuthorizationType: '',
        workPermitNumber: '',
        workPermitDocument: undefined,
      },
      step6: {
        photo: undefined,
        idType: '',
        idNumber: '',
        idDocument: undefined,
      },
      step7: {
        availabilityDays: [],
        availabilityHours: '',
        preferredLocations: [],
        transportation: '',
        hasVehicle: false,
        vehicleDetails: '',
      },
      step8: {
        yearsExperience: 0,
        previousEmployers: [],
        references: [
          { name: '', relationship: '', phone: '', email: '' },
          { name: '', relationship: '', phone: '', email: '' },
        ],
        emergencyContact: {
          name: '',
          relationship: '',
          phone: '',
          email: '',
        },
      },
      resume: undefined,
      coverLetter: '',
      portfolioUrl: '',
      linkedinUrl: '',
    },
  })

  // Load job listing if jobId is provided, or load all jobs if not
  React.useEffect(() => {
    if (jobId) {
      setLoadingJob(true)
      fetch(`/api/jobs/${jobId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.job) {
            setJobListing(data.job)
            form.setValue('jobListingId', data.job.id)
          }
        })
        .catch((err) => {
          console.error('Error loading job:', err)
        })
        .finally(() => {
          setLoadingJob(false)
        })
    } else {
      setLoadingJobs(true)
      fetch('/api/jobs')
        .then((res) => res.json())
        .then((data) => {
          if (data.jobs) {
            setAvailableJobs(data.jobs.slice(0, 50))
          }
        })
        .catch((err) => {
          console.error('Error loading jobs:', err)
        })
        .finally(() => {
          setLoadingJobs(false)
        })
    }
  }, [jobId, form])

  // Auto-save to localStorage every 30 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      const formData = form.getValues()
      setAutoSaveStatus('saving')
      try {
        // Convert File objects to metadata for storage
        const draftData = {
          ...formData,
          step4: {
            ...formData.step4,
            addressProofFiles: formData.step4.addressProofFiles.map(f => ({
              name: f.name,
              size: f.size,
              type: f.type,
            })),
          },
          step5: {
            ...formData.step5,
            workPermitDocument: formData.step5.workPermitDocument ? {
              name: formData.step5.workPermitDocument.name,
              size: formData.step5.workPermitDocument.size,
              type: formData.step5.workPermitDocument.type,
            } : undefined,
          },
          step6: {
            ...formData.step6,
            photo: formData.step6.photo ? {
              name: formData.step6.photo.name,
              size: formData.step6.photo.size,
              type: formData.step6.photo.type,
            } : undefined,
            idDocument: formData.step6.idDocument ? {
              name: formData.step6.idDocument.name,
              size: formData.step6.idDocument.size,
              type: formData.step6.idDocument.type,
            } : undefined,
          },
          resume: formData.resume ? {
            name: formData.resume.name,
            size: formData.resume.size,
            type: formData.resume.type,
          } : undefined,
          step,
        }
        localStorage.setItem('job-application-draft', JSON.stringify(draftData))
        setAutoSaveStatus('saved')
        setTimeout(() => setAutoSaveStatus(null), 2000)
      } catch (err) {
        console.error('Error saving draft:', err)
        setAutoSaveStatus(null)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [form, step])

  // Load draft from localStorage on mount
  React.useEffect(() => {
    const draft = localStorage.getItem('job-application-draft')
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        // Restore form data (files won't be restored, but metadata will be)
        Object.keys(parsed).forEach((key) => {
          if (key !== 'step' && key !== 'step4' && key !== 'step5' && key !== 'step6' && key !== 'resume') {
            form.setValue(key as any, parsed[key])
          }
        })
        if (parsed.step) {
          setStep(parsed.step)
        }
      } catch (err) {
        console.error('Error loading draft:', err)
      }
    }
  }, [form])

  const validateStep = async (stepNum: Step): Promise<boolean> => {
    let schema: z.ZodSchema
    switch (stepNum) {
      case 1:
        schema = Step1Schema
        break
      case 2:
        schema = Step2Schema
        break
      case 3:
        schema = Step3Schema
        break
      case 4:
        schema = Step4Schema
        break
      case 5:
        schema = Step5Schema
        break
      case 6:
        schema = Step6Schema
        break
      case 7:
        schema = Step7Schema
        break
      case 8:
        schema = Step8Schema
        break
      default:
        return false
    }

    const stepData = form.getValues(`step${stepNum}` as any)
    const result = await schema.safeParseAsync(stepData)
    
    if (!result.success) {
      const errors = result.error.errors
      errors.forEach((err) => {
        form.setError(`step${stepNum}.${err.path.join('.')}` as any, {
          message: err.message,
        })
      })
      return false
    }
    return true
  }

  const handleNext = async () => {
    setError(null)
    const isValid = await validateStep(step)
    if (!isValid) {
      setError('Please complete all required fields before continuing')
      return
    }
    
    if (step < 8) {
      setStep((step + 1) as Step)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevious = () => {
    if (step > 1) {
      setStep((step - 1) as Step)
      setError(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const formDataToSend = new FormData()
      
      // Prepare application data without File objects (they'll be sent separately)
      const applicationDataToSend = {
        jobListingId: data.jobListingId,
        step1: data.step1,
        step2: data.step2,
        step3: data.step3,
        step4: {
          // Don't include files in JSON, they're sent separately
          addressProofFiles: data.step4.addressProofFiles.map(f => ({
            name: f.name,
            size: f.size,
            type: f.type,
          })),
        },
        step5: {
          ...data.step5,
          workPermitDocument: data.step5.workPermitDocument ? {
            name: data.step5.workPermitDocument.name,
            size: data.step5.workPermitDocument.size,
            type: data.step5.workPermitDocument.type,
          } : undefined,
        },
        step6: {
          ...data.step6,
          photo: data.step6.photo ? {
            name: data.step6.photo.name,
            size: data.step6.photo.size,
            type: data.step6.photo.type,
          } : undefined,
          idDocument: data.step6.idDocument ? {
            name: data.step6.idDocument.name,
            size: data.step6.idDocument.size,
            type: data.step6.idDocument.type,
          } : undefined,
        },
        step7: data.step7,
        step8: data.step8,
        resume: data.resume ? {
          name: data.resume.name,
          size: data.resume.size,
          type: data.resume.type,
        } : undefined,
        coverLetter: data.coverLetter,
        portfolioUrl: data.portfolioUrl,
        linkedinUrl: data.linkedinUrl,
      }
      
      formDataToSend.append('applicationData', JSON.stringify(applicationDataToSend))
      
      // Add files separately
      if (data.resume) {
        formDataToSend.append('resume', data.resume)
      }
      if (data.step4.addressProofFiles.length > 0) {
        data.step4.addressProofFiles.forEach((file, index) => {
          formDataToSend.append(`addressProof_${index}`, file)
        })
      }
      if (data.step5.workPermitDocument) {
        formDataToSend.append('workPermitDocument', data.step5.workPermitDocument)
      }
      if (data.step6.photo) {
        formDataToSend.append('photo', data.step6.photo)
      }
      if (data.step6.idDocument) {
        formDataToSend.append('idDocument', data.step6.idDocument)
      }

      const response = await fetch('/api/job-applications', {
        method: 'POST',
        body: formDataToSend,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to submit application')
      }

      const result = await response.json()
      
      // Clear draft
      localStorage.removeItem('job-application-draft')
      
      // Redirect to confirmation page
      router.push(`/careers/apply/confirmation?applicationId=${result.application?.id || ''}`)
    } catch (err: any) {
      setError(err.message || 'Failed to submit application. Please try again.')
      toast.error(err.message || 'Failed to submit application')
    } finally {
      setIsSubmitting(false)
    }
  }

  const progressValue = (step / 8) * 100

  const steps = [
    { number: 1, title: 'Personal Information', icon: User, description: 'Name, date of birth, and basic info' },
    { number: 2, title: 'Contact Details', icon: Mail, description: 'Email, phone, and contact preferences' },
    { number: 3, title: 'Address Information', icon: Home, description: 'Current address and residency' },
    { number: 4, title: 'Address Proof', icon: FileText, description: 'Upload proof of address documents' },
    { number: 5, title: 'Work Eligibility', icon: BriefcaseIcon, description: 'Work authorization and permits' },
    { number: 6, title: 'Photo & ID', icon: User, description: 'Photo and identification documents' },
    { number: 7, title: 'Availability', icon: Clock, description: 'Schedule and transportation' },
    { number: 8, title: 'Experience & References', icon: Users, description: 'Work history and references' },
  ]

  return (
    <FormProvider {...form}>
      <div className="min-h-screen py-12 md:py-20 bg-gradient-to-b from-primary/5 to-background">
        <JsonLd
          data={generateBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Careers', url: '/careers' },
            { name: 'Apply', url: '/careers/apply' },
          ])}
        />

        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/careers" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Careers
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Job Application</h1>
            {jobListing && (
              <div className="mt-4">
                <Badge variant="secondary" className="text-base px-4 py-2">
                  <Briefcase className="h-4 w-4 mr-2" />
                  {jobListing.title}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  {jobListing.department} • {jobListing.employment_type.replace('-', ' ')} • {jobListing.location_type === 'remote' ? 'Remote' : jobListing.location || 'Location TBD'}
                </p>
              </div>
            )}
            {loadingJob && (
              <p className="text-sm text-muted-foreground mt-2">Loading job details...</p>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Step {step} of 8</span>
              <div className="flex items-center gap-2">
                {autoSaveStatus === 'saving' && (
                  <span className="text-xs text-muted-foreground">Saving...</span>
                )}
                {autoSaveStatus === 'saved' && (
                  <span className="text-xs text-green-600">Draft saved</span>
                )}
                <span className="text-sm text-muted-foreground">{Math.round(progressValue)}% Complete</span>
              </div>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>

          {/* Step Indicator */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {steps.map((s) => {
              const Icon = s.icon
              return (
                <div
                  key={s.number}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-lg border transition-colors",
                    step === s.number
                      ? 'border-primary bg-primary/5'
                      : step > s.number
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border bg-card'
                  )}
                >
                  <div
                    className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                      step > s.number
                        ? 'bg-primary text-primary-foreground'
                        : step === s.number
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {step > s.number ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={cn("text-sm font-semibold mb-1", step >= s.number ? 'text-foreground' : 'text-muted-foreground')}>
                      {s.title}
                    </h3>
                    <p className="text-xs text-muted-foreground hidden md:block">{s.description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Form Card */}
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>{steps[step - 1].title}</CardTitle>
                <CardDescription>{steps[step - 1].description}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Step content */}
                <ApplicationStepContent step={step} form={form} jobListing={jobListing} availableJobs={availableJobs} loadingJobs={loadingJobs} />

                {error && (
                  <div className="mt-6 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                    {error}
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-6 border-t mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={step === 1 || isSubmitting}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  {step < 8 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={isSubmitting}
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Submit Application
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </form>

          {/* Help Text */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Need help? <Link href="/contact" className="text-primary hover:underline">Contact us</Link></p>
            <p className="mt-2">You can <Link href="/careers/application-tracker" className="text-primary hover:underline">track your application</Link> using your email address</p>
          </div>
        </div>
      </div>
    </FormProvider>
  )
}
