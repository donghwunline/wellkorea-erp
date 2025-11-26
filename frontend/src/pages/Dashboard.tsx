import { Box, Container, Typography, Button, AppBar, Toolbar } from '@mui/material'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            WellKorea ERP
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            {user?.username}
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to WellKorea ERP System
        </Typography>

        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            User Information
          </Typography>
          <Typography variant="body2">
            <strong>ID:</strong> {user?.id}
          </Typography>
          <Typography variant="body2">
            <strong>Username:</strong> {user?.username}
          </Typography>
          <Typography variant="body2">
            <strong>Email:</strong> {user?.email}
          </Typography>
          <Typography variant="body2">
            <strong>Roles:</strong> {user?.roles.join(', ')}
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}
