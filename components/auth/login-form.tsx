'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createAnonSupabase } from '@/lib/supabase'

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSocialLoading, setIsSocialLoading] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

      // Use client-side Supabase for immediate session availability
      const supabase = createAnonSupabase()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
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

      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
        localStorage.setItem('rememberedEmail', email.trim())
      } else {
        localStorage.removeItem('rememberMe')
        localStorage.removeItem('rememberedEmail')
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

  const handleSocialLogin = async (provider: 'google' | 'microsoft') => {
    try {
      setError(null)
      setIsSocialLoading(provider)

      const supabase = createAnonSupabase()
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (oauthError) {
        setError(`Failed to sign in with ${provider}. Please try again.`)
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
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/reset-password" className="text-sm text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
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
          Remember me
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
        >
          {isSocialLoading === 'google' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            'Google'
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
            'Microsoft'
          )}
        </Button>
      </div>
    </form>
  )
}
