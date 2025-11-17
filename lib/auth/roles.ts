export enum UserRole {
	ROOT_ADMIN = 'root_admin',
	PARTNER_ADMIN = 'partner_admin',
	REGIONAL_MANAGER = 'regional_manager',
	CLEANING_COMPANY = 'cleaning_company',
	DAYIBASI = 'dayibasi',
	CLEANING_LADY = 'cleaning_lady',
	NGO_AGENCY = 'ngo_agency',
	TSMART_TEAM = 'tsmart_team',
}

export type UserSession = {
	id: string;
	email: string;
	name: string;
	role: UserRole;
	companyId?: string | null;
	teamId?: string | null;
	permissions?: string[];
	profileImage?: string | null;
	isActive?: boolean;
	createdAt?: string;
};

export const isAdminRole = (role: UserRole): boolean => {
	return role === UserRole.ROOT_ADMIN || role === UserRole.PARTNER_ADMIN || role === UserRole.TSMART_TEAM || role === UserRole.CLEANING_COMPANY;
};


