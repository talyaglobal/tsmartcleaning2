import { SignupForm } from '@/components/auth/signup-form'
import Link from 'next/link'
import Image from 'next/image'
import { BrandLogo } from '@/components/BrandLogo'
import { getTenantIdFromHeaders } from '@/lib/tenant-server'
import { loadBranding } from '@/lib/tenant'

export default async function SignupPage() {
  const tenantId = await getTenantIdFromHeaders()
  const branding = await loadBranding(tenantId)
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <BrandLogo className="mb-8" />
            <h1 className="heading_h1 mb-2">Create your account</h1>
            <p className="paragraph_small text-color_secondary">
              Get started with TSmartCleaning today
            </p>
          </div>
          
          <SignupForm />
          
          <div className="mt-6 text-align_center paragraph_small">
            <span className="text-color_secondary">Already have an account? </span>
            <Link href="/login" className="text-link">
              Log in
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Image/Brand */}
      <div className="hidden lg:flex flex-1 bg-primary/5 items-center justify-center p-12">
        <div className="max-w-md text-align_center">
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 overflow-hidden">
            <Image
              src={branding.logoUrl}
              alt="Logo"
              width={160}
              height={28}
            />
          </div>
          <h2 className="heading_h2 mb-4">
            Join Thousands of Happy Customers
          </h2>
          <p className="paragraph_small text-color_secondary">
            Book professional cleaning services in minutes. Trusted by over 10,000 customers nationwide.
          </p>
        </div>
      </div>
    </div>
  )
}
