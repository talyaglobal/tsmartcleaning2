import { ContactEmailTemplates, ContactFormNotificationPayload, ContactFormAutoReplyPayload } from './templates'
import { sendEmail } from '../smtp'

export type SendEmailFn = (args: { to: string; subject: string; html: string; text?: string }) => Promise<void>

/**
 * Send contact form notification email to support team
 */
export async function sendContactNotification(payload: ContactFormNotificationPayload): Promise<void> {
  const template = await ContactEmailTemplates.notification(payload)
  const contactEmail = process.env.CONTACT_EMAIL || 'whatsmartapp@tsmartsupport.com'
  
  await sendEmail({
    to: contactEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
    replyTo: payload.email, // Allow replying directly to the user
  })
}

/**
 * Send auto-reply email to the user who submitted the contact form
 */
export async function sendContactAutoReply(payload: ContactFormAutoReplyPayload): Promise<void> {
  const template = await ContactEmailTemplates.autoReply(payload)
  
  await sendEmail({
    to: payload.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  })
}

export type { ContactFormNotificationPayload, ContactFormAutoReplyPayload } from './templates'
export { ContactEmailTemplates } from './templates'

