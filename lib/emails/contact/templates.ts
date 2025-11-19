import { loadBranding } from '@/lib/tenant'

export type ContactFormNotificationPayload = {
  name: string
  email: string
  phone?: string | null
  serviceType: string
  message: string
  submissionId?: string
  tenantId?: string | null
}

export type ContactFormAutoReplyPayload = {
  name: string
  email: string
  serviceType: string
  tenantId?: string | null
}

function wrapBrandingHtml(
  innerHtml: string,
  brand: { logoUrl: string; primaryColor: string },
  baseUrl: string
) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif; color: #111; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
        <div style="background: ${brand.primaryColor}; padding: 20px; text-align: center;">
          <img src="${baseUrl}${brand.logoUrl}" alt="TSmartCleaning" style="height: 32px; display: inline-block;" />
        </div>
        <div style="padding: 24px; background: #ffffff;">
          ${innerHtml}
        </div>
        <div style="padding: 20px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 12px; color: #6b7280; text-align: center;">
            This is an automated message. Please do not reply directly to this email.
          </p>
        </div>
      </div>
    </div>
  `.trim()
}

export const ContactEmailTemplates = {
  /**
   * Email notification sent to support team when contact form is submitted
   */
  notification: async (p: ContactFormNotificationPayload) => {
    const branding = await loadBranding(p.tenantId || null)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tsmartcleaning.com'

    const innerHtml = `
      <h1 style="margin: 0 0 16px 0; font-size: 24px; color: #111;">New Contact Form Submission</h1>
      
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 0 0 8px 0;"><strong>Name:</strong> ${p.name}</p>
        <p style="margin: 0 0 8px 0;"><strong>Email:</strong> <a href="mailto:${p.email}" style="color: ${branding.primaryColor};">${p.email}</a></p>
        ${p.phone ? `<p style="margin: 0 0 8px 0;"><strong>Phone:</strong> <a href="tel:${p.phone}" style="color: ${branding.primaryColor};">${p.phone}</a></p>` : ''}
        <p style="margin: 0 0 8px 0;"><strong>Service Type:</strong> ${p.serviceType.charAt(0).toUpperCase() + p.serviceType.slice(1)}</p>
        ${p.submissionId ? `<p style="margin: 0;"><strong>Submission ID:</strong> ${p.submissionId}</p>` : ''}
      </div>

      <div style="margin-bottom: 20px;">
        <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #111;">Message:</h2>
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border-left: 4px solid ${branding.primaryColor}; white-space: pre-wrap;">${p.message.trim().replace(/\n/g, '<br>')}</div>
      </div>

      <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 14px; color: #6b7280;">
          This submission was received from the contact form on ${baseUrl}/contact
        </p>
      </div>
    `.trim()

    const text = `
New Contact Form Submission

Name: ${p.name}
Email: ${p.email}
${p.phone ? `Phone: ${p.phone}` : ''}
Service Type: ${p.serviceType.charAt(0).toUpperCase() + p.serviceType.slice(1)}
${p.submissionId ? `Submission ID: ${p.submissionId}` : ''}

Message:
${p.message.trim()}

---
This submission was received from the contact form on ${baseUrl}/contact
    `.trim()

    return {
      subject: `New Contact Form: ${p.serviceType} - ${p.name}`,
      html: wrapBrandingHtml(innerHtml, branding, baseUrl),
      text,
    }
  },

  /**
   * Auto-reply email sent to the user who submitted the contact form
   */
  autoReply: async (p: ContactFormAutoReplyPayload) => {
    const branding = await loadBranding(p.tenantId || null)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tsmartcleaning.com'

    const innerHtml = `
      <h1 style="margin: 0 0 16px 0; font-size: 24px; color: #111;">Thank You for Contacting Us!</h1>
      
      <p style="margin: 0 0 16px 0; color: #374151;">
        Hi ${p.name.split(' ')[0] || p.name},
      </p>

      <p style="margin: 0 0 16px 0; color: #374151;">
        Thank you for reaching out to us regarding <strong>${p.serviceType.charAt(0).toUpperCase() + p.serviceType.slice(1)}</strong>. 
        We've received your message and our team will get back to you as soon as possible, typically within 24-48 hours.
      </p>

      <div style="background: #f0f9ff; border-left: 4px solid ${branding.primaryColor}; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #374151;">
          <strong>What happens next?</strong>
        </p>
        <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #374151;">
          <li>Our team will review your inquiry</li>
          <li>We'll respond to your email within 24-48 hours</li>
          <li>If urgent, you can call us directly</li>
        </ul>
      </div>

      <p style="margin: 20px 0 0 0; color: #374151;">
        In the meantime, feel free to explore our website or check out our frequently asked questions.
      </p>

      <div style="margin: 24px 0; text-align: center;">
        <a href="${baseUrl}" style="display: inline-block; background: ${branding.primaryColor}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
          Visit Our Website
        </a>
      </div>

      <p style="margin: 20px 0 0 0; color: #374151;">
        Best regards,<br>
        <strong>The TSmartCleaning Team</strong>
      </p>
    `.trim()

    const text = `
Thank You for Contacting Us!

Hi ${p.name.split(' ')[0] || p.name},

Thank you for reaching out to us regarding ${p.serviceType.charAt(0).toUpperCase() + p.serviceType.slice(1)}. 
We've received your message and our team will get back to you as soon as possible, typically within 24-48 hours.

What happens next?
- Our team will review your inquiry
- We'll respond to your email within 24-48 hours
- If urgent, you can call us directly

In the meantime, feel free to explore our website or check out our frequently asked questions.

Visit our website: ${baseUrl}

Best regards,
The TSmartCleaning Team
    `.trim()

    return {
      subject: `We've Received Your Contact Form Submission - ${p.serviceType}`,
      html: wrapBrandingHtml(innerHtml, branding, baseUrl),
      text,
    }
  },
}

