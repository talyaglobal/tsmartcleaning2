import nodemailer from 'nodemailer'

// GoDaddy Workspace SMTP configuration
// Credentials should be set via environment variables for security
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: true, // Use SSL/TLS for port 465
  auth: {
    user: process.env.SMTP_USER || 'whatsmartapp@tsmartsupport.com',
    pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS || 'Whatsmartapp2025!',
  },
}

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport(SMTP_CONFIG)
  }
  return transporter
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
}

/**
 * Send an email using GoDaddy Workspace SMTP
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { to, subject, html, text, from, replyTo } = options

  const mailOptions: nodemailer.SendMailOptions = {
    from: from || SMTP_CONFIG.auth.user,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
    replyTo: replyTo || from || SMTP_CONFIG.auth.user,
  }

  try {
    const transport = getTransporter()
    const info = await transport.sendMail(mailOptions)
    console.log('[smtp] Email sent successfully:', {
      messageId: info.messageId,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
    })
  } catch (error) {
    console.error('[smtp] Email send failed:', error)
    throw error
  }
}

/**
 * Verify SMTP connection
 */
export async function verifySMTPConnection(): Promise<boolean> {
  try {
    const transport = getTransporter()
    await transport.verify()
    console.log('[smtp] SMTP connection verified successfully')
    return true
  } catch (error) {
    console.error('[smtp] SMTP connection verification failed:', error)
    return false
  }
}

