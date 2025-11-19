# Admin Documentation

**Last Updated:** 2025-01-27  
**Access Level:** Admin and Root Admin roles

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [User Management](#user-management)
4. [Company Management](#company-management)
5. [Booking Management](#booking-management)
6. [Insurance Management](#insurance-management)
7. [Reports & Analytics](#reports--analytics)
8. [Message Templates](#message-templates)
9. [System Settings](#system-settings)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the Admin Dashboard

1. Navigate to `/admin` in your browser
2. Log in with your admin credentials
3. You'll be redirected to the admin dashboard

### Admin Roles

- **Admin:** Standard admin access to manage users, bookings, and companies
- **Root Admin:** Full system access including tenant management and system-wide settings

### Permissions

Admin users have access to:
- User management (view, edit, suspend)
- Company verification and management
- Booking oversight and management
- Insurance policy and claim management
- Report generation and analytics
- Message template management

---

## Dashboard Overview

The admin dashboard provides a comprehensive overview of platform activity.

### Key Metrics

- **Total Users:** Total number of registered users
- **Active Providers:** Number of active service providers
- **Total Bookings:** Total bookings across the platform
- **Revenue:** Total platform revenue

### Recent Activity

View recent platform activity including:
- New user registrations
- Booking completions
- Provider verifications
- Payment processing

### Quick Actions

- View all users
- Manage companies
- Review bookings
- Generate reports

---

## User Management

**Location:** `/admin/users`

### Viewing Users

1. Navigate to **Users** in the admin sidebar
2. View all users in a table format
3. Filter by:
   - Role (customer, provider, admin)
   - Status (active, suspended)
   - Registration date

### User Actions

#### View User Details

1. Click on a user in the table
2. View:
   - Profile information
   - Booking history
   - Payment history
   - Activity log

#### Edit User

1. Click **Edit** on a user
2. Update:
   - Email address
   - Full name
   - Phone number
   - Role
   - Status
3. Save changes

#### Suspend User

1. Click **Suspend** on a user
2. Select suspension reason
3. Set suspension duration (optional)
4. Confirm suspension

#### Send Message to User

1. Click **Message** on a user
2. Choose channel:
   - Email
   - WhatsApp (if configured)
3. Select template or write custom message
4. Send message

### User Analytics

View user analytics including:
- Registration trends
- Active user counts
- User engagement metrics
- Geographic distribution

---

## Company Management

**Location:** `/admin/companies`

### Viewing Companies

1. Navigate to **Companies** in the admin sidebar
2. Search companies by:
   - Company name
   - Location
   - Verification status
   - Rating

### Company Verification

#### Review Verification Requests

1. Go to **Companies** → **Verification Requests**
2. Review submitted documents:
   - Business license
   - Insurance certificate
   - Background check results
3. Approve or reject verification

#### Verify a Company

1. Open company profile
2. Click **Verify Company**
3. Review all submitted documents
4. Add verification notes
5. Approve verification
6. Company receives verified badge

#### Suspend Company

1. Open company profile
2. Click **Suspend**
3. Select suspension reason
4. Set suspension duration
5. Confirm suspension

### Company Analytics

View company analytics:
- View company profile
- Booking statistics
- Revenue metrics
- Review summary
- Performance metrics

### Messaging Companies

1. Open company profile
2. Click **Send Message**
3. Choose channel (email or WhatsApp)
4. Select template or write custom message
5. Send message

### Company Reports

Generate reports for companies:
- Service performance
- Booking trends
- Revenue reports
- Customer satisfaction

---

## Booking Management

**Location:** `/admin/bookings`

### Viewing Bookings

1. Navigate to **Bookings** in the admin sidebar
2. View all bookings across the platform
3. Filter by:
   - Status (pending, confirmed, completed, cancelled)
   - Date range
   - Customer
   - Provider
   - Service type

### Booking Actions

#### View Booking Details

1. Click on a booking
2. View:
   - Customer information
   - Provider information
   - Service details
   - Address
   - Special instructions
   - Payment status
   - Booking timeline

#### Cancel Booking

1. Open booking details
2. Click **Cancel Booking**
3. Select cancellation reason
4. Process refund (if applicable)
5. Notify customer and provider

#### Reschedule Booking

1. Open booking details
2. Click **Reschedule**
3. Select new date and time
4. Confirm with customer and provider
5. Update booking

### Booking Analytics

View booking analytics:
- Booking trends over time
- Popular services
- Revenue by service type
- Geographic distribution
- Completion rates
- Cancellation rates

---

## Insurance Management

**Location:** `/admin/insurance`

### Insurance Dashboard

The insurance management section includes:
- **Analytics:** Overview of policies and claims
- **Policies:** Manage insurance policies
- **Claims:** Review and process claims
- **Certificates:** Generate insurance certificates

### Policy Management

#### Viewing Policies

1. Navigate to **Insurance** → **Policies**
2. View all insurance policies
3. Filter by:
   - Status (active, expired, cancelled)
   - Policyholder
   - Plan type
   - Date range

#### Creating a Policy

1. Click **Add Policy**
2. Enter:
   - User ID
   - Plan selection
   - Effective date
   - Expiration date
   - Billing cycle
   - Status
   - Auto-renew setting
3. Save policy

#### Editing a Policy

1. Click **Edit** on a policy
2. Update policy details
3. Save changes

#### Policy Status Management

- **Activate:** Activate a pending policy
- **Lapse:** Mark policy as expired
- **Cancel:** Cancel a policy (with proration)
- **Renew:** Renew an expired policy

### Claim Management

#### Viewing Claims

1. Navigate to **Insurance** → **Claims**
2. View all insurance claims
3. Filter by:
   - Status (filed, under_review, approved, denied, paid)
   - Claim code
   - Policyholder
   - Date range

#### Reviewing a Claim

1. Click on a claim to open details
2. Review:
   - Claim information
   - Policyholder details
   - Incident description
   - Submitted documents
   - Claim amount
3. Update claim status:
   - **Under Review:** Move to review stage
   - **Assign Adjuster:** Assign an adjuster
   - **Approve:** Approve the claim
   - **Deny:** Deny the claim (with reason)
   - **Pay:** Process payout

#### Claim Review Process

1. **Review Details:**
   - Assign adjuster
   - Add internal notes
   - Set amount to pay (if approved)
   - Add denial reason (if denied)

2. **Activity Log:**
   - View all claim activities
   - Add activity notes
   - Track status changes

3. **Documents:**
   - View submitted documents
   - Download documents
   - Request additional documents

4. **Process Payout:**
   - For approved claims
   - Process payment
   - Update claim status to "paid"

### Certificate Generation

1. Navigate to **Insurance** → **Certificates**
2. Select a policy
3. Click **Generate Certificate**
4. Certificate is generated as PDF
5. Download or email to policyholder

### Insurance Analytics

View insurance analytics:
- Total policies
- Active policies
- New policies
- Total revenue
- Total claims
- Claim amounts
- Policies by plan
- Claims by status
- Revenue trends

---

## Reports & Analytics

**Location:** `/admin/reports`

### Generating Reports

1. Navigate to **Reports**
2. Select report type:
   - User activity report
   - Booking report
   - Revenue report
   - Company performance report
   - Insurance report
3. Configure parameters:
   - Date range
   - Filters
   - Grouping options
4. Generate report
5. Download as PDF or CSV

### Report Templates

Pre-configured report templates:
- **Daily Summary:** Daily platform activity
- **Weekly Summary:** Weekly metrics and trends
- **Monthly Summary:** Monthly comprehensive report
- **Custom Report:** Create custom report

### Scheduling Reports

1. Create a report
2. Click **Schedule**
3. Set schedule:
   - Frequency (daily, weekly, monthly)
   - Recipients
   - Format (PDF, CSV)
4. Save schedule

### Analytics Dashboard

View real-time analytics:
- Key metrics
- Trend charts
- Geographic distribution
- Performance indicators

---

## Message Templates

**Location:** `/admin/message-templates`

### Managing Templates

1. Navigate to **Message Templates**
2. View all message templates
3. Create, edit, or delete templates

### Creating a Template

1. Click **Create Template**
2. Enter:
   - Template name
   - Subject (for email)
   - Message body
   - Variables (e.g., {{user_name}}, {{booking_date}})
3. Preview template
4. Save template

### Template Variables

Available variables:
- `{{user_name}}` - User's full name
- `{{user_email}}` - User's email
- `{{booking_id}}` - Booking ID
- `{{booking_date}}` - Booking date
- `{{service_name}}` - Service name
- `{{company_name}}` - Company name
- `{{amount}}` - Amount
- `{{link}}` - Dynamic link

### Sending Test Messages

1. Open a template
2. Click **Send Test**
3. Enter test recipient
4. Send test message

---

## System Settings

**Location:** `/admin/settings` (Root Admin only)

### General Settings

- Platform name
- Support email
- Support phone
- Timezone
- Date format
- Currency

### Email Settings

- SMTP configuration
- Email templates
- Email sending limits
- Bounce handling

### Payment Settings

- Stripe configuration
- Payment methods
- Refund policies
- Fee structures

### Notification Settings

- Email notifications
- SMS notifications
- Push notifications
- Notification preferences

---

## Troubleshooting

### Common Issues

#### Users Can't Access Admin

**Solution:**
1. Verify user has admin role
2. Check user status (not suspended)
3. Verify permissions
4. Clear browser cache

#### Companies Not Appearing

**Solution:**
1. Check company status
2. Verify filters
3. Check database connection
4. Review search query

#### Reports Not Generating

**Solution:**
1. Check date range
2. Verify data exists for date range
3. Check report template
4. Review error logs

#### Claims Not Processing

**Solution:**
1. Verify claim status
2. Check required documents
3. Verify policy is active
4. Review claim details

### Getting Help

For additional support:
1. Check error logs
2. Review system status
3. Contact technical support
4. Submit a support ticket

---

## Best Practices

### User Management

- Regularly review user activity
- Suspend inactive accounts
- Monitor for suspicious activity
- Keep user data up to date

### Company Verification

- Thoroughly review all documents
- Verify business licenses
- Check insurance certificates
- Maintain verification records

### Booking Management

- Monitor booking trends
- Address customer complaints promptly
- Track provider performance
- Review cancellation patterns

### Insurance Management

- Process claims promptly
- Maintain detailed records
- Follow claim review process
- Document all decisions

### Reports

- Schedule regular reports
- Review analytics regularly
- Share insights with team
- Use data to make decisions

---

## Security

### Access Control

- Use strong passwords
- Enable two-factor authentication
- Limit admin access
- Regularly review admin users

### Data Protection

- Don't share sensitive data
- Use secure connections
- Follow data retention policies
- Comply with privacy regulations

### Audit Logs

All admin actions are logged:
- User changes
- Company verifications
- Booking modifications
- Claim processing
- System settings changes

---

## Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [User Guides](./USER_GUIDES.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Component Documentation](./COMPONENT_DOCUMENTATION.md)

---

**Last Updated:** 2025-01-27

