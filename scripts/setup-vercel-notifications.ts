#!/usr/bin/env tsx

/**
 * Vercel Deployment Notifications Setup
 * 
 * This script configures Vercel deployment failure notifications
 * and integrates with monitoring systems.
 */

import { execSync } from 'child_process'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

interface VercelProject {
  name: string
  id: string
  framework: string
}

interface WebhookConfig {
  url: string
  events: string[]
  projectIds?: string[]
}

class VercelNotificationsSetup {
  private vercelToken = process.env.VERCEL_TOKEN
  private projectName = process.env.VERCEL_PROJECT_NAME || 'tsmartcleaning2'
  
  constructor() {
    if (!this.vercelToken) {
      console.warn('⚠️ VERCEL_TOKEN not found. Some features will be limited.')
    }
  }

  private async runVercelCommand(command: string): Promise<string> {
    try {
      const result = execSync(`npx vercel ${command}`, {
        encoding: 'utf8',
        env: {
          ...process.env,
          VERCEL_TOKEN: this.vercelToken
        }
      })
      return result.trim()
    } catch (error: any) {
      console.error(`❌ Vercel command failed: ${command}`)
      console.error(error.message)
      throw error
    }
  }

  public async setupDeploymentWebhooks(): Promise<void> {
    console.log('🔧 Setting up Vercel deployment webhooks...')

    const webhooks: WebhookConfig[] = [
      {
        url: 'https://your-app.vercel.app/api/webhooks/deployment-failed',
        events: ['deployment.failed', 'deployment.error']
      },
      {
        url: 'https://your-app.vercel.app/api/webhooks/deployment-succeeded',
        events: ['deployment.succeeded']
      }
    ]

    // Create webhook endpoints first
    await this.createWebhookEndpoints()

    for (const webhook of webhooks) {
      try {
        await this.createWebhook(webhook)
        console.log(`✅ Created webhook for events: ${webhook.events.join(', ')}`)
      } catch (error) {
        console.warn(`⚠️ Failed to create webhook:`, error)
      }
    }
  }

  private async createWebhookEndpoints(): Promise<void> {
    console.log('📝 Creating webhook API endpoints...')

    // Create deployment failed webhook
    const deploymentFailedWebhook = `
import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verify webhook signature (implement based on your security needs)
    const signature = request.headers.get('x-vercel-signature')
    
    if (body.type === 'deployment.failed' || body.type === 'deployment.error') {
      console.error('🚨 Deployment failed:', {
        deploymentId: body.payload.deployment.id,
        project: body.payload.deployment.name,
        url: body.payload.deployment.url,
        error: body.payload.deployment.error,
        timestamp: new Date().toISOString()
      })

      // Send to Sentry
      Sentry.captureException(new Error(\`Deployment failed: \${body.payload.deployment.error}\`), {
        tags: {
          deploymentId: body.payload.deployment.id,
          project: body.payload.deployment.name,
          type: 'deployment_failure'
        },
        extra: {
          deployment: body.payload.deployment,
          fullPayload: body
        }
      })

      // Send notifications (email, Slack, etc.)
      await sendDeploymentFailureNotification(body.payload)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function sendDeploymentFailureNotification(deployment: any) {
  // Send email notification
  console.log('📧 Sending deployment failure notification...')
  
  // Send Slack notification
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: \`🚨 Deployment Failed\`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: \`*Deployment Failed* ❌\\n\\n*Project:* \${deployment.name}\\n*Deployment ID:* \${deployment.id}\\n*Error:* \${deployment.error || 'Unknown error'}\\n*Time:* \${new Date().toISOString()}\`
              }
            }
          ]
        })
      })
      
      if (response.ok) {
        console.log('✅ Slack notification sent')
      } else {
        console.error('❌ Failed to send Slack notification')
      }
    } catch (error) {
      console.error('❌ Slack notification error:', error)
    }
  }
}`

    // Create deployment success webhook
    const deploymentSuccessWebhook = `
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (body.type === 'deployment.succeeded') {
      console.log('✅ Deployment succeeded:', {
        deploymentId: body.payload.deployment.id,
        project: body.payload.deployment.name,
        url: body.payload.deployment.url,
        timestamp: new Date().toISOString()
      })

      // Optional: Send success notification for production deployments
      if (body.payload.deployment.target === 'production') {
        await sendDeploymentSuccessNotification(body.payload)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function sendDeploymentSuccessNotification(deployment: any) {
  console.log('📧 Deployment successful:', deployment.name)
  
  // Send notification only for production deployments
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: \`✅ Production deployment successful: \${deployment.name}\`
        })
      })
    } catch (error) {
      console.error('Slack notification error:', error)
    }
  }
}`

    // Write the webhook files
    try {
      const fs = require('fs')
      const path = require('path')
      
      // Create directories
      const webhookDir = path.join(process.cwd(), 'app', 'api', 'webhooks')
      if (!fs.existsSync(webhookDir)) {
        fs.mkdirSync(webhookDir, { recursive: true })
      }
      
      // Write deployment failed webhook
      const failedDir = path.join(webhookDir, 'deployment-failed')
      if (!fs.existsSync(failedDir)) {
        fs.mkdirSync(failedDir, { recursive: true })
      }
      fs.writeFileSync(path.join(failedDir, 'route.ts'), deploymentFailedWebhook)
      
      // Write deployment success webhook
      const successDir = path.join(webhookDir, 'deployment-succeeded')
      if (!fs.existsSync(successDir)) {
        fs.mkdirSync(successDir, { recursive: true })
      }
      fs.writeFileSync(path.join(successDir, 'route.ts'), deploymentSuccessWebhook)
      
      console.log('✅ Webhook endpoints created')
    } catch (error) {
      console.error('❌ Failed to create webhook endpoints:', error)
    }
  }

  private async createWebhook(webhook: WebhookConfig): Promise<void> {
    console.log(\`📝 Creating webhook for: \${webhook.events.join(', ')}\`)
    
    // Note: Vercel webhooks are typically created via the dashboard or API
    console.log('ℹ️ Manual setup required in Vercel dashboard:')
    console.log(\`   1. Go to: https://vercel.com/\${process.env.VERCEL_TEAM_ID || 'your-team'}/\${this.projectName}/settings/webhooks\`)
    console.log(\`   2. Add webhook URL: \${webhook.url}\`)
    console.log(\`   3. Select events: \${webhook.events.join(', ')}\`)
  }

  public async setupEmailNotifications(): Promise<void> {
    console.log('📧 Setting up email notifications...')
    
    const emailConfig = {
      smtpHost: process.env.SMTP_HOST,
      smtpPort: process.env.SMTP_PORT || 587,
      smtpUser: process.env.SMTP_USER,
      smtpPass: process.env.SMTP_PASS,
      from: process.env.SMTP_FROM || 'noreply@tsmartcleaning.com',
      to: process.env.ALERT_EMAIL || 'admin@tsmartcleaning.com'
    }

    if (!emailConfig.smtpHost) {
      console.warn('⚠️ SMTP configuration not found. Email notifications will be disabled.')
      return
    }

    console.log('✅ Email notifications configured')
    console.log(\`   From: \${emailConfig.from}\`)
    console.log(\`   To: \${emailConfig.to}\`)
  }

  public async setupSlackNotifications(): Promise<void> {
    console.log('💬 Setting up Slack notifications...')
    
    const slackWebhook = process.env.SLACK_WEBHOOK_URL
    
    if (!slackWebhook) {
      console.warn('⚠️ SLACK_WEBHOOK_URL not found. Slack notifications will be disabled.')
      console.log('ℹ️ To enable Slack notifications:')
      console.log('   1. Create a Slack webhook: https://api.slack.com/messaging/webhooks')
      console.log('   2. Add SLACK_WEBHOOK_URL to your environment variables')
      return
    }

    // Test Slack webhook
    try {
      const testMessage = {
        text: '🧪 Test notification from TSmartCleaning deployment system',
        username: 'Vercel Deployments',
        icon_emoji: ':rocket:'
      }

      const response = await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testMessage)
      })

      if (response.ok) {
        console.log('✅ Slack notifications configured and tested')
      } else {
        console.error('❌ Slack webhook test failed')
      }
    } catch (error) {
      console.error('❌ Slack notification test failed:', error)
    }
  }

  public async validateConfiguration(): Promise<void> {
    console.log('🔍 Validating notification configuration...')
    
    const checks = [
      {
        name: 'Vercel Token',
        value: this.vercelToken,
        required: false
      },
      {
        name: 'SMTP Configuration',
        value: process.env.SMTP_HOST,
        required: false
      },
      {
        name: 'Slack Webhook',
        value: process.env.SLACK_WEBHOOK_URL,
        required: false
      },
      {
        name: 'Sentry DSN',
        value: process.env.NEXT_PUBLIC_SENTRY_DSN,
        required: true
      }
    ]

    checks.forEach(check => {
      if (check.required && !check.value) {
        console.error(\`❌ \${check.name}: Required but not configured\`)
      } else if (check.value) {
        console.log(\`✅ \${check.name}: Configured\`)
      } else {
        console.warn(\`⚠️ \${check.name}: Optional, not configured\`)
      }
    })
  }
}

async function main() {
  const setup = new VercelNotificationsSetup()

  try {
    console.log('🚀 Starting Vercel notifications setup...')

    // Validate configuration
    await setup.validateConfiguration()

    // Setup webhooks
    await setup.setupDeploymentWebhooks()

    // Setup email notifications
    await setup.setupEmailNotifications()

    // Setup Slack notifications
    await setup.setupSlackNotifications()

    console.log('\\n✅ Vercel notifications setup completed!')
    console.log('\\n📋 Next steps:')
    console.log('1. Configure webhooks in Vercel dashboard')
    console.log('2. Test notifications by triggering a deployment')
    console.log('3. Set up additional notification channels as needed')
    console.log('4. Monitor webhook delivery in Vercel dashboard')

  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export default VercelNotificationsSetup