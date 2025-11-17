import { loadBranding } from '@/lib/tenant'

export type InsuranceEmailPayload = {
  to: string
  userName: string
  policyNumber?: string
  claimId?: string
  tenantId?: string
}

function wrapBrandingHtml(innerHtml: string, brand: { logoUrl: string; primaryColor: string }) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif; color: #111; line-height: 1.5;">
      <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
        <div style="background: ${brand.primaryColor}; padding: 16px;">
          <img src="${brand.logoUrl}" alt="Logo" style="height: 28px; display: block;" />
        </div>
        <div style="padding: 20px;">
          ${innerHtml}
        </div>
      </div>
      <p style="font-size: 12px; color: #6b7280; margin-top: 12px; text-align: center;">This is a service message.</p>
    </div>
  `.trim()
}

export const InsuranceEmailTemplates = {
  welcome: async (p: InsuranceEmailPayload) => {
    const b = await loadBranding(p.tenantId ?? null)
    return {
      subject: 'Welcome to CleanGuard Protection! Your Coverage Starts Now',
      html: wrapBrandingHtml(
        `
          <h1 style="margin: 0 0 8px 0;">Welcome, ${p.userName}</h1>
          <p>Thanks for adding CleanGuard Protection. Your coverage is active.</p>
          <p>Download your certificate from your dashboard.</p>
        `.trim(),
        { logoUrl: b.logoUrl, primaryColor: b.primaryColor }
      ),
    }
  },
  coverageReminder: async (p: InsuranceEmailPayload) => {
    const b = await loadBranding(p.tenantId ?? null)
    return {
      subject: 'Your Protection is Active - Here’s What You Need to Know',
      html: wrapBrandingHtml(
        `<p>Coverage is active. Here's how to file a claim if needed.</p>`,
        { logoUrl: b.logoUrl, primaryColor: b.primaryColor }
      ),
    }
  },
  // Newly added mid-year check-in
  midYearCheckIn: async (p: InsuranceEmailPayload) => {
    const b = await loadBranding(p.tenantId ?? null)
    return {
      subject: 'Coverage Check-In: Is Your Protection Still Right for You?',
      html: wrapBrandingHtml(
        `
          <p>Hi ${p.userName}, it's been 6 months. Here's a quick check-in on your coverage.</p>
          <ul>
            <li>Review your plan and limits</li>
            <li>Upgrade if your needs changed</li>
            <li>We’re here to help if you have questions</li>
          </ul>
        `.trim(),
        { logoUrl: b.logoUrl, primaryColor: b.primaryColor }
      ),
    }
  },
  renewalReminder30: async (p: InsuranceEmailPayload) => {
    const b = await loadBranding(p.tenantId ?? null)
    return {
      subject: 'Your CleanGuard Protection Expires Soon - Renew Now',
      html: wrapBrandingHtml(
        `<p>Renew now to avoid a gap in coverage.</p>`,
        { logoUrl: b.logoUrl, primaryColor: b.primaryColor }
      ),
    }
  },
  // Newly added 7-day reminder
  renewalReminder7: async (p: InsuranceEmailPayload) => {
    const b = await loadBranding(p.tenantId ?? null)
    return {
      subject: 'URGENT: Your Protection Expires in 7 Days',
      html: wrapBrandingHtml(
        `<p>Your protection expires in 7 days. Renew now to keep continuous coverage.</p>`,
        { logoUrl: b.logoUrl, primaryColor: b.primaryColor }
      ),
    }
  },
  // Newly added lapsed coverage
  lapsedCoverage: async (p: InsuranceEmailPayload) => {
    const b = await loadBranding(p.tenantId ?? null)
    return {
      subject: 'Your Protection Has Expired - Reinstate Today',
      html: wrapBrandingHtml(
        `<p>Your coverage has expired. Reinstate within 30 days to avoid a gap.</p>`,
        { logoUrl: b.logoUrl, primaryColor: b.primaryColor }
      ),
    }
  },
  claimFiled: async (p: InsuranceEmailPayload) => {
    const b = await loadBranding(p.tenantId ?? null)
    return {
      subject: `Claim Received - #${p.claimId}`,
      html: wrapBrandingHtml(
        `<p>We received your claim ${p.claimId}. We’ll update you soon.</p>`,
        { logoUrl: b.logoUrl, primaryColor: b.primaryColor }
      ),
    }
  },
  // Newly added generic status update
  claimStatusUpdate: async (p: InsuranceEmailPayload) => {
    const b = await loadBranding(p.tenantId ?? null)
    return {
      subject: `Update on Your Claim #${p.claimId}`,
      html: wrapBrandingHtml(
        `<p>Your claim #${p.claimId} has an update. Please check the dashboard for details.</p>`,
        { logoUrl: b.logoUrl, primaryColor: b.primaryColor }
      ),
    }
  },
  claimApproved: async (p: InsuranceEmailPayload) => {
    const b = await loadBranding(p.tenantId ?? null)
    return {
      subject: `Great News! Your Claim #${p.claimId} Has Been Approved`,
      html: wrapBrandingHtml(
        `<p>Your claim ${p.claimId} was approved. Payment is processing.</p>`,
        { logoUrl: b.logoUrl, primaryColor: b.primaryColor }
      ),
    }
  },
  claimDenied: async (p: InsuranceEmailPayload) => {
    const b = await loadBranding(p.tenantId ?? null)
    return {
      subject: `Update on Your Claim #${p.claimId}`,
      html: wrapBrandingHtml(
        `<p>Your claim ${p.claimId} was not approved. See dashboard for details.</p>`,
        { logoUrl: b.logoUrl, primaryColor: b.primaryColor }
      ),
    }
  },
  paymentProcessed: async (p: InsuranceEmailPayload) => {
    const b = await loadBranding(p.tenantId ?? null)
    return {
      subject: 'Your Claim Payment is on the Way',
      html: wrapBrandingHtml(
        `<p>Your payment has been processed.</p>`,
        { logoUrl: b.logoUrl, primaryColor: b.primaryColor }
      ),
    }
  },
  // Newly added upgrade offer
  upgradeOffer: async (p: InsuranceEmailPayload) => {
    const b = await loadBranding(p.tenantId ?? null)
    return {
      subject: 'Protect More, Worry Less - Upgrade Your Coverage',
      html: wrapBrandingHtml(
        `<p>Upgrade to increase your coverage limits and benefits. It only takes a minute.</p>`,
        { logoUrl: b.logoUrl, primaryColor: b.primaryColor }
      ),
    }
  },
}


