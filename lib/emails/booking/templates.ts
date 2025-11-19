import { loadBranding } from '@/lib/tenant'

export type BookingEmailPayload = {
  to: string
  userName: string
  bookingId: string
  bookingDate: string
  bookingTime: string
  serviceName: string
  address: string
  totalAmount: number
  status?: string
  tenantId?: string
  providerName?: string
  specialInstructions?: string
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

export const BookingEmailTemplates = {
  // Sent when booking is created (status: pending)
  confirmation: async (p: BookingEmailPayload) => {
    const b = await loadBranding(p.tenantId ?? null)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    return {
      subject: `Booking Confirmation - ${p.serviceName}`,
      html: wrapBrandingHtml(
        `
          <h1 style="margin: 0 0 8px 0;">Booking Confirmed, ${p.userName}!</h1>
          <p>Thank you for booking with us. We've received your booking request and will confirm it shortly.</p>
          
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin: 0 0 12px 0; font-size: 18px;">Booking Details</h2>
            <p style="margin: 8px 0;"><strong>Service:</strong> ${p.serviceName}</p>
            <p style="margin: 8px 0;"><strong>Date:</strong> ${formatDate(p.bookingDate)}</p>
            <p style="margin: 8px 0;"><strong>Time:</strong> ${formatTime(p.bookingTime)}</p>
            <p style="margin: 8px 0;"><strong>Address:</strong> ${p.address}</p>
            <p style="margin: 8px 0;"><strong>Total:</strong> ${formatCurrency(p.totalAmount)}</p>
            ${p.specialInstructions ? `<p style="margin: 8px 0;"><strong>Special Instructions:</strong> ${p.specialInstructions}</p>` : ''}
          </div>
          
          <p>You'll receive another email once your booking is confirmed by a provider.</p>
          <p style="margin-top: 20px;">
            <a href="${baseUrl}/customer/bookings/${p.bookingId}" style="background: ${b.primaryColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Booking</a>
          </p>
        `.trim(),
        { logoUrl: b.logoUrl, primaryColor: b.primaryColor }
      ),
    }
  },

  // Sent when booking status changes to confirmed
  confirmed: async (p: BookingEmailPayload) => {
    const b = await loadBranding(p.tenantId ?? null)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    return {
      subject: `Your ${p.serviceName} Booking is Confirmed!`,
      html: wrapBrandingHtml(
        `
          <h1 style="margin: 0 0 8px 0;">Great News, ${p.userName}!</h1>
          <p>Your booking has been confirmed and a provider has been assigned.</p>
          
          <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
            <h2 style="margin: 0 0 12px 0; font-size: 18px;">Confirmed Booking Details</h2>
            <p style="margin: 8px 0;"><strong>Service:</strong> ${p.serviceName}</p>
            <p style="margin: 8px 0;"><strong>Date:</strong> ${formatDate(p.bookingDate)}</p>
            <p style="margin: 8px 0;"><strong>Time:</strong> ${formatTime(p.bookingTime)}</p>
            <p style="margin: 8px 0;"><strong>Address:</strong> ${p.address}</p>
            ${p.providerName ? `<p style="margin: 8px 0;"><strong>Provider:</strong> ${p.providerName}</p>` : ''}
            <p style="margin: 8px 0;"><strong>Total:</strong> ${formatCurrency(p.totalAmount)}</p>
            ${p.specialInstructions ? `<p style="margin: 8px 0;"><strong>Special Instructions:</strong> ${p.specialInstructions}</p>` : ''}
          </div>
          
          <p>We'll send you a reminder 24 hours before your scheduled service.</p>
          <p style="margin-top: 20px;">
            <a href="${baseUrl}/customer/bookings/${p.bookingId}" style="background: ${b.primaryColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Booking</a>
          </p>
        `.trim(),
        { logoUrl: b.logoUrl, primaryColor: b.primaryColor }
      ),
    }
  },

  // Sent 24 hours before booking
  reminder: async (p: BookingEmailPayload) => {
    const b = await loadBranding(p.tenantId ?? null)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    return {
      subject: `Reminder: Your ${p.serviceName} is Tomorrow`,
      html: wrapBrandingHtml(
        `
          <h1 style="margin: 0 0 8px 0;">Reminder: Service Tomorrow, ${p.userName}</h1>
          <p>This is a friendly reminder that your service is scheduled for tomorrow.</p>
          
          <div style="background: #fffbeb; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h2 style="margin: 0 0 12px 0; font-size: 18px;">Service Details</h2>
            <p style="margin: 8px 0;"><strong>Service:</strong> ${p.serviceName}</p>
            <p style="margin: 8px 0;"><strong>Date:</strong> ${formatDate(p.bookingDate)}</p>
            <p style="margin: 8px 0;"><strong>Time:</strong> ${formatTime(p.bookingTime)}</p>
            <p style="margin: 8px 0;"><strong>Address:</strong> ${p.address}</p>
            ${p.providerName ? `<p style="margin: 8px 0;"><strong>Provider:</strong> ${p.providerName}</p>` : ''}
            ${p.specialInstructions ? `<p style="margin: 8px 0;"><strong>Special Instructions:</strong> ${p.specialInstructions}</p>` : ''}
          </div>
          
          <p>Please ensure someone will be available at the service address, or contact us if you need to reschedule.</p>
          <p style="margin-top: 20px;">
            <a href="${baseUrl}/customer/bookings/${p.bookingId}" style="background: ${b.primaryColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Booking</a>
          </p>
        `.trim(),
        { logoUrl: b.logoUrl, primaryColor: b.primaryColor }
      ),
    }
  },

  // Sent when booking status changes to in-progress
  inProgress: async (p: BookingEmailPayload) => {
    const b = await loadBranding(p.tenantId ?? null)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    return {
      subject: `Your ${p.serviceName} Service Has Started`,
      html: wrapBrandingHtml(
        `
          <h1 style="margin: 0 0 8px 0;">Service Started, ${p.userName}</h1>
          <p>Your service provider has arrived and started the service.</p>
          
          <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h2 style="margin: 0 0 12px 0; font-size: 18px;">Service In Progress</h2>
            <p style="margin: 8px 0;"><strong>Service:</strong> ${p.serviceName}</p>
            <p style="margin: 8px 0;"><strong>Date:</strong> ${formatDate(p.bookingDate)}</p>
            <p style="margin: 8px 0;"><strong>Time:</strong> ${formatTime(p.bookingTime)}</p>
            <p style="margin: 8px 0;"><strong>Address:</strong> ${p.address}</p>
            ${p.providerName ? `<p style="margin: 8px 0;"><strong>Provider:</strong> ${p.providerName}</p>` : ''}
          </div>
          
          <p>You'll receive a completion email once the service is finished.</p>
          <p style="margin-top: 20px;">
            <a href="${baseUrl}/customer/bookings/${p.bookingId}" style="background: ${b.primaryColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Booking</a>
          </p>
        `.trim(),
        { logoUrl: b.logoUrl, primaryColor: b.primaryColor }
      ),
    }
  },

  // Sent when booking status changes to completed
  completed: async (p: BookingEmailPayload) => {
    const b = await loadBranding(p.tenantId ?? null)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    return {
      subject: `Service Complete - How Was Your ${p.serviceName}?`,
      html: wrapBrandingHtml(
        `
          <h1 style="margin: 0 0 8px 0;">Service Complete, ${p.userName}!</h1>
          <p>Your service has been completed. We hope you're satisfied with the work!</p>
          
          <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
            <h2 style="margin: 0 0 12px 0; font-size: 18px;">Completed Service</h2>
            <p style="margin: 8px 0;"><strong>Service:</strong> ${p.serviceName}</p>
            <p style="margin: 8px 0;"><strong>Date:</strong> ${formatDate(p.bookingDate)}</p>
            <p style="margin: 8px 0;"><strong>Time:</strong> ${formatTime(p.bookingTime)}</p>
            <p style="margin: 8px 0;"><strong>Address:</strong> ${p.address}</p>
            ${p.providerName ? `<p style="margin: 8px 0;"><strong>Provider:</strong> ${p.providerName}</p>` : ''}
            <p style="margin: 8px 0;"><strong>Total:</strong> ${formatCurrency(p.totalAmount)}</p>
          </div>
          
          <p>We'd love to hear about your experience! Please take a moment to rate and review your service.</p>
          <p style="margin-top: 20px;">
            <a href="${baseUrl}/customer/bookings/${p.bookingId}/review" style="background: ${b.primaryColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 12px;">Leave a Review</a>
            <a href="${baseUrl}/customer/bookings/${p.bookingId}" style="background: white; color: ${b.primaryColor}; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; border: 2px solid ${b.primaryColor};">View Booking</a>
          </p>
        `.trim(),
        { logoUrl: b.logoUrl, primaryColor: b.primaryColor }
      ),
    }
  },

  // Sent when booking is cancelled
  cancelled: async (p: BookingEmailPayload) => {
    const b = await loadBranding(p.tenantId ?? null)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    return {
      subject: `Booking Cancelled - ${p.serviceName}`,
      html: wrapBrandingHtml(
        `
          <h1 style="margin: 0 0 8px 0;">Booking Cancelled, ${p.userName}</h1>
          <p>Your booking has been cancelled.</p>
          
          <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <h2 style="margin: 0 0 12px 0; font-size: 18px;">Cancelled Booking Details</h2>
            <p style="margin: 8px 0;"><strong>Service:</strong> ${p.serviceName}</p>
            <p style="margin: 8px 0;"><strong>Date:</strong> ${formatDate(p.bookingDate)}</p>
            <p style="margin: 8px 0;"><strong>Time:</strong> ${formatTime(p.bookingTime)}</p>
            <p style="margin: 8px 0;"><strong>Address:</strong> ${p.address}</p>
            <p style="margin: 8px 0;"><strong>Total:</strong> ${formatCurrency(p.totalAmount)}</p>
          </div>
          
          <p>If you paid for this booking, any refunds will be processed according to our cancellation policy.</p>
          <p style="margin-top: 20px;">
            <a href="${baseUrl}/customer/book" style="background: ${b.primaryColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Book Again</a>
          </p>
        `.trim(),
        { logoUrl: b.logoUrl, primaryColor: b.primaryColor }
      ),
    }
  },

  // Sent when booking is refunded
  refunded: async (p: BookingEmailPayload) => {
    const b = await loadBranding(p.tenantId ?? null)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    return {
      subject: `Refund Processed - ${p.serviceName} Booking`,
      html: wrapBrandingHtml(
        `
          <h1 style="margin: 0 0 8px 0;">Refund Processed, ${p.userName}</h1>
          <p>Your refund has been processed for the following booking.</p>
          
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin: 0 0 12px 0; font-size: 18px;">Refund Details</h2>
            <p style="margin: 8px 0;"><strong>Service:</strong> ${p.serviceName}</p>
            <p style="margin: 8px 0;"><strong>Date:</strong> ${formatDate(p.bookingDate)}</p>
            <p style="margin: 8px 0;"><strong>Refund Amount:</strong> ${formatCurrency(p.totalAmount)}</p>
          </div>
          
          <p>The refund should appear in your account within 5-10 business days, depending on your payment method.</p>
          <p style="margin-top: 20px;">
            <a href="${baseUrl}/customer/bookings/${p.bookingId}" style="background: ${b.primaryColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Booking</a>
          </p>
        `.trim(),
        { logoUrl: b.logoUrl, primaryColor: b.primaryColor }
      ),
    }
  },
}

