'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { MapPin } from 'lucide-react'
import {
	US_STATES,
	validateUSAddress,
	validateUSZipCode,
	validateUSPhoneNumber,
	formatUSPhoneNumber,
} from '@/lib/usa-compliance'

interface USAddressFormProps {
	onValidAddress: (address: any) => void
	initialAddress?: any
}

export function USAddressForm({ onValidAddress, initialAddress }: USAddressFormProps) {
	const [address, setAddress] = useState({
		line1: initialAddress?.line1 || '',
		line2: initialAddress?.line2 || '',
		city: initialAddress?.city || '',
		state: initialAddress?.state || '',
		zip: initialAddress?.zip || '',
		phone: initialAddress?.phone || '',
	})

	const [validation, setValidation] = useState<{
		isValid: boolean
		errors: Record<string, string>
		suggestions: any[]
	}>({
		isValid: false,
		errors: {},
		suggestions: [],
	})

	const [validating, setValidating] = useState(false)

	const validateAddress = async () => {
		setValidating(true)
		const errors: Record<string, string> = {}

		if (!address.line1.trim()) errors.line1 = 'Street address is required'
		if (!address.city.trim()) errors.city = 'City is required'
		if (!address.state) errors.state = 'State is required'
		if (!address.zip.trim()) errors.zip = 'ZIP code is required'
		else if (!validateUSZipCode(address.zip)) errors.zip = 'Invalid ZIP code format'

		if (address.phone && !validateUSPhoneNumber(address.phone)) {
			errors.phone = 'Invalid US phone number'
		}

		if (Object.keys(errors).length === 0) {
			try {
				const result = await validateUSAddress({
					line1: address.line1,
					line2: address.line2,
					city: address.city,
					state: address.state,
					zip: address.zip,
					phone: address.phone,
				})

				if (result.isValid) {
					setValidation({ isValid: true, errors: {}, suggestions: [] })
					const formattedAddress = {
						...result.formatted,
						phone: address.phone ? formatUSPhoneNumber(address.phone) : '',
					}
					onValidAddress(formattedAddress)
				} else {
					setValidation({
						isValid: false,
						errors: { general: result.error || 'Invalid address' },
						suggestions: result.suggestions || [],
					})
				}
			} catch (_e) {
				setValidation({
					isValid: false,
					errors: { general: 'Address validation failed' },
					suggestions: [],
				})
			}
		} else {
			setValidation({ isValid: false, errors, suggestions: [] })
		}

		setValidating(false)
	}

	const handleZipChange = (zip: string) => {
		setAddress((prev) => ({ ...prev, zip }))

		// Simple auto-fill for common ZIP codes
		if (zip.length === 5) {
			const zipToLocation: Record<string, { city: string; state: string }> = {
				'10001': { city: 'New York', state: 'NY' },
				'90210': { city: 'Beverly Hills', state: 'CA' },
				'60601': { city: 'Chicago', state: 'IL' },
			}
			const location = zipToLocation[zip]
			if (location) {
				setAddress((prev) => ({
					...prev,
					city: location.city,
					state: location.state,
				}))
			}
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center space-x-2">
					<MapPin className="w-5 h-5" />
					<span>Service Address</span>
					{validation.isValid && (
						<Badge variant="default" className="ml-2">
							✓ Verified
						</Badge>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<label htmlFor="address-line1" className="block text-sm font-medium mb-2">
						Street Address <span className="text-destructive" aria-label="required">*</span>
					</label>
					<Input
						id="address-line1"
						name="line1"
						value={address.line1}
						onChange={(e) => setAddress((prev) => ({ ...prev, line1: e.target.value }))}
						placeholder="123 Main Street"
						className={validation.errors.line1 ? 'border-red-500' : ''}
						aria-invalid={validation.errors.line1 ? 'true' : 'false'}
						aria-describedby={validation.errors.line1 ? 'line1-error' : undefined}
						aria-required="true"
					/>
					{validation.errors.line1 && (
						<p id="line1-error" role="alert" aria-live="polite" className="text-sm text-red-600 mt-1">
							{validation.errors.line1}
						</p>
					)}
				</div>

				<div>
					<label htmlFor="address-line2" className="block text-sm font-medium mb-2">
						Apartment, Suite, etc. (optional)
					</label>
					<Input
						id="address-line2"
						name="line2"
						value={address.line2}
						onChange={(e) => setAddress((prev) => ({ ...prev, line2: e.target.value }))}
						placeholder="Apt 4B, Suite 100, etc."
					/>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div>
						<label htmlFor="address-zip" className="block text-sm font-medium mb-2">
							ZIP Code <span className="text-destructive" aria-label="required">*</span>
						</label>
						<Input
							id="address-zip"
							name="zip"
							value={address.zip}
							onChange={(e) => handleZipChange(e.target.value)}
							placeholder="10001"
							className={validation.errors.zip ? 'border-red-500' : ''}
							aria-invalid={validation.errors.zip ? 'true' : 'false'}
							aria-describedby={validation.errors.zip ? 'zip-error' : undefined}
							aria-required="true"
						/>
						{validation.errors.zip && (
							<p id="zip-error" role="alert" aria-live="polite" className="text-sm text-red-600 mt-1">
								{validation.errors.zip}
							</p>
						)}
					</div>
					<div>
						<label htmlFor="address-state" className="block text-sm font-medium mb-2">
							State <span className="text-destructive" aria-label="required">*</span>
						</label>
						<Select
							value={address.state}
							onValueChange={(value) => setAddress((prev) => ({ ...prev, state: value }))}
						>
							<SelectTrigger 
								id="address-state"
								className={validation.errors.state ? 'border-red-500' : ''}
								aria-invalid={validation.errors.state ? 'true' : 'false'}
								aria-describedby={validation.errors.state ? 'state-error' : undefined}
								aria-required="true"
							>
								<SelectValue placeholder="Select state" />
							</SelectTrigger>
							<SelectContent>
								{Object.entries(US_STATES).map(([code, name]) => (
									<SelectItem key={code} value={code}>
										{code} — {name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{validation.errors.state && (
							<p id="state-error" role="alert" aria-live="polite" className="text-sm text-red-600 mt-1">
								{validation.errors.state}
							</p>
						)}
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div>
						<label htmlFor="address-city" className="block text-sm font-medium mb-2">
							City <span className="text-destructive" aria-label="required">*</span>
						</label>
						<Input
							id="address-city"
							name="city"
							value={address.city}
							onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))}
							placeholder="New York"
							className={validation.errors.city ? 'border-red-500' : ''}
							aria-invalid={validation.errors.city ? 'true' : 'false'}
							aria-describedby={validation.errors.city ? 'city-error' : undefined}
							aria-required="true"
						/>
						{validation.errors.city && (
							<p id="city-error" role="alert" aria-live="polite" className="text-sm text-red-600 mt-1">
								{validation.errors.city}
							</p>
						)}
					</div>
					<div>
						<label htmlFor="address-phone" className="block text-sm font-medium mb-2">
							Phone (optional)
						</label>
						<Input
							id="address-phone"
							name="phone"
							type="tel"
							value={address.phone}
							onChange={(e) =>
								setAddress((prev) => ({ ...prev, phone: e.target.value }))
							}
							placeholder="(555) 123-4567"
							className={validation.errors.phone ? 'border-red-500' : ''}
							aria-invalid={validation.errors.phone ? 'true' : 'false'}
							aria-describedby={validation.errors.phone ? 'phone-error' : undefined}
						/>
						{validation.errors.phone && (
							<p id="phone-error" role="alert" aria-live="polite" className="text-sm text-red-600 mt-1">
								{validation.errors.phone}
							</p>
						)}
					</div>
				</div>

				<div className="flex items-center justify-between">
					{validation.errors.general && (
						<p role="alert" aria-live="assertive" className="text-sm text-red-600">
							{validation.errors.general}
						</p>
					)}
					<Button 
						onClick={validateAddress} 
						disabled={validating}
						aria-label={validating ? 'Validating address' : 'Validate address'}
					>
						{validating ? 'Validating…' : 'Validate Address'}
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}


