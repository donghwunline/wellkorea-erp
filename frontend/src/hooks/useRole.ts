import { useAuth } from './useAuth'

export function useRole() {
  const { user } = useAuth()

  const hasRole = (role: string): boolean => {
    if (!user || !user.roles) return false
    return user.roles.includes(role) || user.roles.includes(`ROLE_${role}`)
  }

  const hasAnyRole = (roles: string[]): boolean => {
    if (!user || !user.roles) return false
    return roles.some(role => hasRole(role))
  }

  const hasAllRoles = (roles: string[]): boolean => {
    if (!user || !user.roles) return false
    return roles.every(role => hasRole(role))
  }

  return {
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin: hasRole('ADMIN'),
    isFinance: hasRole('FINANCE'),
    isSales: hasRole('SALES'),
    isProduction: hasRole('PRODUCTION'),
    canAccessFinancialData: hasAnyRole(['ADMIN', 'FINANCE']),
    canEditQuotations: hasAnyRole(['ADMIN', 'FINANCE']),
    canManageUsers: hasRole('ADMIN'),
  }
}
