import { LoginForm } from '@/components/auth/login-form'
import Link from 'next/link'
import Image from 'next/image'
import { BrandLogo } from '@/components/BrandLogo'
import { getTenantIdFromHeaders } from '@/lib/tenant-server'
import { loadBranding } from '@/lib/tenant'

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
            <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
            <p className="text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>
          
          <LoginForm />
          
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link href="/signup" className="text-primary hover:underline font-medium">
              Sign up
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
            Professional Cleaning Made Simple
          </h2>
          <p className="text-muted-foreground">
            Connect with verified cleaning professionals or grow your cleaning business with our platform.
          </p>
        </div>
      </div>
    </div>
  )
}
