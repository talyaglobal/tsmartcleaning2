import { ReportEmailPayload, ReportEmailTemplates } from './templates'

export type SendEmailFn = (args: { to: string; subject: string; html: string }) => Promise<{ messageId?: string }>

// Wire your email provider (Resend/SendGrid) here.
export function createReportEmailClient(sendEmail: SendEmailFn) {
  return {
    async sendScheduledReport(p: ReportEmailPayload) {
      const t = await ReportEmailTemplates.scheduledReport(p)
      const result = await sendEmail({ to: p.to, subject: t.subject, html: t.html })
      return result
    },
    async sendSummaryReport(p: ReportEmailPayload) {
      const t = await ReportEmailTemplates.summaryReport(p)
      const result = await sendEmail({ to: p.to, subject: t.subject, html: t.html })
      return result
    },
    async sendExecutiveReport(p: ReportEmailPayload) {
      const t = await ReportEmailTemplates.executiveReport(p)
      const result = await sendEmail({ to: p.to, subject: t.subject, html: t.html })
      return result
    },
  }
}

export type { ReportEmailPayload } from './templates'
export { ReportEmailTemplates } from './templates'

