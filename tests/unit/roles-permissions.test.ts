import { describe, it, expect } from 'vitest'
import { UserRole } from '@/lib/auth/roles'
import { rolePermissions, hasPermission } from '@/lib/auth/permissions'
import { isAdminRole, ADMIN_ROLES } from '@/lib/auth/rbac'

describe('Roles and Permissions', () => {
	describe('Role Definitions', () => {
		it('should have all expected roles defined', () => {
			expect(UserRole.ROOT_ADMIN).toBe('root_admin')
			expect(UserRole.PARTNER_ADMIN).toBe('partner_admin')
			expect(UserRole.REGIONAL_MANAGER).toBe('regional_manager')
			expect(UserRole.CLEANING_COMPANY).toBe('cleaning_company')
			expect(UserRole.AMBASSADOR).toBe('ambassador')
			expect(UserRole.CLEANING_LADY).toBe('cleaning_lady')
			expect(UserRole.NGO_AGENCY).toBe('ngo_agency')
			expect(UserRole.TSMART_TEAM).toBe('tsmart_team')
		})
	})

	describe('Permission System', () => {
		it('should grant all permissions to ROOT_ADMIN', () => {
			expect(hasPermission(UserRole.ROOT_ADMIN, '*')).toBe(true)
			expect(hasPermission(UserRole.ROOT_ADMIN, 'view_all_companies')).toBe(true)
			expect(hasPermission(UserRole.ROOT_ADMIN, 'any_permission')).toBe(true)
		})

		it('should grant correct permissions to PARTNER_ADMIN', () => {
			expect(hasPermission(UserRole.PARTNER_ADMIN, 'view_all_companies')).toBe(true)
			expect(hasPermission(UserRole.PARTNER_ADMIN, 'view_reports')).toBe(true)
			expect(hasPermission(UserRole.PARTNER_ADMIN, 'manage_invoices')).toBe(true)
			expect(hasPermission(UserRole.PARTNER_ADMIN, 'manage_teams')).toBe(true)
			expect(hasPermission(UserRole.PARTNER_ADMIN, 'assign_jobs')).toBe(true)
		})

		it('should grant correct permissions to CLEANING_COMPANY', () => {
			expect(hasPermission(UserRole.CLEANING_COMPANY, 'view_own_company')).toBe(true)
			expect(hasPermission(UserRole.CLEANING_COMPANY, 'manage_teams')).toBe(true)
			expect(hasPermission(UserRole.CLEANING_COMPANY, 'manage_cleaners')).toBe(true)
			expect(hasPermission(UserRole.CLEANING_COMPANY, 'assign_jobs')).toBe(true)
		})

		it('should grant correct permissions to AMBASSADOR', () => {
			expect(hasPermission(UserRole.AMBASSADOR, 'view_own_team')).toBe(true)
			expect(hasPermission(UserRole.AMBASSADOR, 'manage_team_members')).toBe(true)
			expect(hasPermission(UserRole.AMBASSADOR, 'view_jobs')).toBe(true)
			expect(hasPermission(UserRole.AMBASSADOR, 'assign_jobs')).toBe(true)
			expect(hasPermission(UserRole.AMBASSADOR, 'update_job_status')).toBe(true)
		})

		it('should grant correct permissions to CLEANING_LADY', () => {
			expect(hasPermission(UserRole.CLEANING_LADY, 'view_own_profile')).toBe(true)
			expect(hasPermission(UserRole.CLEANING_LADY, 'view_assigned_jobs')).toBe(true)
			expect(hasPermission(UserRole.CLEANING_LADY, 'clock_in_out')).toBe(true)
			expect(hasPermission(UserRole.CLEANING_LADY, 'view_earnings')).toBe(true)
			expect(hasPermission(UserRole.CLEANING_LADY, 'request_time_off')).toBe(true)
		})

		it('should deny permissions not granted to role', () => {
			expect(hasPermission(UserRole.CLEANING_LADY, 'view_all_companies')).toBe(false)
			expect(hasPermission(UserRole.AMBASSADOR, 'manage_invoices')).toBe(false)
			expect(hasPermission(UserRole.PARTNER_ADMIN, 'clock_in_out')).toBe(false)
		})
	})

	describe('Admin Role Detection', () => {
		it('should identify admin roles correctly', () => {
			expect(isAdminRole(UserRole.ROOT_ADMIN)).toBe(true)
			expect(isAdminRole(UserRole.PARTNER_ADMIN)).toBe(true)
			expect(isAdminRole(UserRole.TSMART_TEAM)).toBe(true)
			expect(isAdminRole(UserRole.CLEANING_COMPANY)).toBe(true)
		})

		it('should identify non-admin roles correctly', () => {
			expect(isAdminRole(UserRole.CLEANING_LADY)).toBe(false)
			expect(isAdminRole(UserRole.AMBASSADOR)).toBe(false)
			expect(isAdminRole(UserRole.NGO_AGENCY)).toBe(false)
			expect(isAdminRole(UserRole.REGIONAL_MANAGER)).toBe(false)
		})

		it('should have correct ADMIN_ROLES array', () => {
			expect(ADMIN_ROLES).toContain(UserRole.ROOT_ADMIN)
			expect(ADMIN_ROLES).toContain(UserRole.PARTNER_ADMIN)
			expect(ADMIN_ROLES).toContain(UserRole.TSMART_TEAM)
			expect(ADMIN_ROLES).toContain(UserRole.CLEANING_COMPANY)
			expect(ADMIN_ROLES).not.toContain(UserRole.CLEANING_LADY)
		})
	})

	describe('Permission Coverage', () => {
		it('should have permissions defined for all roles', () => {
			Object.values(UserRole).forEach(role => {
				expect(rolePermissions[role]).toBeDefined()
				expect(Array.isArray(rolePermissions[role])).toBe(true)
			})
		})

		it('should have non-empty permissions for all roles except ROOT_ADMIN', () => {
			Object.values(UserRole).forEach(role => {
				if (role !== UserRole.ROOT_ADMIN) {
					expect(rolePermissions[role].length).toBeGreaterThan(0)
				}
			})
		})
	})
})

