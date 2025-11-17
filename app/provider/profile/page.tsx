import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Star, Shield, CheckCircle2 } from 'lucide-react'
import { StripeOnboarding } from '@/components/providers/StripeOnboarding'
import { OnboardingChecklist } from '@/components/auth/OnboardingChecklist'

export default function ProviderProfilePage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav userType="provider" userName="Sarah Johnson" />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Provider Profile</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
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

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Services Offered</h2>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-sm py-1.5 px-3">
                  Residential Cleaning
                </Badge>
                <Badge variant="secondary" className="text-sm py-1.5 px-3">
                  Commercial Cleaning
                </Badge>
                <Badge variant="secondary" className="text-sm py-1.5 px-3">
                  Deep Cleaning
                </Badge>
                <Badge variant="secondary" className="text-sm py-1.5 px-3">
                  Move-In/Out Cleaning
                </Badge>
                <Badge variant="secondary" className="text-sm py-1.5 px-3">
                  Carpet Cleaning
                </Badge>
                <Button variant="outline" size="sm" className="h-8">
                  + Add Service
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column - Stats & Verification */}
          <div className="space-y-6">
            <StripeOnboarding providerId="demo-provider-1" />
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
      </div>
    </div>
  )
}
