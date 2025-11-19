import { BookingEmailPayload, BookingEmailTemplates } from './templates'

export type SendEmailFn = (args: { to: string; subject: string; html: string }) => Promise<void>

// Wire your email provider (Resend/SendGrid) here.
export function createBookingEmailClient(sendEmail: SendEmailFn) {
  return {
    async sendConfirmation(p: BookingEmailPayload) {
      const t = await BookingEmailTemplates.confirmation(p)
      await sendEmail({ to: p.to, subject: t.subject, html: t.html })
    },
    async sendConfirmed(p: BookingEmailPayload) {
      const t = await BookingEmailTemplates.confirmed(p)
      await sendEmail({ to: p.to, subject: t.subject, html: t.html })
    },
    async sendReminder(p: BookingEmailPayload) {
      const t = await BookingEmailTemplates.reminder(p)
      await sendEmail({ to: p.to, subject: t.subject, html: t.html })
    },
    async sendInProgress(p: BookingEmailPayload) {
      const t = await BookingEmailTemplates.inProgress(p)
      await sendEmail({ to: p.to, subject: t.subject, html: t.html })
    },
    async sendCompleted(p: BookingEmailPayload) {
      const t = await BookingEmailTemplates.completed(p)
      await sendEmail({ to: p.to, subject: t.subject, html: t.html })
    },
    async sendCancelled(p: BookingEmailPayload) {
      const t = await BookingEmailTemplates.cancelled(p)
      await sendEmail({ to: p.to, subject: t.subject, html: t.html })
    },
    async sendRefunded(p: BookingEmailPayload) {
      const t = await BookingEmailTemplates.refunded(p)
      await sendEmail({ to: p.to, subject: t.subject, html: t.html })
    },
  }
}

export type { BookingEmailPayload } from './templates'
export { BookingEmailTemplates } from './templates'

