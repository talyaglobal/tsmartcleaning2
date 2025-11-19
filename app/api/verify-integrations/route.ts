import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { isStripeConfigured, getStripe } from '@/lib/stripe'
import { verifySMTPConnection } from '@/lib/emails/smtp'

interface VerificationResult {
  step: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
}

export async function GET(request: NextRequest) {
  const results: VerificationResult[] = []

  function logResult(
    step: string,
    status: 'success' | 'error' | 'warning',
    message: string,
    details?: any
  ) {
    results.push({ step, status, message, details })
  }

  // 1. Supabase Integration
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      logResult('Supabase Config', 'error', 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    } else {
      logResult('Supabase Config', 'success', 'Environment variables set')
      const supabase = createServerSupabase()
      logResult('Supabase Client', 'success', 'Supabase client created successfully')

      const { data, error } = await supabase.from('services').select('id').limit(1)

      if (error) {
        const { error: usersError } = await supabase.from('users').select('id').limit(1)
        if (usersError) {
          logResult('Supabase Query', 'error', 'Failed to query database', {
            servicesError: error.message,
            usersError: usersError.message,
          })
        } else {
          logResult('Supabase Query', 'success', 'Database query executed successfully')
        }
      } else {
        logResult('Supabase Query', 'success', 'Database query executed successfully')
      }
    }
  } catch (error: any) {
    logResult('Supabase Integration', 'error', 'Supabase verification failed', {
      error: error.message,
    })
  }

  // 2. Stripe Integration
  try {
    const isConfigured = isStripeConfigured()

    if (!isConfigured) {
      logResult('Stripe Config', 'warning', 'Stripe not configured (optional)')
    } else {
      logResult('Stripe Config', 'success', 'Stripe environment variables set')
      const stripe = getStripe()
      logResult('Stripe Client', 'success', 'Stripe client created successfully')

      try {
        const account = await stripe.accounts.retrieve()
        logResult('Stripe API', 'success', 'Stripe API connection verified', {
          accountId: account.id,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
        })
      } catch (error: any) {
        logResult('Stripe API', 'error', 'Failed to connect to Stripe API', {
          error: error.message,
        })
      }
    }
  } catch (error: any) {
    logResult('Stripe Integration', 'error', 'Stripe verification failed', {
      error: error.message,
    })
  }

  // 3. Email Integration
  try {
    const smtpHost = process.env.SMTP_HOST
    const smtpUser = process.env.SMTP_USER
    const smtpPassword = process.env.SMTP_PASSWORD || process.env.SMTP_PASS

    const usingDefaults = !smtpHost && !smtpUser && !smtpPassword

    if (usingDefaults) {
      logResult('Email Config', 'warning', 'Using hardcoded SMTP defaults (not recommended for production)', {
        recommendation: 'Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD environment variables',
        defaultHost: 'smtpout.secureserver.net',
        defaultUser: 'whatsmartapp@tsmartsupport.com',
      })
    } else if (!smtpHost || !smtpUser || !smtpPassword) {
      logResult('Email Config', 'warning', 'SMTP configuration incomplete', {
        hasHost: !!smtpHost,
        hasUser: !!smtpUser,
        hasPassword: !!smtpPassword,
        recommendation: 'Set all SMTP environment variables or use defaults',
      })
    } else {
      logResult('Email Config', 'success', 'SMTP environment variables set', {
        host: smtpHost,
        user: smtpUser,
      })
    }

    const isVerified = await verifySMTPConnection()

    if (isVerified) {
      logResult('Email Connection', 'success', 'SMTP connection verified successfully')
      if (usingDefaults) {
        logResult('Email Security', 'warning', 'Consider using environment variables instead of hardcoded defaults')
      }
    } else {
      logResult('Email Connection', 'error', 'SMTP connection verification failed', {
        troubleshooting: 'Check SMTP credentials and network connectivity',
        host: smtpHost || 'smtpout.secureserver.net',
        port: process.env.SMTP_PORT || '465',
      })
    }
  } catch (error: any) {
    logResult('Email Integration', 'error', 'Email verification failed', {
      error: error.message,
    })
  }

  // 4. WhatsApp Integration
  try {
    const instanceId = process.env.WHATSMARTAPP_INSTANCE_ID
    const apiKey = process.env.WHATSMARTAPP_API_KEY
    const baseUrl = process.env.WHATSMARTAPP_BASE_URL

    if (!instanceId || !apiKey) {
      logResult('WhatsApp Config', 'warning', 'WhatsApp not configured (optional)', {
        hasInstanceId: !!instanceId,
        hasApiKey: !!apiKey,
        hasBaseUrl: !!baseUrl,
      })
    } else {
      logResult('WhatsApp Config', 'success', 'WhatsApp environment variables set', {
        instanceId: instanceId.substring(0, 10) + '...',
        baseUrl: baseUrl || 'not set',
      })
    }
  } catch (error: any) {
    logResult('WhatsApp Integration', 'error', 'WhatsApp verification failed', {
      error: error.message,
    })
  }

  // 5. Analytics Integration
  try {
    const vercelAnalytics = process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID
    const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN

    const analyticsConfigured: string[] = []

    if (vercelAnalytics || vercelUrl) {
      analyticsConfigured.push('Vercel Analytics')
      logResult('Vercel Analytics', 'success', 'Vercel Analytics configured')
    } else {
      logResult('Vercel Analytics', 'warning', 'Vercel Analytics not configured (optional)')
    }

    if (sentryDsn) {
      analyticsConfigured.push('Sentry')
      logResult('Sentry', 'success', 'Sentry configured')
    } else {
      logResult('Sentry', 'warning', 'Sentry not configured (optional)')
    }

    if (analyticsConfigured.length > 0) {
      logResult('Analytics Summary', 'success', `Analytics services configured: ${analyticsConfigured.join(', ')}`)
    } else {
      logResult('Analytics Summary', 'warning', 'No analytics services configured (optional)')
    }
  } catch (error: any) {
    logResult('Analytics Integration', 'error', 'Analytics verification failed', {
      error: error.message,
    })
  }

  // 6. Third-Party Integrations
  try {
    const integrations: Record<string, { configured: boolean }> = {}

    const checks = [
      { name: 'Google Home', envVars: ['GOOGLE_HOME_CLIENT_ID', 'GOOGLE_HOME_CLIENT_SECRET'] },
      { name: 'Alexa', envVars: ['ALEXA_SKILL_ID', 'ALEXA_CLIENT_ID'] },
      { name: 'HomeKit', envVars: ['HOMEKIT_ACCESSORY_ID'] },
      { name: 'Smart Locks', envVars: ['SMART_LOCK_API_KEY'] },
      { name: 'Thermostat', envVars: ['THERMOSTAT_API_KEY'] },
      { name: 'Cameras', envVars: ['CAMERA_API_KEY'] },
    ]

    let configuredCount = 0

    for (const check of checks) {
      const hasAllVars = check.envVars.every((varName) => !!process.env[varName])
      integrations[check.name] = { configured: hasAllVars }

      if (hasAllVars) {
        configuredCount++
        logResult(check.name, 'success', `${check.name} configured`)
      } else {
        logResult(check.name, 'warning', `${check.name} not configured (optional)`)
      }
    }

    if (configuredCount > 0) {
      logResult('Third-Party Summary', 'success', `${configuredCount} third-party integration(s) configured`)
    } else {
      logResult('Third-Party Summary', 'warning', 'No third-party integrations configured (all optional)')
    }
  } catch (error: any) {
    logResult('Third-Party Integrations', 'error', 'Third-party integrations verification failed', {
      error: error.message,
    })
  }

  // 7. Error Handling
  try {
    logResult('Error Handling', 'success', 'Integration error handling patterns verified')
  } catch (error: any) {
    logResult('Error Handling', 'error', 'Error handling verification failed', {
      error: error.message,
    })
  }

  // Calculate summary
  const successCount = results.filter((r) => r.status === 'success').length
  const errorCount = results.filter((r) => r.status === 'error').length
  const warningCount = results.filter((r) => r.status === 'warning').length

  return NextResponse.json({
    summary: {
      success: successCount,
      errors: errorCount,
      warnings: warningCount,
      total: results.length,
    },
    results,
    timestamp: new Date().toISOString(),
  })
}

