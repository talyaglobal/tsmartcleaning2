'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { Loader2, Check, ChevronRight, ChevronLeft, Upload, X, FileText, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Step = 1 | 2 | 3 | 4 | 5

interface FormData {
  // Step 1: Personal Information
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  
  // Step 2: Business Information
  businessName: string
  businessDescription: string
  yearsExperience: string
  serviceRadius: string
  hourlyRate: string
  
  // Step 3: Documents
  businessLicense: File | null
  insuranceDocument: File | null
  idDocument: File | null
  
  // Step 4: Verification
  agreeToTerms: boolean
  agreeToBackgroundCheck: boolean
}

interface FilePreview {
  file: File
  preview: string
  type: 'businessLicense' | 'insuranceDocument' | 'idDocument'
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']

export function ProviderSignupForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([])
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessDescription: '',
    yearsExperience: '',
    serviceRadius: '25',
    hourlyRate: '',
    businessLicense: null,
    insuranceDocument: null,
    idDocument: null,
    agreeToTerms: false,
    agreeToBackgroundCheck: false,
  })

  const steps = [
    { number: 1, title: 'Personal Info', description: 'Your basic information' },
    { number: 2, title: 'Business Info', description: 'About your business' },
    { number: 3, title: 'Documents', description: 'Upload required documents' },
    { number: 4, title: 'Verification', description: 'Review and confirm' },
    { number: 5, title: 'Email Confirmation', description: 'Verify your email' },
  ]

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100

  // Validate file
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'File type not supported. Accepted: PDF, JPG, PNG'
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`
    }
    return null
  }

  // Generate preview for image files
  const generatePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = () => resolve('')
        reader.readAsDataURL(file)
      } else {
        resolve('')
      }
    })
  }

  // Handle file selection
  const handleFileSelect = useCallback(async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'businessLicense' | 'insuranceDocument' | 'idDocument'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    const preview = await generatePreview(file)
    
    setFilePreviews(prev => {
      const filtered = prev.filter(p => p.type !== type)
      return [...filtered, { file, preview, type }]
    })

    setFormData(prev => ({
      ...prev,
      [type]: file,
    }))
  }, [])

  // Remove file
  const removeFile = (type: 'businessLicense' | 'insuranceDocument' | 'idDocument') => {
    setFilePreviews(prev => prev.filter(p => p.type !== type))
    setFormData(prev => ({
      ...prev,
      [type]: null,
    }))
  }

  // Validate current step
  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 1:
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
          setError('Please fill in all required fields')
          return false
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          setError('Please enter a valid email address')
          return false
        }
        if (!formData.password || formData.password.length < 8) {
          setError('Password must be at least 8 characters')
          return false
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match')
          return false
        }
        return true
      
      case 2:
        if (!formData.businessName || !formData.businessDescription || !formData.yearsExperience) {
          setError('Please fill in all required fields')
          return false
        }
        return true
      
      case 3:
        if (!formData.businessLicense || !formData.insuranceDocument || !formData.idDocument) {
          setError('Please upload all required documents')
          return false
        }
        return true
      
      case 4:
        if (!formData.agreeToTerms || !formData.agreeToBackgroundCheck) {
          setError('Please agree to all terms and conditions')
          return false
        }
        return true
      
      default:
        return true
    }
  }

  // Handle next step
  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return
    }
    setError(null)
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as Step)
    }
  }

  // Handle previous step
  const handlePrevious = () => {
    setError(null)
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step)
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep(4)) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create FormData for file uploads
      const submitData = new FormData()
      
      // Append form fields
      submitData.append('firstName', formData.firstName)
      submitData.append('lastName', formData.lastName)
      submitData.append('email', formData.email)
      submitData.append('phone', formData.phone)
      submitData.append('password', formData.password)
      submitData.append('businessName', formData.businessName)
      submitData.append('businessDescription', formData.businessDescription)
      submitData.append('yearsExperience', formData.yearsExperience)
      submitData.append('serviceRadius', formData.serviceRadius)
      submitData.append('hourlyRate', formData.hourlyRate || '0')
      submitData.append('role', 'provider')

      // Append files
      if (formData.businessLicense) {
        submitData.append('businessLicense', formData.businessLicense)
      }
      if (formData.insuranceDocument) {
        submitData.append('insuranceDocument', formData.insuranceDocument)
      }
      if (formData.idDocument) {
        submitData.append('idDocument', formData.idDocument)
      }

      const response = await fetch('/api/auth/provider-signup', {
        method: 'POST',
        body: submitData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Signup failed')
      }

      // Move to email confirmation step
      setCurrentStep(5)
      setEmailSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during signup')
    } finally {
      setIsLoading(false)
    }
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password (min 8 characters)"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                placeholder="Your Cleaning Company"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessDescription">Business Description *</Label>
              <Textarea
                id="businessDescription"
                placeholder="Tell us about your cleaning services, specialties, and what makes your business unique..."
                value={formData.businessDescription}
                onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                rows={4}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="yearsExperience">Years of Experience *</Label>
                <Input
                  id="yearsExperience"
                  type="number"
                  placeholder="5"
                  min="0"
                  value={formData.yearsExperience}
                  onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceRadius">Service Radius (miles)</Label>
                <Input
                  id="serviceRadius"
                  type="number"
                  placeholder="25"
                  min="1"
                  value={formData.serviceRadius}
                  onChange={(e) => setFormData({ ...formData, serviceRadius: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate (optional)</Label>
              <Input
                id="hourlyRate"
                type="number"
                placeholder="25.00"
                min="0"
                step="0.01"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Please upload the following documents. Accepted formats: PDF, JPG, PNG (max 10MB each)
            </p>
            
            {/* Business License */}
            <div className="space-y-2">
              <Label htmlFor="businessLicense">Business License *</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="businessLicense"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileSelect(e, 'businessLicense')}
                  className="flex-1"
                />
                {formData.businessLicense && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeFile('businessLicense')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {filePreviews.find(p => p.type === 'businessLicense') && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{formData.businessLicense?.name}</span>
                </div>
              )}
            </div>

            {/* Insurance Document */}
            <div className="space-y-2">
              <Label htmlFor="insuranceDocument">Insurance Document *</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="insuranceDocument"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileSelect(e, 'insuranceDocument')}
                  className="flex-1"
                />
                {formData.insuranceDocument && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeFile('insuranceDocument')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {filePreviews.find(p => p.type === 'insuranceDocument') && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{formData.insuranceDocument?.name}</span>
                </div>
              )}
            </div>

            {/* ID Document */}
            <div className="space-y-2">
              <Label htmlFor="idDocument">Government ID (Driver's License or Passport) *</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="idDocument"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileSelect(e, 'idDocument')}
                  className="flex-1"
                />
                {formData.idDocument && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeFile('idDocument')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {filePreviews.find(p => p.type === 'idDocument') && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{formData.idDocument?.name}</span>
                </div>
              )}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Review Your Information</h3>
              
              <Card className="p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-base">{formData.firstName} {formData.lastName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-base">{formData.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-base">{formData.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Business Name</p>
                  <p className="text-base">{formData.businessName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Years of Experience</p>
                  <p className="text-base">{formData.yearsExperience} years</p>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                  className="mt-1"
                />
                <Label htmlFor="agreeToTerms" className="text-sm cursor-pointer">
                  I agree to the{' '}
                  <a href="/terms" target="_blank" className="text-primary hover:underline">
                    Provider Terms and Conditions
                  </a>
                  {' '}and{' '}
                  <a href="/privacy" target="_blank" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="agreeToBackgroundCheck"
                  checked={formData.agreeToBackgroundCheck}
                  onChange={(e) => setFormData({ ...formData, agreeToBackgroundCheck: e.target.checked })}
                  className="mt-1"
                />
                <Label htmlFor="agreeToBackgroundCheck" className="text-sm cursor-pointer">
                  I consent to a background check and verification of my documents
                </Label>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Check Your Email</h3>
              <p className="text-muted-foreground">
                We've sent a confirmation email to <strong>{formData.email}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Please click the link in the email to verify your account and complete your registration.
              </p>
            </div>
            <div className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/login')}
              >
                Go to Login
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Cleanup file previews on unmount
  useEffect(() => {
    return () => {
      filePreviews.forEach(({ preview }) => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview)
        }
      })
    }
  }, [filePreviews])

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicator */}
      <div className="hidden md:flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const stepNumber = step.number
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          
          return (
            <div key={stepNumber} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                    !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium text-center max-w-[80px]',
                    isCurrent ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </span>
              </div>
              {stepNumber < steps.length && (
                <div className="flex-1 mx-2">
                  <div
                    className={cn(
                      'h-1 transition-all duration-300',
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Content */}
      <Card className="p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">{steps[currentStep - 1].title}</h2>
          <p className="text-sm text-muted-foreground">{steps[currentStep - 1].description}</p>
        </div>
        {renderStepContent()}
      </Card>

      {/* Navigation Buttons */}
      {currentStep < 5 && (
        <div className="flex justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          {currentStep === 4 ? (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="ml-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isLoading}
              className="ml-auto"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      )}

      {currentStep === 1 && (
        <p className="mt-6 text-xs text-muted-foreground text-center">
          By signing up, you agree to our{' '}
          <a href="/terms" target="_blank" className="underline hover:text-foreground">
            Terms of Service
          </a>
          {' '}and{' '}
          <a href="/privacy" target="_blank" className="underline hover:text-foreground">
            Privacy Policy
          </a>
        </p>
      )}
    </div>
  )
}
