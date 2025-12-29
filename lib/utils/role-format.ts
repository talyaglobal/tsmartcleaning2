import { UserRole } from '@/lib/auth/roles'

/**
 * Formats a role enum value to a human-readable display name
 */
export function formatRoleName(role: string | UserRole | null | undefined): string {
  if (!role) return 'User'
  
  const roleStr = typeof role === 'string' ? role : role.toString()
  
  // Map role values to display names
  const roleMap: Record<string, string> = {
    'root_admin': 'Root Admin',
    'partner_admin': 'Partner Admin',
    'regional_manager': 'Regional Manager',
    'cleaning_company': 'Cleaning Company',
    'ambassador': 'Ambassador',
    'cleaning_lady': 'Cleaning Lady',
    'ngo_agency': 'NGO Agency',
    'tsmart_team': 'TSmart Team',
    'customer': 'Customer',
    'provider': 'Provider',
    'admin': 'Admin',
  }
  
  // Return mapped name or format the string nicely
  if (roleMap[roleStr.toLowerCase()]) {
    return roleMap[roleStr.toLowerCase()]
  }
  
  // Fallback: capitalize and replace underscores
  return roleStr
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

