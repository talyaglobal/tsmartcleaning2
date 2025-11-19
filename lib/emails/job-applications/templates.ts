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

export class JobApplicationEmailTemplates {
  static async confirmation(payload: JobApplicationConfirmationPayload) {
    const { applicantName, jobTitle, applicationId, trackingUrl } = payload

    const subject = `Application Received - ${jobTitle}`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Application Received!</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Dear ${applicantName},</p>
            
            <p>Thank you for your interest in joining our team! We've successfully received your application for the <strong>${jobTitle}</strong> position.</p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0 0 10px 0;"><strong>Application ID:</strong> ${applicationId}</p>
              <p style="margin: 0;"><strong>Position:</strong> ${jobTitle}</p>
            </div>
            
            <h2 style="color: #667eea; margin-top: 30px;">What Happens Next?</h2>
            <ol style="line-height: 1.8;">
              <li>Our hiring team will review your application within 5-7 business days</li>
              <li>If your profile matches our requirements, we'll reach out to schedule an interview</li>
              <li>You can track your application status at any time using the link below</li>
            </ol>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${trackingUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Track Your Application</a>
            </div>
            
            <p>We appreciate your patience during the review process. If you have any questions, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>
            The TSmartCleaning Hiring Team</p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
            <p>This is an automated email. Please do not reply directly to this message.</p>
          </div>
        </body>
      </html>
    `

    const text = `
Application Received - ${jobTitle}

Dear ${applicantName},

Thank you for your interest in joining our team! We've successfully received your application for the ${jobTitle} position.

Application ID: ${applicationId}
Position: ${jobTitle}

What Happens Next?
1. Our hiring team will review your application within 5-7 business days
2. If your profile matches our requirements, we'll reach out to schedule an interview
3. You can track your application status at any time using this link: ${trackingUrl}

We appreciate your patience during the review process. If you have any questions, please don't hesitate to contact us.

Best regards,
The TSmartCleaning Hiring Team

---
This is an automated email. Please do not reply directly to this message.
    `

    return { subject, html, text }
  }

  static async notification(payload: JobApplicationNotificationPayload) {
    const { applicantName, applicantEmail, applicantPhone, jobTitle, jobDepartment, applicationId, applicationUrl } = payload

    const subject = `New Job Application: ${jobTitle} - ${applicantName}`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">New Job Application</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>A new job application has been submitted and requires review.</p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h2 style="margin-top: 0; color: #667eea;">Application Details</h2>
              <p><strong>Applicant:</strong> ${applicantName}</p>
              <p><strong>Email:</strong> <a href="mailto:${applicantEmail}">${applicantEmail}</a></p>
              ${applicantPhone ? `<p><strong>Phone:</strong> ${applicantPhone}</p>` : ''}
              <p><strong>Position:</strong> ${jobTitle}</p>
              <p><strong>Department:</strong> ${jobDepartment}</p>
              <p><strong>Application ID:</strong> ${applicationId}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${applicationUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Review Application</a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              Please review this application and update its status accordingly.
            </p>
          </div>
        </body>
      </html>
    `

    const text = `
New Job Application

A new job application has been submitted and requires review.

Application Details:
- Applicant: ${applicantName}
- Email: ${applicantEmail}
${applicantPhone ? `- Phone: ${applicantPhone}` : ''}
- Position: ${jobTitle}
- Department: ${jobDepartment}
- Application ID: ${applicationId}

Review Application: ${applicationUrl}

Please review this application and update its status accordingly.
    `

    return { subject, html, text }
  }

  static async statusUpdate(payload: JobApplicationStatusUpdatePayload) {
    const { applicantName, jobTitle, status, notes, applicationId, trackingUrl } = payload

    const statusLabels: Record<string, string> = {
      pending: 'Pending Review',
      reviewing: 'Under Review',
      interviewing: 'Interview Scheduled',
      offered: 'Offer Extended',
      rejected: 'Not Selected',
      withdrawn: 'Withdrawn',
      hired: 'Hired',
    }

    const statusLabel = statusLabels[status] || status

    const subject = `Application Status Update - ${jobTitle}`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Application Status Update</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Dear ${applicantName},</p>
            
            <p>We wanted to update you on the status of your application for the <strong>${jobTitle}</strong> position.</p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0 0 10px 0;"><strong>Status:</strong> ${statusLabel}</p>
              <p style="margin: 0 0 10px 0;"><strong>Position:</strong> ${jobTitle}</p>
              <p style="margin: 0;"><strong>Application ID:</strong> ${applicationId}</p>
              ${notes ? `<p style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;"><strong>Notes:</strong><br>${notes}</p>` : ''}
            </div>
            
            ${status === 'interviewing' ? `
              <p>We're excited to move forward with your application! Our team will contact you shortly to schedule an interview.</p>
            ` : status === 'offered' ? `
              <p>Congratulations! We're pleased to extend an offer to you. Our team will contact you with details soon.</p>
            ` : status === 'rejected' ? `
              <p>Thank you for your interest in TSmartCleaning. While we're unable to move forward with your application at this time, we appreciate the time you took to apply.</p>
            ` : status === 'hired' ? `
              <p>Congratulations! We're thrilled to welcome you to the team. Our onboarding team will contact you with next steps.</p>
            ` : `
              <p>We'll continue to keep you updated as we progress through our review process.</p>
            `}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${trackingUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Application</a>
            </div>
            
            <p>If you have any questions, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>
            The TSmartCleaning Hiring Team</p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
            <p>This is an automated email. Please do not reply directly to this message.</p>
          </div>
        </body>
      </html>
    `

    const text = `
Application Status Update - ${jobTitle}

Dear ${applicantName},

We wanted to update you on the status of your application for the ${jobTitle} position.

Status: ${statusLabel}
Position: ${jobTitle}
Application ID: ${applicationId}
${notes ? `\nNotes:\n${notes}` : ''}

${status === 'interviewing' ? 'We\'re excited to move forward with your application! Our team will contact you shortly to schedule an interview.' : status === 'offered' ? 'Congratulations! We\'re pleased to extend an offer to you. Our team will contact you with details soon.' : status === 'rejected' ? 'Thank you for your interest in TSmartCleaning. While we\'re unable to move forward with your application at this time, we appreciate the time you took to apply.' : status === 'hired' ? 'Congratulations! We\'re thrilled to welcome you to the team. Our onboarding team will contact you with next steps.' : 'We\'ll continue to keep you updated as we progress through our review process.'}

View Application: ${trackingUrl}

If you have any questions, please don't hesitate to contact us.

Best regards,
The TSmartCleaning Hiring Team

---
This is an automated email. Please do not reply directly to this message.
    `

    return { subject, html, text }
  }
}

