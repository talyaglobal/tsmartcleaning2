import { LoginForm } from '@/components/auth/login-form'
import Link from 'next/link'
import Image from 'next/image'
import { BrandLogo } from '@/components/BrandLogo'
import { getTenantIdFromHeaders } from '@/lib/tenant-server'
import { loadBranding } from '@/lib/tenant'
import { WebflowSection } from '@/components/webflow'

export default async function LoginPage() {
  const tenantId = await getTenantIdFromHeaders()
  const branding = await loadBranding(tenantId)
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <BrandLogo className="mb-8" />
            <h1 className="heading_h1 mb-2">Welcome back</h1>
            <p className="paragraph_small text-color_secondary">
              Enter your credentials to access your account
            </p>
          </div>
          
          <LoginForm />
          
          <div className="mt-6 text-align_center paragraph_small">
            <span className="text-color_secondary">Don't have an account? </span>
            <Link href="/signup" className="text-link">
              Sign up
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
            Professional Cleaning Made Simple
          </h2>
          <p className="paragraph_small text-color_secondary">
            Connect with verified cleaning professionals or grow your cleaning business with our platform.
          </p>
        </div>
      </div>
    </div>
  )
}
