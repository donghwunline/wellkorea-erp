import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ReactNode } from 'react'
import { CircularProgress, Box } from '@mui/material'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRoles?: string[]
}

export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRoles && user) {
    const hasRequiredRole = requiredRoles.some(role =>
      user.roles.includes(role) || user.roles.includes(`ROLE_${role}`)
    )
    if (!hasRequiredRole) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <div>Access Denied</div>
        </Box>
      )
    }
  }

  return <>{children}</>
}
