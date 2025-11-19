'use client'

import * as React from 'react'
import { useFormContext, UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Upload, X, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { FormValues } from '@/app/careers/apply/page'

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

interface ApplicationStepContentProps {
  step: Step
  form: UseFormReturn<FormValues>
  jobListing: any
  availableJobs: any[]
  loadingJobs: boolean
}

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
]

const CANADIAN_PROVINCES = [
  { value: 'AB', label: 'Alberta' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'NT', label: 'Northwest Territories' },
  { value: 'NU', label: 'Nunavut' },
  { value: 'ON', label: 'Ontario' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'QC', label: 'Quebec' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'YT', label: 'Yukon' },
]

export function ApplicationStepContent({ step, form, jobListing, availableJobs, loadingJobs }: ApplicationStepContentProps) {
  const { register, watch, setValue, formState: { errors } } = useFormContext<FormValues>()

  switch (step) {
    case 1:
      return <Step1PersonalInfo register={register} watch={watch} setValue={setValue} errors={errors} jobListing={jobListing} availableJobs={availableJobs} loadingJobs={loadingJobs} form={form} />
    case 2:
      return <Step2ContactDetails register={register} watch={watch} setValue={setValue} errors={errors} />
    case 3:
      return <Step3AddressInfo register={register} watch={watch} setValue={setValue} errors={errors} />
    case 4:
      return <Step4AddressProof register={register} watch={watch} setValue={setValue} errors={errors} />
    case 5:
      return <Step5WorkEligibility register={register} watch={watch} setValue={setValue} errors={errors} />
    case 6:
      return <Step6PhotoAndID register={register} watch={watch} setValue={setValue} errors={errors} />
    case 7:
      return <Step7Availability register={register} watch={watch} setValue={setValue} errors={errors} />
    case 8:
      return <Step8ExperienceAndReferences register={register} watch={watch} setValue={setValue} errors={errors} />
    default:
      return null
  }
}

// Step 1: Personal Information
function Step1PersonalInfo({ register, watch, setValue, errors, jobListing, availableJobs, loadingJobs, form }: any) {
  const dateOfBirth = watch('step1.dateOfBirth')
  const preferredLanguage = watch('step1.preferredLanguage')
  const jobListingId = watch('jobListingId')

  const calculateAge = (dob: Date | undefined) => {
    if (!dob) return null
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const monthDiff = today.getMonth() - dob.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--
    }
    return age
  }

  const maxDate = new Date()
  maxDate.setFullYear(maxDate.getFullYear() - 18)

  return (
    <div className="space-y-6">
      {!jobListing && (
        <div className="space-y-2">
          <Label htmlFor="jobListingId">
            Select Position <span className="text-destructive">*</span>
          </Label>
          {loadingJobs ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading positions...</div>
          ) : availableJobs.length > 0 ? (
            <Select value={jobListingId || ''} onValueChange={(value) => setValue('jobListingId', value)}>
              <SelectTrigger id="jobListingId">
                <SelectValue placeholder="Select a position to apply for" />
              </SelectTrigger>
              <SelectContent>
                {availableJobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{job.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {job.department} • {job.employment_type.replace('-', ' ')}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">No open positions available at the moment.</p>
            </div>
          )}
          {errors.jobListingId && <p className="text-sm text-destructive">{errors.jobListingId.message as string}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="step1.firstName">
            First Name <span className="text-destructive">*</span>
          </Label>
          <Input id="step1.firstName" {...register('step1.firstName')} placeholder="John" />
          {errors.step1?.firstName && <p className="text-sm text-destructive">{errors.step1.firstName.message as string}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="step1.middleName">Middle Name</Label>
          <Input id="step1.middleName" {...register('step1.middleName')} placeholder="Michael" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="step1.lastName">
            Last Name <span className="text-destructive">*</span>
          </Label>
          <Input id="step1.lastName" {...register('step1.lastName')} placeholder="Doe" />
          {errors.step1?.lastName && <p className="text-sm text-destructive">{errors.step1.lastName.message as string}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="step1.dateOfBirth">
          Date of Birth <span className="text-destructive">*</span>
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dateOfBirth && "text-muted-foreground"
              )}
            >
              {dateOfBirth ? format(dateOfBirth, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={dateOfBirth}
              onSelect={(date) => setValue('step1.dateOfBirth', date, { shouldValidate: true })}
              disabled={(date) => date > maxDate || date < new Date(1900, 0, 1)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {dateOfBirth && (
          <p className="text-sm text-muted-foreground">Age: {calculateAge(dateOfBirth)} years old</p>
        )}
        {errors.step1?.dateOfBirth && <p className="text-sm text-destructive">{errors.step1.dateOfBirth.message as string}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="step1.gender">Gender</Label>
        <Select value={watch('step1.gender') || ''} onValueChange={(value) => setValue('step1.gender', value)}>
          <SelectTrigger id="step1.gender">
            <SelectValue placeholder="Select gender (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="non-binary">Non-binary</SelectItem>
            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="step1.preferredLanguage">
          Preferred Language <span className="text-destructive">*</span>
        </Label>
        <Select value={preferredLanguage || ''} onValueChange={(value) => setValue('step1.preferredLanguage', value)}>
          <SelectTrigger id="step1.preferredLanguage">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="english">English</SelectItem>
            <SelectItem value="spanish">Spanish</SelectItem>
            <SelectItem value="french">French</SelectItem>
            <SelectItem value="turkish">Turkish</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {preferredLanguage === 'other' && (
          <Input
            {...register('step1.otherLanguage')}
            placeholder="Please specify"
            className="mt-2"
          />
        )}
        {errors.step1?.preferredLanguage && <p className="text-sm text-destructive">{errors.step1.preferredLanguage.message as string}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="step1.ssnSin">Social Security Number / Social Insurance Number</Label>
        <Input
          id="step1.ssnSin"
          {...register('step1.ssnSin')}
          placeholder="XXX-XX-XXXX (optional, can provide later)"
          type="password"
        />
        <p className="text-xs text-muted-foreground">Required for tax purposes. Will be kept confidential. You can provide this later.</p>
      </div>
    </div>
  )
}

// Step 2: Contact Details
function Step2ContactDetails({ register, watch, setValue, errors }: any) {
  const preferredContactMethod = watch('step2.preferredContactMethod') || []
  const bestTimeToReach = watch('step2.bestTimeToReach') || []

  const toggleArrayValue = (field: string, value: string) => {
    const current = watch(field) || []
    if (current.includes(value)) {
      setValue(field, current.filter((v: string) => v !== value), { shouldValidate: true })
    } else {
      setValue(field, [...current, value], { shouldValidate: true })
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="step2.email">
          Email Address <span className="text-destructive">*</span>
        </Label>
        <Input id="step2.email" type="email" {...register('step2.email')} placeholder="your.email@example.com" />
        {errors.step2?.email && <p className="text-sm text-destructive">{errors.step2.email.message as string}</p>}
        <p className="text-xs text-muted-foreground">We'll send your application confirmation here</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="step2.phone">
            Primary Phone Number <span className="text-destructive">*</span>
          </Label>
          <Input id="step2.phone" type="tel" {...register('step2.phone')} placeholder="+1 (555) 123-4567" />
          {errors.step2?.phone && <p className="text-sm text-destructive">{errors.step2.phone.message as string}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="step2.alternativePhone">Alternative Phone Number</Label>
          <Input id="step2.alternativePhone" type="tel" {...register('step2.alternativePhone')} placeholder="+1 (555) 123-4567" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>
          Preferred Contact Method <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {['email', 'phone', 'sms', 'whatsapp'].map((method) => (
            <label key={method} className="flex items-center gap-2 rounded-md border p-2 cursor-pointer">
              <input
                type="checkbox"
                checked={preferredContactMethod.includes(method)}
                onChange={() => toggleArrayValue('step2.preferredContactMethod', method)}
                className="h-4 w-4"
              />
              <span className="text-sm capitalize">{method === 'sms' ? 'SMS/Text' : method}</span>
            </label>
          ))}
        </div>
        {errors.step2?.preferredContactMethod && <p className="text-sm text-destructive">{errors.step2.preferredContactMethod.message as string}</p>}
      </div>

      <div className="space-y-2">
        <Label>Best Time to Reach You</Label>
        <div className="space-y-2">
          {[
            { value: 'morning', label: 'Morning (8AM - 12PM)' },
            { value: 'afternoon', label: 'Afternoon (12PM - 5PM)' },
            { value: 'evening', label: 'Evening (5PM - 8PM)' },
          ].map((time) => (
            <label key={time.value} className="flex items-center gap-2 rounded-md border p-2 cursor-pointer">
              <input
                type="checkbox"
                checked={bestTimeToReach.includes(time.value)}
                onChange={() => toggleArrayValue('step2.bestTimeToReach', time.value)}
                className="h-4 w-4"
              />
              <span className="text-sm">{time.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

// Step 3: Address Information
function Step3AddressInfo({ register, watch, setValue, errors }: any) {
  const country = watch('step3.country')
  const addressYears = watch('step3.addressYears') || 0
  const addressMonths = watch('step3.addressMonths') || 0
  const showPreviousAddress = addressYears < 2

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="step3.country">
          Country <span className="text-destructive">*</span>
        </Label>
        <Select value={country || ''} onValueChange={(value) => setValue('step3.country', value, { shouldValidate: true })}>
          <SelectTrigger id="step3.country">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USA">United States</SelectItem>
            <SelectItem value="Canada">Canada</SelectItem>
          </SelectContent>
        </Select>
        {errors.step3?.country && <p className="text-sm text-destructive">{errors.step3.country.message as string}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="step3.addressLine1">
          Street Address <span className="text-destructive">*</span>
        </Label>
        <Input id="step3.addressLine1" {...register('step3.addressLine1')} placeholder="123 Main Street" />
        {errors.step3?.addressLine1 && <p className="text-sm text-destructive">{errors.step3.addressLine1.message as string}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="step3.addressLine2">Apartment, Suite, Unit, etc.</Label>
        <Input id="step3.addressLine2" {...register('step3.addressLine2')} placeholder="Apt 4B" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="step3.city">
            City <span className="text-destructive">*</span>
          </Label>
          <Input id="step3.city" {...register('step3.city')} placeholder="New York" />
          {errors.step3?.city && <p className="text-sm text-destructive">{errors.step3.city.message as string}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="step3.state">
            {country === 'USA' ? 'State' : 'Province'} <span className="text-destructive">*</span>
          </Label>
          <Select value={watch('step3.state') || ''} onValueChange={(value) => setValue('step3.state', value, { shouldValidate: true })}>
            <SelectTrigger id="step3.state">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {(country === 'USA' ? US_STATES : CANADIAN_PROVINCES).map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.step3?.state && <p className="text-sm text-destructive">{errors.step3.state.message as string}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="step3.zipCode">
            {country === 'USA' ? 'ZIP Code' : 'Postal Code'} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="step3.zipCode"
            {...register('step3.zipCode')}
            placeholder={country === 'USA' ? '12345' : 'A1A 1A1'}
          />
          {errors.step3?.zipCode && <p className="text-sm text-destructive">{errors.step3.zipCode.message as string}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>How long have you lived at this address? <span className="text-destructive">*</span></Label>
        <div className="grid grid-cols-2 gap-4">
          <Select
            value={addressYears.toString()}
            onValueChange={(value) => setValue('step3.addressYears', parseInt(value), { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Years..." />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year} {year === 1 ? 'year' : 'years'}
                </SelectItem>
              ))}
              <SelectItem value="10">10+ years</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={addressMonths.toString()}
            onValueChange={(value) => setValue('step3.addressMonths', parseInt(value), { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Months..." />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((month) => (
                <SelectItem key={month} value={month.toString()}>
                  {month} {month === 1 ? 'month' : 'months'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {showPreviousAddress && (
        <div className="pt-6 border-t space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Previous Address</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Since you've lived at your current address for less than 2 years, please provide your previous address.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="step3.previousAddress.addressLine1">Street Address</Label>
            <Input {...register('step3.previousAddress.addressLine1')} placeholder="123 Main Street" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="step3.previousAddress.addressLine2">Apartment, Suite, Unit, etc.</Label>
            <Input {...register('step3.previousAddress.addressLine2')} placeholder="Apt 4B" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="step3.previousAddress.city">City</Label>
              <Input {...register('step3.previousAddress.city')} placeholder="New York" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="step3.previousAddress.state">{country === 'USA' ? 'State' : 'Province'}</Label>
              <Input {...register('step3.previousAddress.state')} placeholder="NY" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="step3.previousAddress.zipCode">{country === 'USA' ? 'ZIP Code' : 'Postal Code'}</Label>
              <Input {...register('step3.previousAddress.zipCode')} placeholder={country === 'USA' ? '12345' : 'A1A 1A1'} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Step 4: Address Proof Upload
function Step4AddressProof({ register, watch, setValue, errors }: any) {
  const files = watch('step4.addressProofFiles') || []
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || [])
    const validFiles = newFiles.filter((file) => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
      const validSize = file.size <= 5 * 1024 * 1024 // 5MB
      return validTypes.includes(file.type) && validSize
    })
    setValue('step4.addressProofFiles', [...files, ...validFiles], { shouldValidate: true })
  }

  const removeFile = (index: number) => {
    const newFiles = files.filter((_: any, i: number) => i !== index)
    setValue('step4.addressProofFiles', newFiles, { shouldValidate: true })
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Accepted Documents:</h3>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li>Utility bill (electricity, water, gas) - dated within last 3 months</li>
          <li>Bank statement - dated within last 3 months</li>
          <li>Lease agreement or mortgage statement</li>
          <li>Government-issued document showing your current address</li>
        </ul>
        <p className="text-sm text-blue-800 mt-2">File types: PDF, JPG, PNG | Max size: 5MB per file</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="addressProof">
          Proof of Address Documents <span className="text-destructive">*</span>
        </Label>
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
          <p className="text-xs text-muted-foreground">PDF, JPG, PNG (max 5MB each)</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          id="addressProof"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          className="hidden"
        />
        {errors.step4?.addressProofFiles && (
          <p className="text-sm text-destructive">{errors.step4.addressProofFiles.message as string}</p>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <Label>Uploaded Files ({files.length})</Label>
          <div className="space-y-2">
            {files.map((file: File, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Step 5: Work Eligibility
function Step5WorkEligibility({ register, watch, setValue, errors }: any) {
  const workEligibilityCountry = watch('step5.workEligibilityCountry')
  const workPermitExpiry = watch('step5.workPermitExpiry')
  const workPermitDocument = watch('step5.workPermitDocument')
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setValue('step5.workPermitDocument', file, { shouldValidate: true })
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="step5.workEligibilityCountry">
          Country <span className="text-destructive">*</span>
        </Label>
        <Select
          value={workEligibilityCountry || ''}
          onValueChange={(value) => setValue('step5.workEligibilityCountry', value, { shouldValidate: true })}
        >
          <SelectTrigger id="step5.workEligibilityCountry">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USA">United States</SelectItem>
            <SelectItem value="Canada">Canada</SelectItem>
          </SelectContent>
        </Select>
        {errors.step5?.workEligibilityCountry && (
          <p className="text-sm text-destructive">{errors.step5.workEligibilityCountry.message as string}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="step5.workAuthorizationType">
          Work Authorization Type <span className="text-destructive">*</span>
        </Label>
        <Select
          value={watch('step5.workAuthorizationType') || ''}
          onValueChange={(value) => setValue('step5.workAuthorizationType', value, { shouldValidate: true })}
        >
          <SelectTrigger id="step5.workAuthorizationType">
            <SelectValue placeholder="Select authorization type" />
          </SelectTrigger>
          <SelectContent>
            {workEligibilityCountry === 'USA' ? (
              <>
                <SelectItem value="us-citizen">US Citizen</SelectItem>
                <SelectItem value="permanent-resident">Permanent Resident (Green Card)</SelectItem>
                <SelectItem value="work-visa">Work Visa (H1B, L1, etc.)</SelectItem>
                <SelectItem value="work-permit">Work Permit (EAD)</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="canadian-citizen">Canadian Citizen</SelectItem>
                <SelectItem value="permanent-resident">Permanent Resident</SelectItem>
                <SelectItem value="work-permit">Work Permit</SelectItem>
                <SelectItem value="study-permit">Study Permit (with work authorization)</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
        {errors.step5?.workAuthorizationType && (
          <p className="text-sm text-destructive">{errors.step5.workAuthorizationType.message as string}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="step5.workPermitNumber">Work Permit/Authorization Number</Label>
        <Input
          id="step5.workPermitNumber"
          {...register('step5.workPermitNumber')}
          placeholder="Enter permit number if applicable"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="step5.workPermitExpiry">Work Permit Expiry Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !workPermitExpiry && "text-muted-foreground"
              )}
            >
              {workPermitExpiry ? format(workPermitExpiry, "PPP") : "Pick a date (optional)"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={workPermitExpiry}
              onSelect={(date) => setValue('step5.workPermitExpiry', date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="workPermitDocument">Work Permit Document (Optional)</Label>
        <div
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">
            {workPermitDocument ? workPermitDocument.name : 'Click to upload work permit document'}
          </p>
          <p className="text-xs text-muted-foreground">PDF, JPG, PNG (max 5MB)</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          id="workPermitDocument"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  )
}

// Step 6: Photo & ID
function Step6PhotoAndID({ register, watch, setValue, errors }: any) {
  const photo = watch('step6.photo')
  const idDocument = watch('step6.idDocument')
  const idExpiry = watch('step6.idExpiry')
  const photoInputRef = React.useRef<HTMLInputElement>(null)
  const idInputRef = React.useRef<HTMLInputElement>(null)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setValue('step6.photo', file)
    }
  }

  const handleIdDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setValue('step6.idDocument', file, { shouldValidate: true })
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="photo">Profile Photo (Optional)</Label>
        <div
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => photoInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">
            {photo ? photo.name : 'Click to upload profile photo'}
          </p>
          <p className="text-xs text-muted-foreground">JPG, PNG (max 5MB)</p>
        </div>
        <input
          ref={photoInputRef}
          type="file"
          id="photo"
          accept=".jpg,.jpeg,.png"
          onChange={handlePhotoChange}
          className="hidden"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="step6.idType">
          ID Type <span className="text-destructive">*</span>
        </Label>
        <Select
          value={watch('step6.idType') || ''}
          onValueChange={(value) => setValue('step6.idType', value, { shouldValidate: true })}
        >
          <SelectTrigger id="step6.idType">
            <SelectValue placeholder="Select ID type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="drivers-license">Driver's License</SelectItem>
            <SelectItem value="passport">Passport</SelectItem>
            <SelectItem value="state-id">State ID</SelectItem>
            <SelectItem value="other">Other Government ID</SelectItem>
          </SelectContent>
        </Select>
        {errors.step6?.idType && <p className="text-sm text-destructive">{errors.step6.idType.message as string}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="step6.idNumber">
          ID Number <span className="text-destructive">*</span>
        </Label>
        <Input
          id="step6.idNumber"
          {...register('step6.idNumber')}
          placeholder="Enter ID number"
        />
        {errors.step6?.idNumber && <p className="text-sm text-destructive">{errors.step6.idNumber.message as string}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="step6.idExpiry">ID Expiry Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !idExpiry && "text-muted-foreground"
              )}
            >
              {idExpiry ? format(idExpiry, "PPP") : "Pick a date (optional)"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={idExpiry}
              onSelect={(date) => setValue('step6.idExpiry', date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="idDocument">ID Document (Optional)</Label>
        <div
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => idInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">
            {idDocument ? idDocument.name : 'Click to upload ID document'}
          </p>
          <p className="text-xs text-muted-foreground">PDF, JPG, PNG (max 5MB)</p>
        </div>
        <input
          ref={idInputRef}
          type="file"
          id="idDocument"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleIdDocumentChange}
          className="hidden"
        />
      </div>
    </div>
  )
}

// Step 7: Availability & Preferences
function Step7Availability({ register, watch, setValue, errors }: any) {
  const availabilityDays = watch('step7.availabilityDays') || []
  const hasVehicle = watch('step7.hasVehicle')

  const toggleArrayValue = (field: string, value: string) => {
    const current = watch(field) || []
    if (current.includes(value)) {
      setValue(field, current.filter((v: string) => v !== value), { shouldValidate: true })
    } else {
      setValue(field, [...current, value], { shouldValidate: true })
    }
  }

  const daysOfWeek = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>
          Available Days <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {daysOfWeek.map((day) => (
            <label key={day.value} className="flex items-center gap-2 rounded-md border p-2 cursor-pointer">
              <input
                type="checkbox"
                checked={availabilityDays.includes(day.value)}
                onChange={() => toggleArrayValue('step7.availabilityDays', day.value)}
                className="h-4 w-4"
              />
              <span className="text-sm">{day.label}</span>
            </label>
          ))}
        </div>
        {errors.step7?.availabilityDays && (
          <p className="text-sm text-destructive">{errors.step7.availabilityDays.message as string}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="step7.availabilityHours">
          Preferred Hours <span className="text-destructive">*</span>
        </Label>
        <Select
          value={watch('step7.availabilityHours') || ''}
          onValueChange={(value) => setValue('step7.availabilityHours', value, { shouldValidate: true })}
        >
          <SelectTrigger id="step7.availabilityHours">
            <SelectValue placeholder="Select preferred hours" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="morning">Morning (8AM - 12PM)</SelectItem>
            <SelectItem value="afternoon">Afternoon (12PM - 5PM)</SelectItem>
            <SelectItem value="evening">Evening (5PM - 8PM)</SelectItem>
            <SelectItem value="flexible">Flexible / Any Time</SelectItem>
          </SelectContent>
        </Select>
        {errors.step7?.availabilityHours && (
          <p className="text-sm text-destructive">{errors.step7.availabilityHours.message as string}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="step7.transportation">
          Transportation Method <span className="text-destructive">*</span>
        </Label>
        <Select
          value={watch('step7.transportation') || ''}
          onValueChange={(value) => setValue('step7.transportation', value, { shouldValidate: true })}
        >
          <SelectTrigger id="step7.transportation">
            <SelectValue placeholder="Select transportation method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="own-vehicle">Own Vehicle</SelectItem>
            <SelectItem value="public-transport">Public Transportation</SelectItem>
            <SelectItem value="bicycle">Bicycle</SelectItem>
            <SelectItem value="walking">Walking</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {errors.step7?.transportation && (
          <p className="text-sm text-destructive">{errors.step7.transportation.message as string}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hasVehicle}
            onChange={(e) => setValue('step7.hasVehicle', e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm">I have access to a vehicle</span>
        </label>
      </div>

      {hasVehicle && (
        <div className="space-y-2">
          <Label htmlFor="step7.vehicleDetails">Vehicle Details</Label>
          <Textarea
            id="step7.vehicleDetails"
            {...register('step7.vehicleDetails')}
            placeholder="Make, model, year, and any relevant details"
            rows={3}
          />
        </div>
      )}
    </div>
  )
}

// Step 8: Experience & References
function Step8ExperienceAndReferences({ register, watch, setValue, errors }: any) {
  const references = watch('step8.references') || [
    { name: '', relationship: '', phone: '', email: '' },
    { name: '', relationship: '', phone: '', email: '' },
  ]

  const addReference = () => {
    setValue('step8.references', [...references, { name: '', relationship: '', phone: '', email: '' }])
  }

  const removeReference = (index: number) => {
    if (references.length > 2) {
      setValue('step8.references', references.filter((_: any, i: number) => i !== index))
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="step8.yearsExperience">Years of Cleaning Experience</Label>
        <Select
          value={watch('step8.yearsExperience')?.toString() || '0'}
          onValueChange={(value) => setValue('step8.yearsExperience', parseInt(value), { shouldValidate: true })}
        >
          <SelectTrigger id="step8.yearsExperience">
            <SelectValue placeholder="Select years of experience" />
          </SelectTrigger>
          <SelectContent>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year} {year === 1 ? 'year' : 'years'}
              </SelectItem>
            ))}
            <SelectItem value="20">20+ years</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>
            References <span className="text-destructive">*</span> (Minimum 2 required)
          </Label>
          <Button type="button" variant="outline" size="sm" onClick={addReference}>
            Add Reference
          </Button>
        </div>
        {references.map((ref: any, index: number) => (
          <div key={index} className="p-4 border rounded-lg space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Reference {index + 1}</h4>
              {references.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeReference(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`step8.references.${index}.name`}>
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  {...register(`step8.references.${index}.name`)}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`step8.references.${index}.relationship`}>
                  Relationship <span className="text-destructive">*</span>
                </Label>
                <Input
                  {...register(`step8.references.${index}.relationship`)}
                  placeholder="e.g., Former Employer, Colleague"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`step8.references.${index}.phone`}>
                  Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  {...register(`step8.references.${index}.phone`)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`step8.references.${index}.email`}>Email</Label>
                <Input
                  type="email"
                  {...register(`step8.references.${index}.email`)}
                  placeholder="email@example.com"
                />
              </div>
            </div>
          </div>
        ))}
        {errors.step8?.references && (
          <p className="text-sm text-destructive">{errors.step8.references.message as string}</p>
        )}
      </div>

      <div className="pt-4 border-t space-y-4">
        <h3 className="font-semibold">Emergency Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="step8.emergencyContact.name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register('step8.emergencyContact.name')}
              placeholder="Full name"
            />
            {errors.step8?.emergencyContact?.name && (
              <p className="text-sm text-destructive">{errors.step8.emergencyContact.name.message as string}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="step8.emergencyContact.relationship">
              Relationship <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register('step8.emergencyContact.relationship')}
              placeholder="e.g., Spouse, Parent, Sibling"
            />
            {errors.step8?.emergencyContact?.relationship && (
              <p className="text-sm text-destructive">{errors.step8.emergencyContact.relationship.message as string}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="step8.emergencyContact.phone">
              Phone <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register('step8.emergencyContact.phone')}
              placeholder="+1 (555) 123-4567"
            />
            {errors.step8?.emergencyContact?.phone && (
              <p className="text-sm text-destructive">{errors.step8.emergencyContact.phone.message as string}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="step8.emergencyContact.email">Email</Label>
            <Input
              type="email"
              {...register('step8.emergencyContact.email')}
              placeholder="email@example.com"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

