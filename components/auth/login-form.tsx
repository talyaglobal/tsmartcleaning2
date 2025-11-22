'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createAnonSupabase } from '@/lib/supabase'

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSocialLoading, setIsSocialLoading] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getRedirectPath = (role: string | undefined): string => {
    if (!role) return '/customer'
    
    // Map role strings to dashboard paths
    const roleMap: Record<string, string> = {
      'root_admin': '/root-admin',
      'partner_admin': '/admin',
      'regional_manager': '/admin',
      'admin': '/admin',
      'cleaning_company': '/company/dashboard',
      'provider': '/provider',
      'cleaning_lady': '/cleaner/dashboard',
      'ambassador': '/ambassador/dashboard',
      'ngo_agency': '/ngo',
      'tsmart_team': '/admin',
    }
    
    return roleMap[role] || '/customer'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Validate inputs
      if (!email || !password) {
        setError('Please enter both email and password.')
        setIsLoading(false)
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        setError('Please enter a valid email address.')
        setIsLoading(false)
        return
      }

      // Use client-side Supabase for immediate session availability
      const supabase = createAnonSupabase()
      
      // Configure session persistence based on remember me
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
        options: {
          // When remember me is checked, we'll use longer session duration
          // Supabase handles this via localStorage persistence (already configured)
          // The session will persist across browser sessions when remember me is true
        }
      })

      if (signInError || !data.session || !data.user) {
        // Handle specific error cases
        const errorMessage = signInError?.message || 'Invalid email or password.'
        
        if (errorMessage.includes('Email not confirmed')) {
          setError('Please verify your email address before logging in.')
        } else if (errorMessage.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.')
        } else if (errorMessage.includes('Too many requests')) {
          setError('Too many login attempts. Please try again later.')
        } else {
          setError(errorMessage || 'An error occurred during login. Please try again.')
        }
        setIsLoading(false)
        return
      }

      // Store remember me preference and session info
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
        localStorage.setItem('rememberedEmail', email.trim())
        // Store session expiration preference (30 days for remember me)
        if (data.session) {
          localStorage.setItem('sessionExpiresAt', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
        }
      } else {
        localStorage.removeItem('rememberMe')
        localStorage.removeItem('rememberedEmail')
        localStorage.removeItem('sessionExpiresAt')
      }

      // Get user role from session
      const role = data.user?.user_metadata?.role

      // Redirect based on role
      const redirectPath = getRedirectPath(role)
      router.push(redirectPath)
      router.refresh() // Refresh to update auth state
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred. Please try again later.')
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'microsoft' | 'apple' | 'github') => {
    try {
      setError(null)
      setIsSocialLoading(provider)

      // Store remember me preference for OAuth callback
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
        localStorage.setItem('rememberedEmail', email.trim() || '')
      }

      const supabase = createAnonSupabase()
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            // Pass remember me preference through OAuth flow
            ...(rememberMe ? { remember_me: 'true' } : {}),
          },
        },
      })

      if (oauthError) {
        setError(`Failed to sign in with ${provider}. ${oauthError.message || 'Please try again.'}`)
        setIsSocialLoading(null)
        return
      }

      // OAuth redirect will happen automatically
      // The callback page will handle the rest
    } catch (err) {
      console.error('Social login error:', err)
      setError(`Failed to sign in with ${provider}. Please try again.`)
      setIsSocialLoading(null)
    }
  }

  // Load remembered email on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const remembered = localStorage.getItem('rememberMe')
      const rememberedEmail = localStorage.getItem('rememberedEmail')
      if (remembered === 'true' && rememberedEmail) {
        setRememberMe(true)
        setEmail(rememberedEmail)
      }
    }
  }, [])

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            // Clear error when user starts typing
            if (error) setError(null)
          }}
          required
          disabled={isLoading}
          autoComplete="email"
          autoFocus
          aria-describedby={error ? "email-error" : undefined}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/reset-password" className="text-sm text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              // Clear error when user starts typing
              if (error) setError(null)
            }}
            required
            disabled={isLoading}
            autoComplete="current-password"
            className="pr-10"
            aria-describedby={error ? "password-error" : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="remember-me"
          checked={rememberMe}
          onCheckedChange={(checked) => setRememberMe(checked === true)}
          disabled={isLoading}
        />
        <Label
          htmlFor="remember-me"
          className="text-sm font-normal cursor-pointer"
        >
          Remember me for 30 days
        </Label>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logging in...
          </>
        ) : (
          'Log in'
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
          onClick={() => handleSocialLogin('google')}
          disabled={isLoading || isSocialLoading !== null}
          className="relative"
        >
          {isSocialLoading === 'google' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
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
            </>
          )}
        </Button>
        <Button
          variant="outline"
          type="button"
          onClick={() => handleSocialLogin('microsoft')}
          disabled={isLoading || isSocialLoading !== null}
        >
          {isSocialLoading === 'microsoft' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M0 0h11.377v11.372H0z" fill="#f25022" />
                <path d="M12.623 0H24v11.372H12.623z" fill="#00a4ef" />
                <path d="M0 12.628h11.377V24H0z" fill="#7fba00" />
                <path d="M12.623 12.628H24V24H12.623z" fill="#ffb900" />
              </svg>
              Microsoft
            </>
          )}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => handleSocialLogin('apple')}
          disabled={isLoading || isSocialLoading !== null}
        >
          {isSocialLoading === 'apple' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Apple
            </>
          )}
        </Button>
        <Button
          variant="outline"
          type="button"
          onClick={() => handleSocialLogin('github')}
          disabled={isLoading || isSocialLoading !== null}
        >
          {isSocialLoading === 'github' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
