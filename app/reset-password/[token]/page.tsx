'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BrandLogoClient } from '@/components/BrandLogoClient'
import Link from 'next/link'
import { Loader2, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react'
import { createAnonSupabase } from '@/lib/supabase'

function ResetPasswordTokenContent() {
  const router = useRouter()
  const params = useParams()
  const token = params?.token as string
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState<'validating' | 'reset' | 'success' | 'error'>('validating')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Reset token is missing')
        setStep('error')
        return
      }

      try {
        const supabase = createAnonSupabase()

        // Try to verify the recovery token
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'recovery',
        })

        if (verifyError || !data.session) {
          // If token hash verification fails, try as a code
          try {
            const { data: codeData, error: codeError } = await supabase.auth.exchangeCodeForSession(token)
            
            if (codeError || !codeData.session) {
              setError('Invalid or expired reset token. Please request a new password reset link.')
              setStep('error')
              return
            }

            // Token is valid, allow password reset
            setStep('reset')
          } catch (err: any) {
            console.error('Token validation error:', err)
            setError('Invalid or expired reset token. Please request a new password reset link.')
            setStep('error')
          }
        } else {
          // Token is valid, allow password reset
          setStep('reset')
        }
      } catch (err: any) {
        console.error('Token validation error:', err)
        setError('Failed to validate reset token. Please try again.')
        setStep('error')
      }
    }

    if (token) {
      validateToken()
    }
  }, [token])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (!token) {
      setError('Reset token is missing. Please use the link from your email.')
      return
    }

    setIsLoading(true)

    try {
      // First verify and exchange the token for a session
      const supabase = createAnonSupabase()
      
      let session = null
      
      // Try token hash first
      const { data: tokenData, error: tokenError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery',
      })

      if (!tokenError && tokenData.session) {
        session = tokenData.session
      } else {
        // Try as code
        const { data: codeData, error: codeError } = await supabase.auth.exchangeCodeForSession(token)
        
        if (codeError || !codeData.session) {
          throw new Error('Invalid or expired reset token. Please request a new password reset link.')
        }
        
        session = codeData.session
      }

      // Now update the password using the session
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        throw new Error(updateError.message || 'Failed to reset password. Please try again.')
      }

      setStep('success')
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.')
      setIsLoading(false)
    }
  }

  if (step === 'validating') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            <CardTitle>Validating reset token</CardTitle>
            <CardDescription>
              Please wait while we validate your password reset link...
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

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Password reset successful</CardTitle>
            <CardDescription>
              Your password has been reset successfully. Redirecting you to login...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link href="/login">Continue to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2 mb-4">
              <BrandLogoClient className="h-8" />
            </div>
            <CardTitle>Invalid reset link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired
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
                <Link href="/reset-password">
                  Request new reset link
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

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2 mb-4">
            <BrandLogoClient className="h-8" />
          </div>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting password...
                </>
              ) : (
                'Reset password'
              )}
            </Button>
            <Button variant="ghost" className="w-full" asChild>
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordTokenPage() {
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
      <ResetPasswordTokenContent />
    </Suspense>
  )
}

