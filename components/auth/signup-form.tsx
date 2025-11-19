'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle, AlertCircle, Mail } from 'lucide-react'
import Link from 'next/link'
import { createAnonSupabase } from '@/lib/supabase'

type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong'

function calculatePasswordStrength(password: string): { strength: PasswordStrength; score: number; feedback: string[] } {
  let score = 0
  const feedback: string[] = []

  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('At least 8 characters')
  }

  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('One lowercase letter')
  }

  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('One uppercase letter')
  }

  if (/[0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('One number')
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('One special character')
  }

  if (password.length >= 12) {
    score += 1
  }

  let strength: PasswordStrength = 'weak'
  if (score >= 5) {
    strength = 'strong'
  } else if (score >= 4) {
    strength = 'good'
  } else if (score >= 3) {
    strength = 'fair'
  }

  return { strength, score, feedback }
}

export function SignupForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
    acceptedTerms: false
  })
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [referralCodeError, setReferralCodeError] = useState<string | null>(null)
  const [referralCodeValidating, setReferralCodeValidating] = useState(false)
  const [referralCodeValid, setReferralCodeValid] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showEmailVerification, setShowEmailVerification] = useState(false)

  const passwordStrength = useMemo(() => {
    if (!formData.password) return null
    return calculatePasswordStrength(formData.password)
  }, [formData.password])

  // Validate referral code when it changes
  useEffect(() => {
    const validateReferralCode = async () => {
      const code = formData.referralCode.trim()
      if (!code) {
        setReferralCodeValid(null)
        setReferralCodeError(null)
        return
      }

      setReferralCodeValidating(true)
      setReferralCodeError(null)

      try {
        const response = await fetch('/api/referral/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referralCode: code }),
        })

        const data = await response.json()

        if (data.valid) {
          setReferralCodeValid(true)
          setReferralCodeError(null)
        } else {
          setReferralCodeValid(false)
          setReferralCodeError(data.error || 'Invalid referral code')
        }
      } catch (err) {
        setReferralCodeValid(false)
        setReferralCodeError('Failed to validate referral code')
      } finally {
        setReferralCodeValidating(false)
      }
    }

    // Debounce validation
    const timeoutId = setTimeout(validateReferralCode, 500)
    return () => clearTimeout(timeoutId)
  }, [formData.referralCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setError(null)
    setShowEmailVerification(false)
    
    // Validate terms acceptance
    if (!formData.acceptedTerms) {
      setError('You must accept the Terms of Service and Privacy Policy to continue')
      return
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    // Validate password strength
    if (formData.password && passwordStrength && passwordStrength.strength === 'weak') {
      setPasswordError('Please use a stronger password')
      return
    }

    // Validate referral code if provided
    if (formData.referralCode.trim() && referralCodeValid === false) {
      setReferralCodeError('Please enter a valid referral code or leave it blank')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          role: 'customer',
          referralCode: formData.referralCode.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Signup failed. Please try again.')
        setIsLoading(false)
        return
      }

      // Check if email verification is required
      if (data.requiresEmailVerification) {
        setShowEmailVerification(true)
      } else {
        // Redirect to customer dashboard if no verification needed
        router.push('/customer')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Signup error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialSignup = async (provider: 'google' | 'microsoft') => {
    try {
      // Store referral code in localStorage to retrieve after OAuth callback
      if (formData.referralCode.trim()) {
        localStorage.setItem('pending_referral_code', formData.referralCode.trim().toUpperCase())
      }

      const supabase = createAnonSupabase()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        localStorage.removeItem('pending_referral_code')
        setError(`Failed to sign in with ${provider}. Please try again.`)
      }
      // OAuth redirect will happen automatically
    } catch (err) {
      localStorage.removeItem('pending_referral_code')
      setError(`Failed to sign in with ${provider}. Please try again.`)
      console.error('Social signup error:', err)
    }
  }

  const getStrengthColor = (strength: PasswordStrength | null) => {
    if (!strength) return 'bg-muted'
    switch (strength) {
      case 'weak':
        return 'bg-red-500'
      case 'fair':
        return 'bg-yellow-500'
      case 'good':
        return 'bg-blue-500'
      case 'strong':
        return 'bg-green-500'
    }
  }

  const getStrengthLabel = (strength: PasswordStrength | null) => {
    if (!strength) return ''
    switch (strength) {
      case 'weak':
        return 'Weak'
      case 'fair':
        return 'Fair'
      case 'good':
        return 'Good'
      case 'strong':
        return 'Strong'
    }
  }

  // Show email verification message
  if (showEmailVerification) {
    return (
      <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
        <Mail className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          <p className="font-semibold mb-2">Check your email!</p>
          <p className="mb-2">
            We've sent a verification link to <strong>{formData.email}</strong>
          </p>
          <p className="text-sm">
            Please click the link in the email to verify your account and complete your registration.
          </p>
          <p className="text-sm mt-2">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              type="button"
              onClick={() => setShowEmailVerification(false)}
              className="underline font-medium"
            >
              try again
            </button>
          </p>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            placeholder="John"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            placeholder="Doe"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Create a strong password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          disabled={isLoading}
        />
        {formData.password && passwordStrength && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Password strength:</span>
              <span className={`font-medium ${
                passwordStrength.strength === 'strong' ? 'text-green-600' :
                passwordStrength.strength === 'good' ? 'text-blue-600' :
                passwordStrength.strength === 'fair' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {getStrengthLabel(passwordStrength.strength)}
              </span>
            </div>
            <Progress 
              value={(passwordStrength.score / 6) * 100} 
              className="h-1"
            />
            {passwordStrength.feedback.length > 0 && (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="font-medium">Requirements:</p>
                <ul className="space-y-1">
                  {passwordStrength.feedback.map((req, index) => (
                    <li key={index} className="flex items-center gap-1">
                      <XCircle className="h-3 w-3 text-red-500" />
                      {req}
                    </li>
                  ))}
                  {passwordStrength.score >= 1 && passwordStrength.score < 6 && (
                    <li className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      {6 - passwordStrength.score} more requirement{6 - passwordStrength.score !== 1 ? 's' : ''} needed
                    </li>
                  )}
                </ul>
              </div>
            )}
            {passwordStrength.score >= 5 && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                Strong password!
              </div>
            )}
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          required
          disabled={isLoading}
        />
        {formData.confirmPassword && formData.password && (
          <div className="flex items-center gap-1 text-xs">
            {formData.password === formData.confirmPassword ? (
              <>
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span className="text-green-600">Passwords match</span>
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 text-red-500" />
                <span className="text-red-600">Passwords do not match</span>
              </>
            )}
          </div>
        )}
        {passwordError && (
          <p className="text-sm text-red-600">{passwordError}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="referralCode">Referral Code (Optional)</Label>
        <div className="relative">
          <Input
            id="referralCode"
            placeholder="Enter referral code"
            value={formData.referralCode}
            onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
            disabled={isLoading}
            className={referralCodeValid === false ? 'border-red-500' : referralCodeValid === true ? 'border-green-500' : ''}
          />
          {referralCodeValidating && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {referralCodeValid === true && !referralCodeValidating && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
          )}
          {referralCodeValid === false && !referralCodeValidating && (
            <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
          )}
        </div>
        {referralCodeError && (
          <p className="text-sm text-red-600">{referralCodeError}</p>
        )}
        {referralCodeValid === true && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Valid referral code
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Have a referral code? Enter it here to get rewards for both you and your referrer.
        </p>
      </div>
      <div className="flex items-start space-x-2">
        <Checkbox
          id="terms"
          checked={formData.acceptedTerms}
          onCheckedChange={(checked) => 
            setFormData({ ...formData, acceptedTerms: checked === true })
          }
          disabled={isLoading}
        />
        <Label 
          htmlFor="terms" 
          className="text-sm font-normal leading-relaxed cursor-pointer"
        >
          I agree to the{' '}
          <Link href="/terms" className="underline hover:text-foreground" target="_blank">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-foreground" target="_blank">
            Privacy Policy
          </Link>
        </Label>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading || !formData.acceptedTerms}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create account'
        )}
      </Button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Button 
          variant="outline" 
          type="button"
          onClick={() => handleSocialSignup('google')}
          disabled={isLoading}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </Button>
        <Button 
          variant="outline" 
          type="button"
          onClick={() => handleSocialSignup('microsoft')}
          disabled={isLoading}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M0 0h11.377v11.372H0z" fill="#f25022" />
            <path d="M12.623 0H24v11.372H12.623z" fill="#00a4ef" />
            <path d="M0 12.628h11.377V24H0z" fill="#7fba00" />
            <path d="M12.623 12.628H24V24H12.623z" fill="#ffb900" />
          </svg>
          Microsoft
        </Button>
      </div>
    </form>
  )
}
