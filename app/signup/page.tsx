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
            <h1 className="text-3xl font-bold mb-2">Create your account</h1>
            <p className="text-muted-foreground">
              Get started with TSmartCleaning today
            </p>
          </div>
          
          <SignupForm />
          
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
            Join Thousands of Happy Customers
          </h2>
          <p className="text-muted-foreground">
            Book professional cleaning services in minutes. Trusted by over 10,000 customers nationwide.
          </p>
        </div>
      </div>
    </div>
  )
}
