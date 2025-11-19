/* eslint-disable @next/next/no-img-element */
'use client'

import React from 'react'
import { useForm, FormProvider, useFormContext } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

// Shared section title used by step sections below
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
	<div className="mb-4">
		<h2 className="text-xl font-semibold">{children}</h2>
	</div>
)

const organizationTypes = [
	'Non-profit organization (501c3)',
	'Community-based organization',
	'Refugee resettlement agency',
	"Women's support center",
	'Faith-based organization',
	'Government employment agency',
	'Immigrant services organization',
	'Training/education institution',
	'Other',
] as const

const countries = ['United States', 'Canada', 'Both'] as const

const usStates = [
	'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida',
	'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
	'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska',
	'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
	'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas',
	'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
] as const

const caProvinces = [
	'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Nova Scotia',
	'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan',
] as const

const phoneRegex = /^\+?[0-9\s().-]{7,}$/
const urlRegex = /^https?:\/\/[^\s$.?#].[^\s]*$/i
const einOrBnRegex = /^[0-9A-Za-z\-]{5,20}$/
const postalRegex = /^[A-Za-z0-9\s\-]{3,12}$/

const Section1Schema = z.object({
	organizationLegalName: z.string().min(2, 'Required'),
	operatingName: z.string().optional().nullable(),
	organizationType: z.enum(organizationTypes),
	taxId: z.string().regex(einOrBnRegex, 'Invalid format'),
	yearEstablished: z.number().int().min(1950).max(new Date().getFullYear()),
	registrationNumber: z.string().min(2, 'Required'),
	primaryCountry: z.enum(countries),
	operationRegions: z.array(z.string()).min(1, 'Select at least one region'),
	website: z.string().regex(urlRegex, 'Invalid URL'),
	missionStatement: z.string().min(10).max(500),
})

const Section2Schema = z.object({
	hqStreet: z.string().min(2),
	hqStreet2: z.string().optional().nullable(),
	hqCity: z.string().min(2),
	hqState: z.string().min(2),
	hqPostal: z.string().regex(postalRegex, 'Invalid postal/ZIP'),
	hqCountry: z.string().min(2),
	mailingSameAsHq: z.boolean().default(true),
	mailStreet: z.string().optional().nullable(),
	mailStreet2: z.string().optional().nullable(),
	mailCity: z.string().optional().nullable(),
	mailState: z.string().optional().nullable(),
	mailPostal: z.string().optional().nullable(),
	mailCountry: z.string().optional().nullable(),
	primaryContactName: z.string().min(2),
	primaryContactTitle: z.string().min(2),
	primaryContactRole: z.string().min(2),
	primaryEmail: z.string().email(),
	primaryPhone: z.string().regex(phoneRegex, 'Invalid phone'),
	altPhone: z.string().optional().nullable(),
	secondaryContactName: z.string().optional().nullable(),
	secondaryContactTitle: z.string().optional().nullable(),
	secondaryContactEmail: z.string().email().optional().nullable(),
	secondaryContactPhone: z.string().optional().nullable(),
	officeDays: z.array(z.string()).min(1, 'Select at least one day'),
	officeHours: z.string().min(2),
	timezone: z.string().min(2),
})

// File validation helper
const validateFile = (file: File | undefined, maxSizeMB: number, allowedTypes: string[]) => {
	if (!file) return true
	if (file.size > maxSizeMB * 1024 * 1024) {
		return `File size must be less than ${maxSizeMB}MB`
	}
	const fileType = file.type || file.name.split('.').pop()?.toLowerCase() || ''
	const isValidType = allowedTypes.some(type => 
		fileType.includes(type) || file.name.toLowerCase().endsWith(`.${type}`)
	)
	if (!isValidType) {
		return `File type must be one of: ${allowedTypes.join(', ')}`
	}
	return true
}

const Section3Schema = z.object({
	nonProfitDoc: z
		.instanceof(File)
		.optional()
		.refine((file) => !file || validateFile(file, 5, ['pdf']) === true, {
			message: (file) => typeof validateFile(file, 5, ['pdf']) === 'string' 
				? validateFile(file, 5, ['pdf']) as string 
				: 'Invalid file',
		}),
	businessLicense: z
		.instanceof(File)
		.optional()
		.refine((file) => !file || validateFile(file, 5, ['pdf']) === true, {
			message: (file) => typeof validateFile(file, 5, ['pdf']) === 'string' 
				? validateFile(file, 5, ['pdf']) as string 
				: 'Invalid file',
		}),
	insuranceProof: z
		.instanceof(File)
		.optional()
		.refine((file) => !file || validateFile(file, 5, ['pdf']) === true, {
			message: (file) => typeof validateFile(file, 5, ['pdf']) === 'string' 
				? validateFile(file, 5, ['pdf']) as string 
				: 'Invalid file',
		}),
	insuranceExpiry: z.string().min(1, 'Required'),
	boardList: z
		.instanceof(File)
		.optional()
		.refine((file) => !file || validateFile(file, 2, ['pdf', 'doc', 'docx']) === true, {
			message: (file) => typeof validateFile(file, 2, ['pdf', 'doc', 'docx']) === 'string' 
				? validateFile(file, 2, ['pdf', 'doc', 'docx']) as string 
				: 'Invalid file',
		}),
	annualReport: z
		.instanceof(File)
		.optional()
		.nullable()
		.refine((file) => !file || validateFile(file, 10, ['pdf']) === true, {
			message: (file) => typeof validateFile(file, 10, ['pdf']) === 'string' 
				? validateFile(file, 10, ['pdf']) as string 
				: 'Invalid file',
		}),
	references: z.array(
		z.object({
			name: z.string().min(2),
			organization: z.string().min(2),
			title: z.string().min(2),
			email: z.string().email(),
			phone: z.string().regex(phoneRegex, 'Invalid phone'),
			relationship: z.string().min(2),
			yearsKnown: z.string().min(1),
		})
	)
		.min(2)
		.max(3),
	affiliatedPrograms: z.array(z.string()).optional().default([]),
	affiliatedProgramsOther: z.string().optional().nullable(),
})

const Section4Schema = z.object({
	servedAnnually: z.enum(['1-50', '51-100', '101-250', '251-500', '501-1,000', '1,000+']),
	targetPopulations: z.array(z.string()).min(1),
	languages: z.array(z.string()).min(1),
	referralsPerMonth: z.enum(['1-5', '6-10', '11-20', '21-50', '50+']),
	preEmploymentSupport: z.array(z.string()).min(1),
	avgPreparationTimeline: z.enum(['Immediate (0-3 days)', '1 week', '2 weeks', '1 month', 'Varies by individual']),
})

const FormSchema = z.object({
	section1: Section1Schema,
	section2: Section2Schema,
	section3: Section3Schema,
	section4: Section4Schema,
})

type FormValues = z.infer<typeof FormSchema>

function MultiSelect({
	options,
	value,
	onChange,
	name,
}: {
	options: string[]
	value: string[]
	onChange: (v: string[]) => void
	name: string
}) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
			{options.map((opt) => {
				const id = `${name}-${opt}`
				const checked = value.includes(opt)
				return (
					<label key={opt} htmlFor={id} className="flex items-center gap-2 rounded-md border p-2">
						<input
							id={id}
							type="checkbox"
							className="h-4 w-4"
							checked={checked}
							onChange={(e) => {
								if (e.currentTarget.checked) onChange([...value, opt])
								else onChange(value.filter((v) => v !== opt))
							}}
						/>
						<span className="text-sm">{opt}</span>
					</label>
				)
			})}
		</div>
	)
}

export default function NGORegistrationForm() {
	const router = useRouter()
	const [step, setStep] = React.useState(0)
	const [isSubmitting, setIsSubmitting] = React.useState(false)

	const form = useForm<FormValues>({
		resolver: zodResolver(FormSchema),
		mode: 'onChange',
		defaultValues: {
			section1: {
				operatingName: '',
				primaryCountry: 'United States',
				operationRegions: [],
				yearEstablished: 2000,
			} as any,
			section2: {
				mailingSameAsHq: true,
				officeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
				timezone: 'America/New_York',
			} as any,
			section3: {
				references: [
					{ name: '', organization: '', title: '', email: '', phone: '', relationship: '', yearsKnown: '' },
					{ name: '', organization: '', title: '', email: '', phone: '', relationship: '', yearsKnown: '' },
				],
				affiliatedPrograms: [],
			} as any,
			section4: {} as any,
		},
	})

	const onSubmit = async (values: FormValues) => {
		setIsSubmitting(true)
		try {
			const formData = new FormData()
			formData.append('payload', JSON.stringify(values))

			// Attach files if present
			const s3 = values.section3
			if (s3.nonProfitDoc) formData.append('nonProfitDoc', s3.nonProfitDoc)
			if (s3.businessLicense) formData.append('businessLicense', s3.businessLicense)
			if (s3.insuranceProof) formData.append('insuranceProof', s3.insuranceProof)
			if (s3.boardList) formData.append('boardList', s3.boardList)
			if (s3.annualReport as any) {
				const f = s3.annualReport as unknown as File
				if (f) formData.append('annualReport', f)
			}

			const res = await fetch('/api/ngo/register', {
				method: 'POST',
				body: formData,
			})

			if (!res.ok) {
				const err = await res.json().catch(() => ({}))
				throw new Error(err?.message || 'Submission failed')
			}

			const data = await res.json()
			toast.success('Application submitted successfully!')
			router.push(`/ngo/register/success?id=${encodeURIComponent(data.applicationId)}`)
		} catch (e: any) {
			toast.error(e.message || 'Failed to submit application')
		} finally {
			setIsSubmitting(false)
		}
	}

	const nextStep = async () => {
		// Validate current step before moving
		const sectionKey = (`section${step + 1}` as keyof FormValues)
		const isValid = await form.trigger(sectionKey as any)
		if (!isValid) {
			toast.error('Please fix validation errors to continue')
			return
		}
		setStep((s) => Math.min(s + 1, 3))
	}

	const prevStep = () => setStep((s) => Math.max(s - 1, 0))

	return (
		<FormProvider {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>NGO/Agency Registration</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="text-sm font-medium text-muted-foreground">Step {step + 1} of 4</div>
								<div className="text-sm text-muted-foreground">
									{step === 0 && 'Organization Information'}
									{step === 1 && 'Contact Information'}
									{step === 2 && 'Credentials & Verification'}
									{step === 3 && 'Service Capacity'}
								</div>
							</div>
							<div className="relative w-full">
								<div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
									<div 
										className="h-full bg-primary transition-all duration-300 ease-out"
										style={{ width: `${((step + 1) / 4) * 100}%` }}
									/>
								</div>
								<div className="mt-2 flex justify-between text-xs text-muted-foreground">
									<span className={cn(step >= 0 && 'font-medium text-primary')}>1. Organization</span>
									<span className={cn(step >= 1 && 'font-medium text-primary')}>2. Contact</span>
									<span className={cn(step >= 2 && 'font-medium text-primary')}>3. Credentials</span>
									<span className={cn(step >= 3 && 'font-medium text-primary')}>4. Capacity</span>
								</div>
							</div>
						</div>

						{step === 0 && <Section1 />}
						{step === 1 && <Section2 />}
						{step === 2 && <Section3 />}
						{step === 3 && <Section4 />}

						<div className="flex items-center justify-between pt-2">
							<Button type="button" variant="outline" onClick={prevStep} disabled={step === 0 || isSubmitting}>
								Back
							</Button>
							{step < 3 ? (
								<Button type="button" onClick={nextStep} disabled={isSubmitting}>
									Next
								</Button>
							) : (
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting ? (
										<>
											<svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
											</svg>
											Submitting...
										</>
									) : (
										'Submit Partnership Application →'
									)}
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			</form>
		</FormProvider>
	)
}

function FieldError({ name }: { name: string }) {
	const { formState } = useFormContext<FormValues>()
	const error = getNestedError(formState.errors, name)
	if (!error) return null
	return <p className="text-sm text-red-600">{error.message}</p>
}

function getNestedError(errors: any, path: string): any {
	const keys = path.split('.')
	let current = errors
	for (const key of keys) {
		if (current?.[key] == null) return null
		current = current[key]
	}
	return current
}

function RHFInput({
	name,
	label,
	placeholder,
	type = 'text',
}: {
	name: string
	label: string
	placeholder?: string
	type?: React.HTMLInputTypeAttribute
}) {
	const { register } = useFormContext<FormValues>()
	return (
		<div className="space-y-1.5">
			<Label htmlFor={name}>{label}</Label>
			<Input id={name} type={type} placeholder={placeholder} {...register(name)} />
			<FieldError name={name} />
		</div>
	)
}

function RHFTextarea({
	name,
	label,
	placeholder,
	maxLength,
}: {
	name: string
	label: string
	placeholder?: string
	maxLength?: number
}) {
	const { register } = useFormContext<FormValues>()
	return (
		<div className="space-y-1.5">
			<Label htmlFor={name}>{label}</Label>
			<Textarea id={name} placeholder={placeholder} maxLength={maxLength} {...register(name)} />
			<FieldError name={name} />
		</div>
	)
}

function RHFSelect({
	name,
	label,
	placeholder,
	options,
}: {
	name: string
	label: string
	placeholder?: string
	options: string[]
}) {
	const { watch, setValue } = useFormContext<FormValues>()
	const value: string = watch(name as any)
	return (
		<div className="space-y-1.5">
			<Label>{label}</Label>
			<Select onValueChange={(v) => setValue(name as any, v, { shouldValidate: true })} value={value || ''}>
				<SelectTrigger>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{options.map((o) => (
						<SelectItem key={o} value={o}>
							{o}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<FieldError name={name} />
		</div>
	)
}

function Section1() {
	const { watch, setValue, register } = useFormContext<FormValues>()
	const primaryCountry: typeof countries[number] = watch('section1.primaryCountry')
	const regions: string[] = watch('section1.operationRegions') || []
	const updateRegions = (vals: string[]) => setValue('section1.operationRegions', vals, { shouldValidate: true })
	const regionOptions =
		primaryCountry === 'United States'
			? [...usStates]
			: primaryCountry === 'Canada'
			? [...caProvinces]
			: [...usStates, ...caProvinces]

	return (
		<div className="space-y-6">
			<SectionTitle>Section 1: Organization Information</SectionTitle>
			<RHFInput name="section1.organizationLegalName" label="Organization Legal Name *" />
			<RHFInput name="section1.operatingName" label="Operating Name (DBA)" />
			<RHFSelect
				name="section1.organizationType"
				label="Organization Type *"
				options={[...organizationTypes]}
				placeholder="Select organization type"
			/>
			<RHFInput name="section1.taxId" label="Tax ID/EIN Number *" placeholder="EIN/BN" />
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div className="space-y-1.5">
					<Label>Year Established *</Label>
					<Input
						type="number"
						min={1950}
						max={new Date().getFullYear()}
						{...register('section1.yearEstablished', { valueAsNumber: true })}
					/>
					<FieldError name="section1.yearEstablished" />
				</div>
				<RHFInput name="section1.registrationNumber" label="Registration/Charity Number *" />
			</div>
			<RHFSelect name="section1.primaryCountry" label="Primary Country of Operation *" options={[...countries]} />
			<div className="space-y-1.5">
				<Label>States/Provinces Where You Operate *</Label>
				<MultiSelect options={regionOptions as string[]} value={regions} onChange={updateRegions} name="regions" />
				<FieldError name="section1.operationRegions" />
			</div>
			<RHFInput name="section1.website" label="Organization Website *" placeholder="https://example.org" />
			<RHFTextarea
				name="section1.missionStatement"
				label="Organization Mission Statement *"
				placeholder="Please describe your organization's mission and how you serve your community"
				maxLength={500}
			/>
		</div>
	)
}

function Section2() {
	const { watch, setValue } = useFormContext<FormValues>()
	const same = watch('section2.mailingSameAsHq')
	const officeDays: string[] = watch('section2.officeDays') || []
	const setOfficeDays = (vals: string[]) => setValue('section2.officeDays', vals, { shouldValidate: true })
	const dayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

	return (
		<div className="space-y-6">
			<SectionTitle>Section 2: Contact Information</SectionTitle>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<RHFInput name="section2.hqStreet" label="Headquarters Street Address *" />
				<RHFInput name="section2.hqStreet2" label="Address Line 2 (Suite/Unit)" />
				<RHFInput name="section2.hqCity" label="City *" />
				<RHFInput name="section2.hqState" label="State/Province *" />
				<RHFInput name="section2.hqPostal" label="ZIP/Postal Code *" />
				<RHFInput name="section2.hqCountry" label="Country *" />
			</div>
			<div className="flex items-center gap-2">
				<input
					id="sameAsHq"
					type="checkbox"
					className="h-4 w-4"
					checked={!!same}
					onChange={(e) => setValue('section2.mailingSameAsHq', e.currentTarget.checked)}
				/>
				<Label htmlFor="sameAsHq">Mailing address same as headquarters</Label>
			</div>
			{!same && (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<RHFInput name="section2.mailStreet" label="Mailing Street Address" />
					<RHFInput name="section2.mailStreet2" label="Address Line 2 (Suite/Unit)" />
					<RHFInput name="section2.mailCity" label="City" />
					<RHFInput name="section2.mailState" label="State/Province" />
					<RHFInput name="section2.mailPostal" label="ZIP/Postal Code" />
					<RHFInput name="section2.mailCountry" label="Country" />
				</div>
			)}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<RHFInput name="section2.primaryContactName" label="Primary Contact Full Name *" />
				<RHFInput name="section2.primaryContactTitle" label="Job Title *" />
				<RHFInput name="section2.primaryContactRole" label="Role in Organization *" />
				<RHFInput name="section2.primaryEmail" label="Primary Email *" type="email" />
				<RHFInput name="section2.primaryPhone" label="Primary Phone *" placeholder="+1 (XXX) XXX-XXXX" />
				<RHFInput name="section2.altPhone" label="Alternative Phone" />
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<RHFInput name="section2.secondaryContactName" label="Secondary Contact Name" />
				<RHFInput name="section2.secondaryContactTitle" label="Secondary Contact Title" />
				<RHFInput name="section2.secondaryContactEmail" label="Secondary Contact Email" />
				<RHFInput name="section2.secondaryContactPhone" label="Secondary Contact Phone" />
			</div>
			<div className="space-y-1.5">
				<Label>Office Days</Label>
				<MultiSelect options={dayOptions} value={officeDays} onChange={setOfficeDays} name="officeDays" />
				<FieldError name="section2.officeDays" />
			</div>
			<RHFInput name="section2.officeHours" label="Office Hours (e.g., 9AM-5PM)" />
			<RHFInput name="section2.timezone" label="Time zone (e.g., America/New_York)" />
		</div>
	)
}

function FileInput({
	name,
	label,
	accept,
	required,
	maxSizeMB,
}: {
	name: string
	label: string
	accept?: string
	required?: boolean
	maxSizeMB?: number
}) {
	const { setValue, watch } = useFormContext<FormValues>()
	const file: File | undefined = watch(name as any)
	const fileId = React.useId()
	
	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return bytes + ' B'
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
	}

	return (
		<div className="space-y-1.5">
			<Label htmlFor={fileId}>{label}{required ? ' *' : ''}</Label>
			<div className="space-y-2">
				<input
					id={fileId}
					name={name}
					type="file"
					accept={accept}
					onChange={(e) => {
						const selectedFile = e.currentTarget.files?.[0]
						setValue(name as any, selectedFile, { shouldValidate: true })
					}}
					className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-white hover:file:bg-primary/90 cursor-pointer"
				/>
				{file && (
					<div className="flex items-center justify-between rounded-md border bg-muted/50 p-2 text-sm">
						<div className="flex items-center gap-2">
							<svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
							<span className="truncate font-medium">{file.name}</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground">{formatFileSize(file.size)}</span>
							<button
								type="button"
								onClick={() => {
									setValue(name as any, undefined, { shouldValidate: true })
									const input = document.getElementById(fileId) as HTMLInputElement
									if (input) input.value = ''
								}}
								className="text-muted-foreground hover:text-destructive"
							>
								<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					</div>
				)}
				{maxSizeMB && (
					<p className="text-xs text-muted-foreground">Maximum file size: {maxSizeMB}MB</p>
				)}
			</div>
			<FieldError name={name} />
		</div>
	)
}

function Section3() {
	const { watch, setValue } = useFormContext<FormValues>()
	const refs: Array<any> = watch('section3.references') || []
	const setRefs = (val: any[]) => setValue('section3.references', val, { shouldValidate: true })

	const updateRef = (idx: number, key: string, val: string) => {
		const copy = [...refs]
		copy[idx] = { ...copy[idx], [key]: val }
		setRefs(copy)
	}

	return (
		<div className="space-y-6">
			<SectionTitle>Section 3: Organization Credentials & Verification</SectionTitle>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<FileInput name="section3.nonProfitDoc" label="Non-Profit Registration Document" accept="application/pdf,.pdf" maxSizeMB={5} />
				<FileInput name="section3.businessLicense" label="Business/Operating License" accept="application/pdf,.pdf" maxSizeMB={5} />
				<FileInput name="section3.insuranceProof" label="Proof of Insurance" accept="application/pdf,.pdf" maxSizeMB={5} />
				<RHFInput name="section3.insuranceExpiry" label="Insurance Expiration Date *" type="date" />
				<FileInput name="section3.boardList" label="Board of Directors List" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" maxSizeMB={2} />
				<FileInput name="section3.annualReport" label="Annual Report/Financial Statement (Optional)" accept="application/pdf,.pdf" maxSizeMB={10} />
			</div>

			<div className="space-y-3">
				<Label>Professional References (at least 2)</Label>
				{refs.map((r, i) => (
					<div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-md border p-3">
						<RHFInput name={`section3.references.${i}.name`} label="Name *" />
						<RHFInput name={`section3.references.${i}.organization`} label="Organization *" />
						<RHFInput name={`section3.references.${i}.title`} label="Title *" />
						<RHFInput name={`section3.references.${i}.email`} label="Email *" type="email" />
						<RHFInput name={`section3.references.${i}.phone`} label="Phone *" />
						<RHFInput name={`section3.references.${i}.relationship`} label="Relationship *" />
						<RHFInput name={`section3.references.${i}.yearsKnown`} label="Years known *" />
					</div>
				))}
				<div className="flex gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={() =>
							setRefs([
								...refs,
								{ name: '', organization: '', title: '', email: '', phone: '', relationship: '', yearsKnown: '' },
							])
						}
						disabled={refs.length >= 3}
					>
						Add Reference
					</Button>
					<Button
						type="button"
						variant="ghost"
						onClick={() => setRefs(refs.slice(0, -1))}
						disabled={refs.length <= 2}
					>
						Remove Last
					</Button>
				</div>
			</div>

			<div className="space-y-2">
				<Label>Government Programs Affiliation</Label>
				<MultiSelect
					name="section3.affiliatedPrograms"
					options={['WIOA', 'TANF', 'Refugee Resettlement Program', 'Veterans Employment Services', 'Other']}
					value={watch('section3.affiliatedPrograms') || []}
					onChange={(v) => setValue('section3.affiliatedPrograms', v)}
				/>
				<RHFInput name="section3.affiliatedProgramsOther" label="If Other, specify" />
			</div>
		</div>
	)
}

function Section4() {
	const { watch, setValue } = useFormContext<FormValues>()
	const targetPopulations = [
		'Immigrants (documented)',
		'Refugees/Asylum seekers',
		'Single parents/heads of household',
		'Low-income individuals',
		'Unemployed/underemployed',
		'Survivors of domestic violence',
		'Formerly incarcerated individuals',
		'Youth/young adults (18-24)',
		'Seniors seeking supplemental income',
		'People with disabilities',
		'Veterans',
		'Homeless/housing insecure',
		'Other',
	]
	const languages = [
		'English',
		'Spanish',
		'French',
		'Arabic',
		'Mandarin/Cantonese',
		'Ukrainian',
		'Russian',
		'Somali',
		'Vietnamese',
		'Tagalog',
		'Hindi',
		'Other',
	]
	const supportServices = [
		'Job readiness training',
		'Resume writing assistance',
		'Interview preparation',
		'English language classes',
		'Transportation assistance',
		'Childcare support',
		'Work clothing/uniforms',
		'None - we connect people directly to jobs',
		'Other',
	]
	return (
		<div className="space-y-6">
			<SectionTitle>Section 4: Service Capacity & Target Population</SectionTitle>
			<RHFSelect
				name="section4.servedAnnually"
				label="How many people do you serve annually? *"
				options={['1-50', '51-100', '101-250', '251-500', '501-1,000', '1,000+']}
			/>
			<div className="space-y-1.5">
				<Label>Primary populations you serve *</Label>
				<MultiSelect
					name="section4.targetPopulations"
					options={targetPopulations}
					value={watch('section4.targetPopulations') || []}
					onChange={(v) => setValue('section4.targetPopulations', v, { shouldValidate: true })}
				/>
				<FieldError name="section4.targetPopulations" />
			</div>
			<div className="space-y-1.5">
				<Label>Languages your staff speaks *</Label>
				<MultiSelect
					name="section4.languages"
					options={languages}
					value={watch('section4.languages') || []}
					onChange={(v) => setValue('section4.languages', v, { shouldValidate: true })}
				/>
				<FieldError name="section4.languages" />
			</div>
			<RHFSelect
				name="section4.referralsPerMonth"
				label="How many candidates do you expect to refer per month? *"
				options={['1-5', '6-10', '11-20', '21-50', '50+']}
			/>
			<div className="space-y-1.5">
				<Label>Pre-employment support services *</Label>
				<MultiSelect
					name="section4.preEmploymentSupport"
					options={supportServices}
					value={watch('section4.preEmploymentSupport') || []}
					onChange={(v) => setValue('section4.preEmploymentSupport', v, { shouldValidate: true })}
				/>
				<FieldError name="section4.preEmploymentSupport" />
			</div>
			<RHFSelect
				name="section4.avgPreparationTimeline"
				label="Average timeline for candidate preparation"
				options={['Immediate (0-3 days)', '1 week', '2 weeks', '1 month', 'Varies by individual']}
			/>
		</div>
	)
}


