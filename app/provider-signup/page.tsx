import { ProviderSignupForm } from '@/components/auth/provider-signup-form'
import Link from 'next/link'
import Image from 'next/image'
import { BrandLogo } from '@/components/BrandLogo'
import { getTenantIdFromHeaders } from '@/lib/tenant-server'
import { loadBranding } from '@/lib/tenant'

export default async function ProviderSignupPage() {
  const tenantId = await getTenantIdFromHeaders()
  const branding = await loadBranding(tenantId)
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-2xl">
          <div className="mb-8">
            <BrandLogo className="mb-8" />
            <h1 className="text-3xl font-bold mb-2">Become a Provider</h1>
            <p className="text-muted-foreground">
              Join our network of professional cleaning service providers
            </p>
          </div>
          
          <ProviderSignupForm />
          
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login" className="text-primary hover:underline font-medium">
              Log in
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Image/Brand */}
      <div className="hidden lg:flex flex-1 bg-primary/5 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 overflow-hidden">
            <Image
              src={branding.logoUrl}
              alt="Logo"
              width={160}
              height={28}
            />
          </div>
          <h2 className="text-2xl font-bold mb-4">
            Grow Your Cleaning Business
          </h2>
          <p className="text-muted-foreground">
            Connect with customers, manage bookings, and grow your revenue with our comprehensive platform.
          </p>
        </div>
      </div>
    </div>
  )
}
