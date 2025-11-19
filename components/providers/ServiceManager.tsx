'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit2, Trash2 } from 'lucide-react'

interface Service {
  id?: string
  name: string
  category: string
  description?: string
  price?: number
  priceUnit?: 'per_hour' | 'per_sqft' | 'flat_rate'
}

interface ServiceManagerProps {
  services: Service[]
  onAdd: (service: Omit<Service, 'id'>) => Promise<void>
  onUpdate: (id: string, service: Omit<Service, 'id'>) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

const SERVICE_CATEGORIES = [
  'Residential',
  'Commercial',
  'Deep Cleaning',
  'Move-In/Out',
  'Carpet Cleaning',
  'Window Cleaning',
  'Post-Construction',
  'Eco-Friendly',
  'Other',
]

export function ServiceManager({
  services,
  onAdd,
  onUpdate,
  onRemove,
}: ServiceManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState<Omit<Service, 'id'>>({
    name: '',
    category: 'Residential',
    description: '',
    price: undefined,
    priceUnit: 'flat_rate',
  })

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditingService(service)
      setFormData({
        name: service.name,
        category: service.category,
        description: service.description || '',
        price: service.price,
        priceUnit: service.priceUnit || 'flat_rate',
      })
    } else {
      setEditingService(null)
      setFormData({
        name: '',
        category: 'Residential',
        description: '',
        price: undefined,
        priceUnit: 'flat_rate',
      })
    }
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Service name is required')
      return
    }

    try {
      if (editingService?.id) {
        await onUpdate(editingService.id, formData)
      } else {
        await onAdd(formData)
      }
      setDialogOpen(false)
    } catch (error) {
      console.error('Error saving service:', error)
      alert('Failed to save service')
    }
  }

  const handleRemove = async (id: string) => {
    if (!confirm('Are you sure you want to remove this service?')) return
    try {
      await onRemove(id)
    } catch (error) {
      console.error('Error removing service:', error)
      alert('Failed to remove service')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Services Offered</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Edit Service' : 'Add New Service'}
              </DialogTitle>
              <DialogDescription>
                Add a service that you offer to customers
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="service-name">Service Name *</Label>
                <Input
                  id="service-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Residential Cleaning"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="service-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-description">Description</Label>
                <Textarea
                  id="service-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this service includes..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service-price">Price</Label>
                  <Input
                    id="service-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseFloat(e.target.value) || undefined })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-unit">Unit</Label>
                  <Select
                    value={formData.priceUnit}
                    onValueChange={(value: 'per_hour' | 'per_sqft' | 'flat_rate') =>
                      setFormData({ ...formData, priceUnit: value })
                    }
                  >
                    <SelectTrigger id="service-unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat_rate">Flat Rate</SelectItem>
                      <SelectItem value="per_hour">Per Hour</SelectItem>
                      <SelectItem value="per_sqft">Per Sq Ft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingService ? 'Update' : 'Add'} Service
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-wrap gap-2">
        {services.length === 0 ? (
          <p className="text-sm text-muted-foreground">No services added yet</p>
        ) : (
          services.map((service) => (
            <Badge
              key={service.id || service.name}
              variant="secondary"
              className="text-sm py-1.5 px-3 flex items-center gap-2"
            >
              <span>{service.name}</span>
              {service.price && (
                <span className="text-xs text-muted-foreground">
                  ${service.price}
                  {service.priceUnit === 'per_hour' && '/hr'}
                  {service.priceUnit === 'per_sqft' && '/sqft'}
                </span>
              )}
              <button
                onClick={() => handleOpenDialog(service)}
                className="ml-1 hover:text-primary"
                aria-label="Edit service"
              >
                <Edit2 className="h-3 w-3" />
              </button>
              {service.id && (
                <button
                  onClick={() => handleRemove(service.id!)}
                  className="hover:text-destructive"
                  aria-label="Remove service"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))
        )}
      </div>
    </div>
  )
}

