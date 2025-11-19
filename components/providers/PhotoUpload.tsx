'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Camera, Upload, X } from 'lucide-react'
import { Label } from '@/components/ui/label'

interface PhotoUploadProps {
  currentPhoto?: string
  onUpload: (file: File) => Promise<void>
  onRemove?: () => Promise<void>
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export function PhotoUpload({
  currentPhoto,
  onUpload,
  onRemove,
  label = 'Profile Photo',
  size = 'md',
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentPhoto || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setUploading(true)
    try {
      await onUpload(file)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload photo')
      setPreview(currentPhoto || null)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = async () => {
    if (!onRemove) return
    setUploading(true)
    try {
      await onRemove()
      setPreview(null)
    } catch (error) {
      console.error('Remove error:', error)
      alert('Failed to remove photo')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Avatar className={sizeClasses[size]}>
            <AvatarImage src={preview || undefined} alt="Profile" />
            <AvatarFallback>
              <Camera className="h-8 w-8 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          {preview && onRemove && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
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
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Uploading...' : preview ? 'Change Photo' : 'Upload Photo'}
        </Button>
        <p className="text-sm text-muted-foreground">JPG, PNG or WEBP, max 5MB</p>
      </div>
    </div>
  )
}

