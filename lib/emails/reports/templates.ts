import { loadBranding } from '@/lib/tenant'

export type ReportEmailPayload = {
  to: string
  recipientName?: string
  companyName: string
  propertyName?: string
  reportUrl: string
  periodStart: Date
  periodEnd: Date
  frequency: 'daily' | 'weekly' | 'monthly'
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
      <p style="font-size: 12px; color: #6b7280; margin-top: 12px; text-align: center;">This is an automated report from your cleaning service provider.</p>
    </div>
  `.trim()
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getFrequencyLabel(frequency: 'daily' | 'weekly' | 'monthly'): string {
  switch (frequency) {
    case 'daily':
      return 'Daily'
    case 'weekly':
      return 'Weekly'
    case 'monthly':
      return 'Monthly'
    default:
      return frequency
  }
}

export type ReportEmailTemplateType = 'scheduled' | 'summary' | 'executive' | 'custom'

export const ReportEmailTemplates = {
  scheduledReport: async (p: ReportEmailPayload) => {
    const b = await loadBranding(p.tenantId ?? null)
    const greeting = p.recipientName ? `Hi ${p.recipientName},` : 'Hello,'
    const propertyInfo = p.propertyName
      ? `<p><strong>Property:</strong> ${p.propertyName}</p>`
      : ''
    
    return {
      subject: `${getFrequencyLabel(p.frequency)} Cleaning Report - ${p.companyName}`,
      html: wrapBrandingHtml(
        `
          <h1 style="margin: 0 0 8px 0;">Your ${getFrequencyLabel(p.frequency)} Cleaning Report</h1>
          <p>${greeting}</p>
          <p>Your scheduled ${getFrequencyLabel(p.frequency).toLowerCase()} cleaning report for <strong>${p.companyName}</strong> is ready.</p>
          ${propertyInfo}
          <p><strong>Report Period:</strong> ${formatDate(p.periodStart)} - ${formatDate(p.periodEnd)}</p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${p.reportUrl}" 
               style="display: inline-block; background: ${b.primaryColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View Report
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            This report contains detailed information about cleaning services performed during the specified period, including job summaries, ratings, and photos.
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            If you have any questions about this report, please contact your property manager or cleaning service provider.
          </p>
        `.trim(),
        { logoUrl: b.logoUrl, primaryColor: b.primaryColor }
      ),
    }
  },
  
  summaryReport: async (p: ReportEmailPayload) => {
    const b = await loadBranding(p.tenantId ?? null)
    const greeting = p.recipientName ? `Hi ${p.recipientName},` : 'Hello,'
    
    return {
      subject: `Summary Report - ${p.companyName}`,
      html: wrapBrandingHtml(
        `
          <h1 style="margin: 0 0 8px 0;">Summary Report Available</h1>
          <p>${greeting}</p>
          <p>Your summary cleaning report for <strong>${p.companyName}</strong> is ready.</p>
          <p><strong>Report Period:</strong> ${formatDate(p.periodStart)} - ${formatDate(p.periodEnd)}</p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${p.reportUrl}" 
               style="display: inline-block; background: ${b.primaryColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View Summary Report
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            This summary report provides key metrics and highlights from your cleaning services.
          </p>
        `.trim(),
        { logoUrl: b.logoUrl, primaryColor: b.primaryColor }
      ),
    }
  },
  
  executiveReport: async (p: ReportEmailPayload) => {
    const b = await loadBranding(p.tenantId ?? null)
    const greeting = p.recipientName ? `Hi ${p.recipientName},` : 'Hello,'
    
    return {
      subject: `Executive Report - ${p.companyName}`,
      html: wrapBrandingHtml(
        `
          <h1 style="margin: 0 0 8px 0;">Executive Report Available</h1>
          <p>${greeting}</p>
          <p>Your executive summary report for <strong>${p.companyName}</strong> is ready.</p>
          <p><strong>Report Period:</strong> ${formatDate(p.periodStart)} - ${formatDate(p.periodEnd)}</p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${p.reportUrl}" 
               style="display: inline-block; background: ${b.primaryColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View Executive Report
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            This executive report provides high-level insights and performance metrics for management review.
          </p>
        `.trim(),
        { logoUrl: b.logoUrl, primaryColor: b.primaryColor }
      ),
    }
  },
}

