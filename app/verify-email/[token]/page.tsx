'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BrandLogoClient } from '@/components/BrandLogoClient'
import Link from 'next/link'
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'
import { createAnonSupabase } from '@/lib/supabase'

function VerifyEmailTokenContent() {
  const router = useRouter()
  const params = useParams()
  const token = params?.token as string
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('Verification token is missing')
        setStatus('error')
        return
      }

      try {
        const supabase = createAnonSupabase()

        // Try to verify the token using Supabase's verifyOtp method
        // Email verification tokens from Supabase are typically in the format of a code
        // that needs to be exchanged via the callback, but we can also try direct verification
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email',
        })

        if (verifyError || !data.session) {
          // If direct token verification fails, try as a code
          // Sometimes Supabase sends codes instead of token hashes
          try {
            const { data: codeData, error: codeError } = await supabase.auth.exchangeCodeForSession(token)
            
            if (codeError || !codeData.session) {
              // If both fail, redirect to callback page with token as code parameter
              // This handles the case where Supabase sends a redirect with ?code=...
              setError('Invalid or expired verification token. Please request a new verification email.')
              setStatus('error')
              return
            }

            // Success with code exchange
            setStatus('success')
            
            // Store session if available
            if (codeData.session) {
              // The Supabase client should automatically handle session storage
              // Redirect after a short delay
              setTimeout(() => {
                router.push('/verify-email?verified=true')
              }, 2000)
            }
          } catch (err: any) {
            console.error('Email verification error:', err)
            setError(err.message || 'Failed to verify email. The link may have expired or already been used.')
            setStatus('error')
          }
        } else {
          // Success with token hash
          setStatus('success')
          
          // Store session if available
          if (data.session) {
            // The Supabase client should automatically handle session storage
            // Redirect after a short delay
            setTimeout(() => {
              router.push('/verify-email?verified=true')
            }, 2000)
          }
        }
      } catch (err: any) {
        console.error('Email verification error:', err)
        setError(err.message || 'Failed to verify email. Please try again.')
        setStatus('error')
      }
    }

    if (token) {
      verifyEmail()
    }
  }, [token, router])

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-blue-600 dark:bg-blue-400 animate-spin" />
            </div>
            <CardTitle>Verifying your email</CardTitle>
            <CardDescription>
              Please wait while we verify your email address...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                This may take a few moments.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Email verified successfully</CardTitle>
            <CardDescription>
              Your email has been verified. Redirecting you...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" asChild>
              <Link href="/login">Continue to login</Link>
            </Button>
            <Button variant="ghost" className="w-full" asChild>
              <Link href="/">Go to homepage</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2 mb-4">
            <BrandLogoClient className="h-8" />
          </div>
          <CardTitle>Verification failed</CardTitle>
          <CardDescription>
            We couldn't verify your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Button className="w-full" asChild>
              <Link href="/verify-email">
                Request new verification email
              </Link>
            </Button>
            <Button variant="ghost" className="w-full" asChild>
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailTokenPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-8 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyEmailTokenContent />
    </Suspense>
  )
}

