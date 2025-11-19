'use client'

import React, { useEffect, useState } from 'react'
import { RequirePermission } from '@/components/auth/RequirePermission'
import { PageHeader } from '@/components/admin/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Building, MapPin } from 'lucide-react'

type Property = {
	id: string
	name: string
	address: string
	city: string
	state: string
	zip_code: string
	property_type: string | null
	square_feet: number | null
	bedrooms: number | null
	bathrooms: number | null
	status: string
	notes: string | null
	created_at: string
}

export default function CompanyPropertiesPage() {
	const [companyId, setCompanyId] = useState<string | null>(null)
	const [properties, setProperties] = useState<Property[]>([])
	const [loading, setLoading] = useState(true)
	const [dialogOpen, setDialogOpen] = useState(false)
	const [editingProperty, setEditingProperty] = useState<Property | null>(null)
	const [formData, setFormData] = useState({
		name: '',
		address: '',
		city: '',
		state: '',
		zip_code: '',
		property_type: '',
		square_feet: '',
		bedrooms: '',
		bathrooms: '',
		status: 'active',
		notes: '',
	})

	useEffect(() => {
		fetchData()
	}, [])

	const fetchData = async () => {
		try {
			const companyRes = await fetch('/api/companies/me')
			const companyData = await companyRes.json()
			
			if (!companyData.company) {
				setLoading(false)
				return
			}

			const id = companyData.company.id
			setCompanyId(id)

			const propertiesRes = await fetch(`/api/companies/${id}/properties`)
			const propertiesData = await propertiesRes.json()
			setProperties(propertiesData || [])
		} catch (error) {
			console.error('Error fetching data:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleOpenDialog = (property?: Property) => {
		if (property) {
			setEditingProperty(property)
			setFormData({
				name: property.name,
				address: property.address,
				city: property.city,
				state: property.state,
				zip_code: property.zip_code,
				property_type: property.property_type || '',
				square_feet: property.square_feet?.toString() || '',
				bedrooms: property.bedrooms?.toString() || '',
				bathrooms: property.bathrooms?.toString() || '',
				status: property.status,
				notes: property.notes || '',
			})
		} else {
			setEditingProperty(null)
			setFormData({
				name: '',
				address: '',
				city: '',
				state: '',
				zip_code: '',
				property_type: '',
				square_feet: '',
				bedrooms: '',
				bathrooms: '',
				status: 'active',
				notes: '',
			})
		}
		setDialogOpen(true)
	}

	const handleSubmit = async () => {
		if (!companyId) return

		try {
			const payload = {
				...formData,
				square_feet: formData.square_feet ? parseInt(formData.square_feet) : null,
				bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
				bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
				property_type: formData.property_type || null,
				notes: formData.notes || null,
			}

			const url = editingProperty
				? `/api/companies/${companyId}/properties/${editingProperty.id}`
				: `/api/companies/${companyId}/properties`
			
			const method = editingProperty ? 'PATCH' : 'POST'

			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})

			if (!response.ok) {
				const error = await response.json()
				alert(error.error || 'Failed to save property')
				return
			}

			setDialogOpen(false)
			fetchData()
		} catch (error) {
			console.error('Error saving property:', error)
			alert('Failed to save property')
		}
	}

	const handleDelete = async (propertyId: string) => {
		if (!companyId) return
		if (!confirm('Are you sure you want to delete this property?')) return

		try {
			const response = await fetch(`/api/companies/${companyId}/properties/${propertyId}`, {
				method: 'DELETE',
			})

			if (!response.ok) {
				alert('Failed to delete property')
				return
			}

			fetchData()
		} catch (error) {
			console.error('Error deleting property:', error)
			alert('Failed to delete property')
		}
	}

	if (loading) {
		return (
			<RequirePermission permission="view_own_company">
				<div className="space-y-4">
					{[...Array(3)].map((_, i) => (
						<div key={i} className="bg-gray-200 animate-pulse h-32 rounded-lg" />
					))}
				</div>
			</RequirePermission>
		)
	}

	return (
		<RequirePermission permission="view_own_company">
			<div className="space-y-6">
				<div className="flex justify-between items-center">
					<PageHeader
						title="Property Management"
						subtitle="Manage properties for your company"
					/>
					<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
						<DialogTrigger asChild>
							<Button onClick={() => handleOpenDialog()}>
								<Plus className="w-4 h-4 mr-2" />
								Add Property
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
							<DialogHeader>
								<DialogTitle>
									{editingProperty ? 'Edit Property' : 'Add New Property'}
								</DialogTitle>
								<DialogDescription>
									{editingProperty ? 'Update property information' : 'Add a new property to your company'}
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4 py-4">
								<div>
									<Label htmlFor="name">Property Name *</Label>
									<Input
										id="name"
										value={formData.name}
										onChange={(e) => setFormData({ ...formData, name: e.target.value })}
										placeholder="e.g., Main Office"
									/>
								</div>
								<div>
									<Label htmlFor="address">Address *</Label>
									<Input
										id="address"
										value={formData.address}
										onChange={(e) => setFormData({ ...formData, address: e.target.value })}
										placeholder="Street address"
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label htmlFor="city">City *</Label>
										<Input
											id="city"
											value={formData.city}
											onChange={(e) => setFormData({ ...formData, city: e.target.value })}
										/>
									</div>
									<div>
										<Label htmlFor="state">State *</Label>
										<Input
											id="state"
											value={formData.state}
											onChange={(e) => setFormData({ ...formData, state: e.target.value })}
										/>
									</div>
								</div>
								<div>
									<Label htmlFor="zip_code">Zip Code *</Label>
									<Input
										id="zip_code"
										value={formData.zip_code}
										onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label htmlFor="property_type">Property Type</Label>
										<Select
											value={formData.property_type}
											onValueChange={(value) => setFormData({ ...formData, property_type: value })}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select type" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="">None</SelectItem>
												<SelectItem value="residential">Residential</SelectItem>
												<SelectItem value="commercial">Commercial</SelectItem>
												<SelectItem value="office">Office</SelectItem>
												<SelectItem value="warehouse">Warehouse</SelectItem>
												<SelectItem value="other">Other</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div>
										<Label htmlFor="status">Status</Label>
										<Select
											value={formData.status}
											onValueChange={(value) => setFormData({ ...formData, status: value })}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="active">Active</SelectItem>
												<SelectItem value="inactive">Inactive</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
								<div className="grid grid-cols-3 gap-4">
									<div>
										<Label htmlFor="square_feet">Square Feet</Label>
										<Input
											id="square_feet"
											type="number"
											value={formData.square_feet}
											onChange={(e) => setFormData({ ...formData, square_feet: e.target.value })}
										/>
									</div>
									<div>
										<Label htmlFor="bedrooms">Bedrooms</Label>
										<Input
											id="bedrooms"
											type="number"
											value={formData.bedrooms}
											onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
										/>
									</div>
									<div>
										<Label htmlFor="bathrooms">Bathrooms</Label>
										<Input
											id="bathrooms"
											type="number"
											value={formData.bathrooms}
											onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
										/>
									</div>
								</div>
								<div>
									<Label htmlFor="notes">Notes</Label>
									<Textarea
										id="notes"
										value={formData.notes}
										onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
										rows={3}
									/>
								</div>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setDialogOpen(false)}>
									Cancel
								</Button>
								<Button onClick={handleSubmit} disabled={!formData.name || !formData.address || !formData.city || !formData.state || !formData.zip_code}>
									{editingProperty ? 'Update' : 'Create'}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{properties.map((property) => (
						<Card key={property.id}>
							<CardHeader>
								<div className="flex justify-between items-start">
									<div className="flex items-center gap-2">
										<Building className="w-5 h-5 text-gray-400" />
										<CardTitle className="text-lg">{property.name}</CardTitle>
									</div>
									<Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
										{property.status}
									</Badge>
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<div className="flex items-start gap-2 text-sm text-gray-600">
										<MapPin className="w-4 h-4 mt-0.5" />
										<div>
											<div>{property.address}</div>
											<div>
												{property.city}, {property.state} {property.zip_code}
											</div>
										</div>
									</div>
									{property.property_type && (
										<div className="text-sm">
											<span className="text-gray-600">Type: </span>
											<span className="font-medium capitalize">{property.property_type}</span>
										</div>
									)}
									{(property.square_feet || property.bedrooms || property.bathrooms) && (
										<div className="text-sm text-gray-600">
											{property.square_feet && <span>{property.square_feet.toLocaleString()} sq ft</span>}
											{property.bedrooms && <span> • {property.bedrooms} bed</span>}
											{property.bathrooms && <span> • {property.bathrooms} bath</span>}
										</div>
									)}
									<div className="flex gap-2 pt-2">
										<Button
											size="sm"
											variant="outline"
											onClick={() => handleOpenDialog(property)}
										>
											<Edit className="w-3 h-3 mr-1" />
											Edit
										</Button>
										<Button
											size="sm"
											variant="outline"
											onClick={() => handleDelete(property.id)}
										>
											<Trash2 className="w-3 h-3 mr-1" />
											Delete
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
					{properties.length === 0 && (
						<Card className="col-span-full">
							<CardContent className="p-6 text-center text-gray-500">
								No properties yet. Add your first property to get started.
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</RequirePermission>
	)
}

