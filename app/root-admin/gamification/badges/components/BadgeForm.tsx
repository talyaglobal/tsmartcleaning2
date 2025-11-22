'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, X, Award } from 'lucide-react'
import { toast } from 'sonner'

type BadgeCriteria = {
  type: 'points' | 'jobs' | 'ratings' | 'streak' | 'referrals' | 'custom'
  threshold: number
  metadata?: Record<string, unknown>
}

type BadgeFormData = {
  code: string
  name: string
  description: string
  icon: string
  userType: 'company' | 'cleaner'
  criteria: BadgeCriteria
  pointsReward: number
}

type BadgeFormProps = {
  badge?: {
    id: string
    code: string
    name: string
    description: string
    icon?: string
    user_type: 'company' | 'cleaner'
    criteria: BadgeCriteria
    points_reward?: number
  }
  onSave: (data: BadgeFormData) => Promise<void>
  onCancel: () => void
  saving?: boolean
}

export function BadgeForm({ badge, onSave, onCancel, saving = false }: BadgeFormProps) {
  const [formData, setFormData] = useState<BadgeFormData>({
    code: badge?.code || '',
    name: badge?.name || '',
    description: badge?.description || '',
    icon: badge?.icon || '',
    userType: badge?.user_type || 'company',
    criteria: badge?.criteria || {
      type: 'points',
      threshold: 0,
    },
    pointsReward: badge?.points_reward || 0,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.code.trim()) {
      newErrors.code = 'Badge code is required'
    } else if (!/^[a-z0-9_]+$/.test(formData.code)) {
      newErrors.code = 'Code must be lowercase alphanumeric with underscores only'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Badge name is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (formData.criteria.threshold < 0) {
      newErrors.threshold = 'Threshold must be non-negative'
    }

    if (formData.pointsReward < 0) {
      newErrors.pointsReward = 'Points reward must be non-negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      toast.error('Please fix the errors in the form')
      return
    }

    try {
      await onSave(formData)
    } catch (error: any) {
      toast.error(error.message || 'Failed to save badge')
    }
  }

  const criteriaTypeOptions = [
    { value: 'points', label: 'Points' },
    { value: 'jobs', label: 'Jobs Completed' },
    { value: 'ratings', label: 'Ratings' },
    { value: 'streak', label: 'Streak' },
    { value: 'referrals', label: 'Referrals' },
    { value: 'custom', label: 'Custom' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">
                Badge Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                placeholder="first_timer"
                disabled={!!badge} // Can't change code after creation
              />
              {errors.code && <p className="text-sm text-red-600">{errors.code}</p>}
              <p className="text-xs text-slate-500">Lowercase, alphanumeric, underscores only. Cannot be changed after creation.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Badge Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="First Timer"
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Awarded for posting your first job"
                rows={3}
              />
              {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Icon (Emoji or URL)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="🌟 or https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userType">
                User Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.userType}
                onValueChange={(value: 'company' | 'cleaner') =>
                  setFormData({ ...formData, userType: value })
                }
                disabled={!!badge} // Can't change user type after creation
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="cleaner">Cleaner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Criteria & Rewards */}
        <Card>
          <CardHeader>
            <CardTitle>Criteria & Rewards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="criteriaType">
                Criteria Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.criteria.type}
                onValueChange={(value: BadgeCriteria['type']) =>
                  setFormData({
                    ...formData,
                    criteria: { ...formData.criteria, type: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {criteriaTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold">
                Threshold <span className="text-red-500">*</span>
              </Label>
              <Input
                id="threshold"
                type="number"
                min="0"
                value={formData.criteria.threshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    criteria: { ...formData.criteria, threshold: parseInt(e.target.value) || 0 },
                  })
                }
                placeholder="0"
              />
              {errors.threshold && <p className="text-sm text-red-600">{errors.threshold}</p>}
              <p className="text-xs text-slate-500">
                {formData.criteria.type === 'points' && 'Minimum points required'}
                {formData.criteria.type === 'jobs' && 'Minimum jobs completed'}
                {formData.criteria.type === 'ratings' && 'Minimum average rating'}
                {formData.criteria.type === 'streak' && 'Minimum streak days'}
                {formData.criteria.type === 'referrals' && 'Minimum referrals count'}
                {formData.criteria.type === 'custom' && 'Custom threshold value'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pointsReward">Bonus Points</Label>
              <Input
                id="pointsReward"
                type="number"
                min="0"
                value={formData.pointsReward}
                onChange={(e) =>
                  setFormData({ ...formData, pointsReward: parseInt(e.target.value) || 0 })
                }
                placeholder="0"
              />
              {errors.pointsReward && <p className="text-sm text-red-600">{errors.pointsReward}</p>}
              <p className="text-xs text-slate-500">Points awarded when badge is earned (optional)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="text-4xl">{formData.icon || '🏆'}</div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{formData.name || 'Badge Name'}</h3>
              <p className="text-sm text-slate-600">{formData.description || 'Badge description'}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{formData.userType}</Badge>
                {formData.pointsReward > 0 && (
                  <Badge variant="secondary">+{formData.pointsReward} points</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {badge ? 'Update Badge' : 'Create Badge'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

