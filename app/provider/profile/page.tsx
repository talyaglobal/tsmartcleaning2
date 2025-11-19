'use client'

import { useState, useEffect } from 'react'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Star, Shield, CheckCircle2 } from 'lucide-react'
import { StripeOnboarding } from '@/components/providers/StripeOnboarding'
import { OnboardingChecklist } from '@/components/auth/OnboardingChecklist'
import { PhotoUpload } from '@/components/providers/PhotoUpload'
import { ServiceManager } from '@/components/providers/ServiceManager'
import { ProviderAvailabilityManager } from '@/components/providers/ProviderAvailabilityManager'
import { PortfolioManager } from '@/components/providers/PortfolioManager'

interface Service {
  id?: string
  name: string
  category: string
  description?: string
  price?: number
  priceUnit?: 'per_hour' | 'per_sqft' | 'flat_rate'
}

interface PortfolioItem {
  id?: string
  imageUrl: string
  title?: string
  description?: string
}

export default function ProviderProfilePage() {
  const [providerId, setProviderId] = useState<string | null>(null)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)

  // Mock provider ID - in production, get from auth context
  useEffect(() => {
    // TODO: Get actual provider ID from auth
    setProviderId('demo-provider-1')
    loadProfileData()
  }, [])

  const loadProfileData = async () => {
    if (!providerId) return

    try {
      // Load services
      const servicesRes = await fetch(`/api/provider/services?providerId=${providerId}`)
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json()
        setServices(servicesData.services || [])
      }

      // Load portfolio
      const portfolioRes = await fetch(`/api/provider/portfolio?providerId=${providerId}`)
      if (portfolioRes.ok) {
        const portfolioData = await portfolioRes.json()
        setPortfolio(portfolioData.items || [])
      }
    } catch (error) {
      console.error('Error loading profile data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (file: File) => {
    if (!providerId) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('providerId', providerId)

    const res = await fetch('/api/provider/profile/photo', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to upload photo')
    }

    const data = await res.json()
    setProfilePhoto(data.photoUrl)
  }

  const handlePhotoRemove = async () => {
    if (!providerId) return

    const res = await fetch(`/api/provider/profile/photo?providerId=${providerId}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to remove photo')
    }

    setProfilePhoto(null)
  }

  const handleAddService = async (service: Omit<Service, 'id'>) => {
    if (!providerId) return

    const res = await fetch('/api/provider/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId, service }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to add service')
    }

    await loadProfileData()
  }

  const handleUpdateService = async (id: string, service: Omit<Service, 'id'>) => {
    const res = await fetch('/api/provider/services', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId: id, service }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to update service')
    }

    await loadProfileData()
  }

  const handleRemoveService = async (id: string) => {
    const res = await fetch(`/api/provider/services?serviceId=${id}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to remove service')
    }

    await loadProfileData()
  }

  const handleAddPortfolio = async (
    item: Omit<PortfolioItem, 'id' | 'imageUrl'>,
    file: File
  ) => {
    if (!providerId) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('providerId', providerId)
    if (item.title) formData.append('title', item.title)
    if (item.description) formData.append('description', item.description)

    const res = await fetch('/api/provider/portfolio', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to add portfolio item')
    }

    await loadProfileData()
  }

  const handleUpdatePortfolio = async (
    id: string,
    item: Omit<PortfolioItem, 'id' | 'imageUrl'>,
    file?: File
  ) => {
    if (!providerId) return

    if (file) {
      // If file is provided, need to upload new image first
      // For now, we'll handle text updates only
      const res = await fetch('/api/provider/portfolio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, itemId: id, ...item }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update portfolio item')
      }
    } else {
      const res = await fetch('/api/provider/portfolio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, itemId: id, ...item }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update portfolio item')
      }
    }

    await loadProfileData()
  }

  const handleRemovePortfolio = async (id: string) => {
    if (!providerId) return

    const res = await fetch(`/api/provider/portfolio?providerId=${providerId}&itemId=${id}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to remove portfolio item')
    }

    await loadProfileData()
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav userType="provider" userName="Sarah Johnson" />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Provider Profile</h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="services">Services & Pricing</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Profile Info */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Profile Photo</h2>
                  <PhotoUpload
                    currentPhoto={profilePhoto || undefined}
                    onUpload={handlePhotoUpload}
                    onRemove={handlePhotoRemove}
                    size="lg"
                  />
                </Card>

                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Business Information</h2>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input id="businessName" defaultValue="Sparkle Clean Co." />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" defaultValue="Sarah" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" defaultValue="Johnson" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" defaultValue="sarah@sparkleclean.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" type="tel" defaultValue="(555) 987-6543" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Business Description</Label>
                      <Textarea
                        id="description"
                        defaultValue="Professional cleaning services with 10+ years of experience. Specializing in residential and commercial cleaning."
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experience">Years of Experience</Label>
                      <Input id="experience" type="number" defaultValue="10" />
                    </div>
                    <Button>Save Changes</Button>
                  </form>
                </Card>
              </div>

              {/* Right Column - Stats & Verification */}
              <div className="space-y-6">
                <StripeOnboarding providerId={providerId || 'demo-provider-1'} />
                <OnboardingChecklist userId="demo-provider-user-1" tier="premium" />
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Performance Stats</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">4.9</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Jobs Completed</span>
                      <span className="font-semibold">48</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Response Rate</span>
                      <span className="font-semibold">98%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">On-Time Rate</span>
                      <span className="font-semibold">100%</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-primary/5 border-primary">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Premium Provider</h3>
                      <p className="text-sm text-muted-foreground">
                        You're a verified premium provider with full platform benefits.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <Card className="p-6">
              <ServiceManager
                services={services}
                onAdd={handleAddService}
                onUpdate={handleUpdateService}
                onRemove={handleRemoveService}
              />
            </Card>
          </TabsContent>

          <TabsContent value="availability" className="space-y-6">
            <ProviderAvailabilityManager providerId={providerId} />
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-6">
            <Card className="p-6">
              <PortfolioManager
                items={portfolio}
                onAdd={handleAddPortfolio}
                onUpdate={handleUpdatePortfolio}
                onRemove={handleRemovePortfolio}
              />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
