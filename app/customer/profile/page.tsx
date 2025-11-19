'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import EnsureDashboardUser from '@/components/auth/EnsureDashboardUser'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { PhotoUpload } from '@/components/providers/PhotoUpload'
import { Badge } from '@/components/ui/badge'
import { MapPin, CreditCard, Trash2, Edit, Plus, Check, X, Bell } from 'lucide-react'
import { createAnonSupabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  avatar_url?: string
}

interface Address {
  id: string
  street_address: string
  apt_suite?: string
  city: string
  state: string
  zip_code: string
  is_default: boolean
}

interface PaymentMethod {
  id: string
  type: string
  brand?: string
  last4: string
  expiry_month?: number
  expiry_year?: number
  is_default: boolean
}

interface Preferences {
  special_instructions?: string
  preferred_cleaning_time?: string
  eco_friendly: boolean
  pet_friendly: boolean
  notification_email: boolean
  notification_sms: boolean
  notification_push: boolean
}

export default function CustomerProfilePage() {
  const searchParams = useSearchParams()
  const userId = searchParams?.get('userId') || ''
  
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [preferences, setPreferences] = useState<Preferences>({
    eco_friendly: false,
    pet_friendly: false,
    notification_email: true,
    notification_sms: false,
    notification_push: true,
  })

  // Dialog states
  const [addressDialogOpen, setAddressDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null)

  // Form states
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })
  const [addressForm, setAddressForm] = useState({
    street_address: '',
    apt_suite: '',
    city: '',
    state: '',
    zip_code: '',
    is_default: false,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (userId) {
      loadProfileData()
    }
  }, [userId])

  const loadProfileData = async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      // Load user data
      const userRes = await fetch(`/api/users/${userId}`)
      if (userRes.ok) {
        const userData = await userRes.json()
        const userObj = userData.user
        setUser(userObj)
        const nameParts = (userObj.full_name || '').split(' ')
        setPersonalInfo({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: userObj.email || '',
          phone: userObj.phone || '',
        })
      }

      // Load addresses
      const addressesRes = await fetch(`/api/customers/${userId}/addresses`)
      if (addressesRes.ok) {
        const addressesData = await addressesRes.json()
        setAddresses(addressesData.addresses || [])
      }

      // Load payment methods
      const paymentRes = await fetch(`/api/customers/${userId}/payment-methods`)
      if (paymentRes.ok) {
        const paymentData = await paymentRes.json()
        setPaymentMethods(paymentData.paymentMethods || [])
      }

      // Load preferences
      const prefsRes = await fetch(`/api/customers/${userId}/preferences`)
      if (prefsRes.ok) {
        const prefsData = await prefsRes.json()
        setPreferences(prefsData.preferences || preferences)
      }
    } catch (error) {
      console.error('Error loading profile data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (file: File) => {
    if (!userId) return
    
    const formData = new FormData()
    formData.append('file', file)
    
    const res = await fetch(`/api/customers/${userId}/avatar`, {
      method: 'POST',
      body: formData,
    })
    
    if (res.ok) {
      const data = await res.json()
      setUser(prev => prev ? { ...prev, avatar_url: data.avatarUrl } : null)
    } else {
      throw new Error('Failed to upload photo')
    }
  }

  const handlePhotoRemove = async () => {
    if (!userId) return
    
    const res = await fetch(`/api/customers/${userId}/avatar`, {
      method: 'DELETE',
    })
    
    if (res.ok) {
      setUser(prev => prev ? { ...prev, avatar_url: undefined } : null)
    } else {
      throw new Error('Failed to remove photo')
    }
  }

  const handleSavePersonalInfo = async () => {
    if (!userId) return
    
    setSaving(true)
    try {
      const fullName = `${personalInfo.firstName} ${personalInfo.lastName}`.trim()
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone: personalInfo.phone,
        }),
      })
      
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        alert('Personal information updated successfully')
      } else {
        alert('Failed to update personal information')
      }
    } catch (error) {
      console.error('Error saving personal info:', error)
      alert('Failed to update personal information')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAddress = async () => {
    if (!userId) return
    
    setSaving(true)
    try {
      const url = editingAddress
        ? `/api/customers/${userId}/addresses/${editingAddress.id}`
        : `/api/customers/${userId}/addresses`
      
      const res = await fetch(url, {
        method: editingAddress ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm),
      })
      
      if (res.ok) {
        await loadProfileData()
        setAddressDialogOpen(false)
        setEditingAddress(null)
        setAddressForm({
          street_address: '',
          apt_suite: '',
          city: '',
          state: '',
          zip_code: '',
          is_default: false,
        })
      } else {
        alert('Failed to save address')
      }
    } catch (error) {
      console.error('Error saving address:', error)
      alert('Failed to save address')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!userId || !confirm('Are you sure you want to delete this address?')) return
    
    try {
      const res = await fetch(`/api/customers/${userId}/addresses/${addressId}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        await loadProfileData()
      } else {
        alert('Failed to delete address')
      }
    } catch (error) {
      console.error('Error deleting address:', error)
      alert('Failed to delete address')
    }
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setAddressForm({
      street_address: address.street_address,
      apt_suite: address.apt_suite || '',
      city: address.city,
      state: address.state,
      zip_code: address.zip_code,
      is_default: address.is_default,
    })
    setAddressDialogOpen(true)
  }

  const handleAddAddress = () => {
    setEditingAddress(null)
    setAddressForm({
      street_address: '',
      apt_suite: '',
      city: '',
      state: '',
      zip_code: '',
      is_default: false,
    })
    setAddressDialogOpen(true)
  }

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    if (!userId || !confirm('Are you sure you want to remove this payment method?')) return
    
    try {
      const res = await fetch(`/api/customers/${userId}/payment-methods?paymentMethodId=${paymentMethodId}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        await loadProfileData()
      } else {
        alert('Failed to remove payment method')
      }
    } catch (error) {
      console.error('Error deleting payment method:', error)
      alert('Failed to remove payment method')
    }
  }

  const handleAddPaymentMethod = () => {
    // In a real app, this would integrate with Stripe Elements or similar
    // For now, we'll show a placeholder dialog
    alert('Payment method integration coming soon. This would typically use Stripe Elements.')
  }

  const handleSavePreferences = async () => {
    if (!userId) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${userId}/preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })
      
      if (res.ok) {
        alert('Preferences updated successfully')
      } else {
        alert('Failed to update preferences')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      alert('Failed to update preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <DashboardNav userType="customer" userName="User" />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <EnsureDashboardUser />
      <DashboardNav userType="customer" userName={user?.full_name || 'User'} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
          
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList>
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
              <TabsTrigger value="payment">Payment Methods</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
                <div className="space-y-6">
                  <PhotoUpload
                    currentPhoto={user?.avatar_url}
                    onUpload={handlePhotoUpload}
                    onRemove={handlePhotoRemove}
                    label="Profile Photo"
                    size="lg"
                  />
                  
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSavePersonalInfo(); }}>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={personalInfo.firstName}
                          onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={personalInfo.lastName}
                          onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={personalInfo.email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-sm text-muted-foreground">Email cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={personalInfo.phone}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </form>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="addresses">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Saved Addresses</h2>
                  <Button onClick={handleAddAddress}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Address
                  </Button>
                </div>
                <div className="space-y-4">
                  {addresses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No addresses saved. Add your first address to get started.
                    </div>
                  ) : (
                    addresses.map((address) => (
                      <Card key={address.id} className={`p-4 ${address.is_default ? 'border-primary' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {address.is_default && (
                              <Badge variant="default" className="mb-2">Default</Badge>
                            )}
                            <div className="font-medium mb-1 flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {address.street_address}
                              {address.apt_suite && `, ${address.apt_suite}`}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {address.city}, {address.state} {address.zip_code}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditAddress(address)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAddress(address.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="payment">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Payment Methods</h2>
                  <Button onClick={handleAddPaymentMethod}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </Button>
                </div>
                <div className="space-y-4">
                  {paymentMethods.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No payment methods saved. Add a payment method to make bookings easier.
                    </div>
                  ) : (
                    paymentMethods.map((method) => (
                      <Card key={method.id} className={`p-4 ${method.is_default ? 'border-primary' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-16 rounded bg-muted flex items-center justify-center text-xs font-medium">
                              {method.brand?.toUpperCase() || method.type.toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                •••• {method.last4}
                                {method.is_default && (
                                  <Badge variant="default" className="ml-2">Default</Badge>
                                )}
                              </div>
                              {method.expiry_month && method.expiry_year && (
                                <div className="text-sm text-muted-foreground">
                                  Expires {String(method.expiry_month).padStart(2, '0')}/{String(method.expiry_year).slice(-2)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePaymentMethod(method.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="preferences">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Cleaning Preferences</h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Special Instructions</Label>
                    <Textarea
                      placeholder="Any special requirements or notes for cleaners..."
                      value={preferences.special_instructions || ''}
                      onChange={(e) => setPreferences({ ...preferences, special_instructions: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preferred Cleaning Time</Label>
                    <Select
                      value={preferences.preferred_cleaning_time || ''}
                      onValueChange={(value) => setPreferences({ ...preferences, preferred_cleaning_time: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select preferred time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning (8 AM - 12 PM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (12 PM - 5 PM)</SelectItem>
                        <SelectItem value="evening">Evening (5 PM - 8 PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="ecoFriendly"
                        checked={preferences.eco_friendly}
                        onCheckedChange={(checked) => setPreferences({ ...preferences, eco_friendly: checked as boolean })}
                      />
                      <Label htmlFor="ecoFriendly" className="font-normal cursor-pointer">
                        Prefer eco-friendly cleaning products
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="petFriendly"
                        checked={preferences.pet_friendly}
                        onCheckedChange={(checked) => setPreferences({ ...preferences, pet_friendly: checked as boolean })}
                      />
                      <Label htmlFor="petFriendly" className="font-normal cursor-pointer">
                        Pet-friendly products required
                      </Label>
                    </div>
                  </div>
                  <Button onClick={handleSavePreferences} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </h2>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="notifEmail" className="text-base">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive booking confirmations and updates via email
                        </p>
                      </div>
                      <Checkbox
                        id="notifEmail"
                        checked={preferences.notification_email}
                        onCheckedChange={(checked) => setPreferences({ ...preferences, notification_email: checked as boolean })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="notifSMS" className="text-base">SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive text messages for important updates
                        </p>
                      </div>
                      <Checkbox
                        id="notifSMS"
                        checked={preferences.notification_sms}
                        onCheckedChange={(checked) => setPreferences({ ...preferences, notification_sms: checked as boolean })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="notifPush" className="text-base">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive push notifications on your device
                        </p>
                      </div>
                      <Checkbox
                        id="notifPush"
                        checked={preferences.notification_push}
                        onCheckedChange={(checked) => setPreferences({ ...preferences, notification_push: checked as boolean })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleSavePreferences} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Notification Settings'}
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Address Dialog */}
      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
            <DialogDescription>
              {editingAddress ? 'Update your address information' : 'Add a new address for your bookings'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={addressForm.street_address}
                onChange={(e) => setAddressForm({ ...addressForm, street_address: e.target.value })}
                placeholder="123 Main St"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apt">Apt/Suite (Optional)</Label>
              <Input
                id="apt"
                value={addressForm.apt_suite}
                onChange={(e) => setAddressForm({ ...addressForm, apt_suite: e.target.value })}
                placeholder="Apt 4B"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  placeholder="Boston"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  placeholder="MA"
                  maxLength={2}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">Zip Code</Label>
              <Input
                id="zip"
                value={addressForm.zip_code}
                onChange={(e) => setAddressForm({ ...addressForm, zip_code: e.target.value })}
                placeholder="02101"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="defaultAddress"
                checked={addressForm.is_default}
                onCheckedChange={(checked) => setAddressForm({ ...addressForm, is_default: checked as boolean })}
              />
              <Label htmlFor="defaultAddress" className="font-normal cursor-pointer">
                Set as default address
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddressDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAddress} disabled={saving}>
              {saving ? 'Saving...' : 'Save Address'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
