export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  TEAM_MEMBER = 'TEAM_MEMBER',
  CLIENT = 'CLIENT',
}

export const roleLabels: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.ADMIN]: 'Admin',
  [UserRole.PROJECT_MANAGER]: 'Project Manager',
  [UserRole.TEAM_MEMBER]: 'Team Member',
  [UserRole.CLIENT]: 'Client',
};

export const hasPermission = (userRole: string, allowedRoles: UserRole[]): boolean => {
  return allowedRoles.includes(userRole as UserRole);
};

