import { InsuranceEmailPayload, InsuranceEmailTemplates } from './templates'

export type SendEmailFn = (args: { to: string; subject: string; html: string }) => Promise<void>

// Wire your email provider (Resend/SendGrid) here.
export function createInsuranceEmailClient(sendEmail: SendEmailFn) {
  return {
    async sendWelcome(p: InsuranceEmailPayload) {
      const t = await InsuranceEmailTemplates.welcome(p)
      await sendEmail({ to: p.to, subject: t.subject, html: t.html })
    },
    async sendCoverageReminder(p: InsuranceEmailPayload) {
      const t = await InsuranceEmailTemplates.coverageReminder(p)
      await sendEmail({ to: p.to, subject: t.subject, html: t.html })
    },
    async sendMidYearCheckIn(p: InsuranceEmailPayload) {
      const t = await InsuranceEmailTemplates.midYearCheckIn(p)
      await sendEmail({ to: p.to, subject: t.subject, html: t.html })
    },
    async sendRenewalReminder30(p: InsuranceEmailPayload) {
      const t = await InsuranceEmailTemplates.renewalReminder30(p)
      await sendEmail({ to: p.to, subject: t.subject, html: t.html })
    },
    async sendRenewalReminder7(p: InsuranceEmailPayload) {
      const t = await InsuranceEmailTemplates.renewalReminder7(p)
      await sendEmail({ to: p.to, subject: t.subject, html: t.html })
    },
    async sendLapsedCoverage(p: InsuranceEmailPayload) {
      const t = await InsuranceEmailTemplates.lapsedCoverage(p)
      await sendEmail({ to: p.to, subject: t.subject, html: t.html })
    },
    async sendClaimFiled(p: InsuranceEmailPayload) {
      const t = await InsuranceEmailTemplates.claimFiled(p)
      await sendEmail({ to: p.to, subject: t.subject, html: t.html })
    },
    async sendClaimStatusUpdate(p: InsuranceEmailPayload) {
      const t = await InsuranceEmailTemplates.claimStatusUpdate(p)
      await sendEmail({ to: p.to, subject: t.subject, html: t.html })
    },
    async sendClaimApproved(p: InsuranceEmailPayload) {
      const t = await InsuranceEmailTemplates.claimApproved(p)
      await sendEmail({ to: p.to, subject: t.subject, html: t.html })
    },
    async sendClaimDenied(p: InsuranceEmailPayload) {
      const t = await InsuranceEmailTemplates.claimDenied(p)
      await sendEmail({ to: p.to, subject: t.subject, html: t.html })
    },
    async sendPaymentProcessed(p: InsuranceEmailPayload) {
      const t = await InsuranceEmailTemplates.paymentProcessed(p)
      await sendEmail({ to: p.to, subject: t.subject, html: t.html })
    },
    async sendUpgradeOffer(p: InsuranceEmailPayload) {
      const t = await InsuranceEmailTemplates.upgradeOffer(p)
      await sendEmail({ to: p.to, subject: t.subject, html: t.html })
    },
  }
}

export type { InsuranceEmailPayload } from './templates'
export { InsuranceEmailTemplates } from './templates'


