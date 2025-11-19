import { sendEmail } from '../smtp'
import { JobApplicationEmailTemplates } from './templates'

export type SendEmailFn = (args: { to: string; subject: string; html: string; text?: string }) => Promise<void>

export interface JobApplicationConfirmationPayload {
  applicantName: string
  applicantEmail: string
  jobTitle: string
  applicationId: string
  trackingUrl: string
}

export interface JobApplicationNotificationPayload {
  applicantName: string
  applicantEmail: string
  applicantPhone?: string
  jobTitle: string
  jobDepartment: string
  applicationId: string
  applicationUrl: string
}

export interface JobApplicationStatusUpdatePayload {
  applicantName: string
  applicantEmail: string
  jobTitle: string
  status: string
  notes?: string
  applicationId: string
  trackingUrl: string
}

/**
 * Send confirmation email to applicant after submission
 */
export async function sendJobApplicationConfirmation(
  payload: JobApplicationConfirmationPayload
): Promise<void> {
  const template = await JobApplicationEmailTemplates.confirmation(payload)
  
  await sendEmail({
    to: payload.applicantEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  })
}

/**
 * Send notification email to hiring team when new application is submitted
 */
export async function sendJobApplicationNotification(
  payload: JobApplicationNotificationPayload
): Promise<void> {
  const template = await JobApplicationEmailTemplates.notification(payload)
  const hiringEmail = process.env.HIRING_EMAIL || process.env.CONTACT_EMAIL || 'whatsmartapp@tsmartsupport.com'
  
  await sendEmail({
    to: hiringEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
    replyTo: payload.applicantEmail,
  })
}

/**
 * Send status update email to applicant
 */
export async function sendJobApplicationStatusUpdate(
  payload: JobApplicationStatusUpdatePayload
): Promise<void> {
  const template = await JobApplicationEmailTemplates.statusUpdate(payload)
  
  await sendEmail({
    to: payload.applicantEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  })
}

export { JobApplicationEmailTemplates } from './templates'

