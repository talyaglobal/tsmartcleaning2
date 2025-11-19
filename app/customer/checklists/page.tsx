'use client'

import { useState, useEffect } from 'react'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Edit2, Save, X, CheckCircle2, Circle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import EnsureDashboardUser from '@/components/auth/EnsureDashboardUser'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface ChecklistItem {
  label: string
  checked: boolean
  notes?: string
}

interface Checklist {
  id: string
  name: string
  items: ChecklistItem[]
  is_default: boolean
  created_at: string
  updated_at: string
}

export default function CustomerChecklistsPage() {
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId')
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null)
  const [newChecklistName, setNewChecklistName] = useState('')
  const [newChecklistItems, setNewChecklistItems] = useState<ChecklistItem[]>([])
  const [isDefault, setIsDefault] = useState(false)

  useEffect(() => {
    if (userId) {
      loadChecklists()
    }
  }, [userId])

  const loadChecklists = async () => {
    if (!userId) return
    try {
      const response = await fetch(`/api/customers/${userId}/checklists`)
      const data = await response.json()
      if (data.checklists) {
        setChecklists(data.checklists)
      }
    } catch (error) {
      console.error('Error loading checklists:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateChecklist = () => {
    setEditingChecklist(null)
    setNewChecklistName('')
    setNewChecklistItems([{ label: '', checked: false }])
    setIsDefault(false)
    setIsDialogOpen(true)
  }

  const handleEditChecklist = (checklist: Checklist) => {
    setEditingChecklist(checklist)
    setNewChecklistName(checklist.name)
    setNewChecklistItems(checklist.items.length > 0 ? checklist.items : [{ label: '', checked: false }])
    setIsDefault(checklist.is_default)
    setIsDialogOpen(true)
  }

  const handleSaveChecklist = async () => {
    if (!userId || !newChecklistName.trim()) return

    const validItems = newChecklistItems.filter(item => item.label.trim())
    if (validItems.length === 0) {
      alert('Please add at least one checklist item')
      return
    }

    try {
      if (editingChecklist) {
        // Update existing
        const response = await fetch(`/api/customers/${userId}/checklists`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingChecklist.id,
            name: newChecklistName,
            items: validItems,
            is_default: isDefault,
          }),
        })
        if (!response.ok) throw new Error('Failed to update checklist')
      } else {
        // Create new
        const response = await fetch(`/api/customers/${userId}/checklists`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newChecklistName,
            items: validItems,
            is_default: isDefault,
          }),
        })
        if (!response.ok) throw new Error('Failed to create checklist')
      }
      setIsDialogOpen(false)
      loadChecklists()
    } catch (error) {
      console.error('Error saving checklist:', error)
      alert('Failed to save checklist')
    }
  }

  const handleDeleteChecklist = async (id: string) => {
    if (!userId || !confirm('Are you sure you want to delete this checklist?')) return

    try {
      const response = await fetch(`/api/customers/${userId}/checklists?id=${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete checklist')
      loadChecklists()
    } catch (error) {
      console.error('Error deleting checklist:', error)
      alert('Failed to delete checklist')
    }
  }

  const handleToggleItem = async (checklistId: string, itemIndex: number) => {
    if (!userId) return

    const checklist = checklists.find(c => c.id === checklistId)
    if (!checklist) return

    const updatedItems = [...checklist.items]
    updatedItems[itemIndex].checked = !updatedItems[itemIndex].checked

    try {
      const response = await fetch(`/api/customers/${userId}/checklists`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: checklistId,
          items: updatedItems,
        }),
      })
      if (!response.ok) throw new Error('Failed to update item')
      loadChecklists()
    } catch (error) {
      console.error('Error updating item:', error)
    }
  }

  const addNewItem = () => {
    setNewChecklistItems([...newChecklistItems, { label: '', checked: false }])
  }

  const removeItem = (index: number) => {
    setNewChecklistItems(newChecklistItems.filter((_, i) => i !== index))
  }

  const updateItemLabel = (index: number, label: string) => {
    const updated = [...newChecklistItems]
    updated[index].label = label
    setNewChecklistItems(updated)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <EnsureDashboardUser paramKey="userId" />
        <DashboardNav userType="customer" userName="User" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading checklists...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <EnsureDashboardUser paramKey="userId" />
      <DashboardNav userType="customer" userName="User" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Checklists</h1>
            <p className="text-muted-foreground">Create and manage custom cleaning checklists</p>
          </div>
          <Button onClick={handleCreateChecklist}>
            <Plus className="mr-2 h-4 w-4" />
            New Checklist
          </Button>
        </div>

        {checklists.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No checklists yet. Create your first one!</p>
            <Button onClick={handleCreateChecklist}>
              <Plus className="mr-2 h-4 w-4" />
              Create Checklist
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {checklists.map((checklist) => {
              const completedCount = checklist.items.filter(item => item.checked).length
              const totalCount = checklist.items.length
              const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

              return (
                <Card key={checklist.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold">{checklist.name}</h3>
                        {checklist.is_default && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {completedCount} of {totalCount} completed
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditChecklist(checklist)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteChecklist(checklist.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {checklist.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleToggleItem(checklist.id, index)}
                      >
                        {item.checked ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className={item.checked ? 'line-through text-muted-foreground' : ''}>
                            {item.label}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingChecklist ? 'Edit Checklist' : 'Create New Checklist'}
              </DialogTitle>
              <DialogDescription>
                {editingChecklist
                  ? 'Update your checklist details'
                  : 'Create a custom checklist for your cleaning needs'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Checklist Name</Label>
                <Input
                  id="name"
                  value={newChecklistName}
                  onChange={(e) => setNewChecklistName(e.target.value)}
                  placeholder="e.g., Pre-Cleaning Checklist"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addNewItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                <div className="space-y-2">
                  {newChecklistItems.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item.label}
                        onChange={(e) => updateItemLabel(index, e.target.value)}
                        placeholder={`Item ${index + 1}`}
                        className="flex-1"
                      />
                      {newChecklistItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="default"
                  checked={isDefault}
                  onCheckedChange={(checked) => setIsDefault(checked === true)}
                />
                <Label htmlFor="default" className="cursor-pointer">
                  Set as default checklist
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveChecklist}>
                <Save className="mr-2 h-4 w-4" />
                {editingChecklist ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

