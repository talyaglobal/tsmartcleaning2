'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createAnonSupabase } from '@/lib/supabase'
import { Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createAnonSupabase()
        
        // Get the code from URL
        const code = searchParams?.get('code')
        const errorParam = searchParams?.get('error')
        const errorDescription = searchParams?.get('error_description')

        if (errorParam) {
          setError(errorDescription || 'Authentication failed')
          setLoading(false)
          return
        }

        if (!code) {
          setError('No authorization code received')
          setLoading(false)
          return
        }

        // Exchange code for session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError || !data.session) {
          setError(exchangeError?.message || 'Failed to complete authentication')
          setLoading(false)
          return
        }

        // Get referral code from localStorage (stored before OAuth redirect) or URL
        const referralCode = typeof window !== 'undefined' 
          ? localStorage.getItem('pending_referral_code') || searchParams?.get('referral_code')
          : searchParams?.get('referral_code')

        // Clear referral code from localStorage after retrieving
        if (typeof window !== 'undefined' && localStorage.getItem('pending_referral_code')) {
          localStorage.removeItem('pending_referral_code')
        }

        // Ensure user profile exists and handle referral code via API
        if (data.user) {
          try {
            const response = await fetch('/api/auth/complete-social-signup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: data.user.id,
                email: data.user.email,
                fullName: data.user.user_metadata?.full_name || 
                         data.user.user_metadata?.name || 
                         data.user.email?.split('@')[0] || 
                         'User',
                role: data.user.user_metadata?.role || 'customer',
                referralCode: referralCode || null,
              }),
            })

            if (!response.ok) {
              console.error('Failed to complete profile setup')
            }
          } catch (err) {
            console.error('Profile setup error:', err)
          }
        }

        // Redirect based on user role
        const role = data.user?.user_metadata?.role || 'customer'
        if (role === 'admin' || role === 'root_admin') {
          router.push('/admin')
        } else if (role === 'provider' || role === 'cleaning_company') {
          router.push('/provider')
        } else {
          router.push('/customer')
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        setError('An unexpected error occurred')
        setLoading(false)
      }
    }

    handleCallback()
  }, [router, searchParams])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Completing sign in...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-2">Authentication Error</p>
            <p>{error}</p>
            <button
              onClick={() => router.push('/signup')}
              className="mt-4 text-sm underline"
            >
              Return to signup
            </button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return null
}

