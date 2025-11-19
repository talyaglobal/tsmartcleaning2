'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Upload, X, Image as ImageIcon, Edit2 } from 'lucide-react'
import Image from 'next/image'

interface PortfolioItem {
  id?: string
  imageUrl: string
  title?: string
  description?: string
}

interface PortfolioManagerProps {
  items: PortfolioItem[]
  onAdd: (item: Omit<PortfolioItem, 'id' | 'imageUrl'>, file: File) => Promise<void>
  onUpdate: (id: string, item: Omit<PortfolioItem, 'id' | 'imageUrl'>, file?: File) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

export function PortfolioManager({
  items,
  onAdd,
  onUpdate,
  onRemove,
}: PortfolioManagerProps) {
  const [uploading, setUploading] = useState(false)
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({ title: '', description: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file && !editingItem) {
      alert('Please select an image')
      return
    }

    setUploading(true)
    try {
      if (editingItem?.id) {
        await onUpdate(editingItem.id, formData, file || undefined)
      } else if (file) {
        await onAdd(formData, file)
      }
      // Reset form
      setFormData({ title: '', description: '' })
      setPreview(null)
      setEditingItem(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error saving portfolio item:', error)
      alert('Failed to save portfolio item')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async (id: string) => {
    if (!confirm('Are you sure you want to remove this portfolio item?')) return
    try {
      await onRemove(id)
    } catch (error) {
      console.error('Error removing portfolio item:', error)
      alert('Failed to remove portfolio item')
    }
  }

  const handleEdit = (item: PortfolioItem) => {
    setEditingItem(item)
    setFormData({
      title: item.title || '',
      description: item.description || '',
    })
    setPreview(item.imageUrl)
  }

  const handleCancel = () => {
    setEditingItem(null)
    setFormData({ title: '', description: '' })
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Portfolio</h3>
          <p className="text-sm text-muted-foreground">
            Showcase your work with photos from completed jobs
          </p>
        </div>
      </div>

      {/* Add/Edit Form */}
      <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="portfolio-title">Title</Label>
              <Input
                id="portfolio-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Living Room Deep Clean"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolio-description">Description</Label>
              <Textarea
                id="portfolio-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the work done..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolio-image">Image</Label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {preview ? 'Change Image' : 'Select Image'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">JPG, PNG or WEBP, max 10MB</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="border rounded-lg p-4 aspect-square flex items-center justify-center bg-muted">
              {preview ? (
                <div className="relative w-full h-full">
                  <Image
                    src={preview}
                    alt={formData.title || 'Portfolio preview'}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No image selected</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={uploading || (!preview && !editingItem)}
            className="flex-1"
          >
            {uploading
              ? 'Saving...'
              : editingItem
                ? 'Update Portfolio Item'
                : 'Add to Portfolio'}
          </Button>
          {editingItem && (
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Portfolio Grid */}
      {items.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No portfolio items yet. Add your first work sample above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id || item.imageUrl}
              className="border rounded-lg overflow-hidden group hover:shadow-lg transition-shadow"
            >
              <div className="relative aspect-square">
                <Image
                  src={item.imageUrl}
                  alt={item.title || 'Portfolio item'}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  {item.id && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemove(item.id!)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              {(item.title || item.description) && (
                <div className="p-4">
                  {item.title && (
                    <h4 className="font-semibold mb-1">{item.title}</h4>
                  )}
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

