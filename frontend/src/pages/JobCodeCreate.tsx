import React, { useState } from 'react'
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Alert
} from '@mui/material'
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useSnackbar } from 'notistack'
import jobcodeService from '../services/jobcodeService'
import { CreateJobCodeRequest } from '../types/jobcode'

export default function JobCodeCreate() {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateJobCodeRequest>({
    projectName: '',
    customerId: '',
    ownerId: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    description: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!formData.projectName.trim()) {
      setError('Project name is required')
      return
    }
    if (!formData.customerId.trim()) {
      setError('Customer ID is required')
      return
    }
    if (!formData.ownerId.trim()) {
      setError('Owner ID is required')
      return
    }
    if (!formData.dueDate) {
      setError('Due date is required')
      return
    }

    try {
      setLoading(true)
      const jobCode = await jobcodeService.createJobCode(formData)
      enqueueSnackbar(`JobCode ${jobCode.code} created successfully!`, { variant: 'success' })
      navigate(`/jobcodes/${jobCode.id}`)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create JobCode'
      setError(errorMessage)
      enqueueSnackbar(errorMessage, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/jobcodes')
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New JobCode
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
          Fill in the details to create a new project JobCode. The system will automatically generate a unique code.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            required
            label="Project Name"
            name="projectName"
            value={formData.projectName}
            onChange={handleChange}
            margin="normal"
            disabled={loading}
            helperText="Enter a descriptive name for the project"
          />

          <TextField
            fullWidth
            required
            label="Customer ID"
            name="customerId"
            value={formData.customerId}
            onChange={handleChange}
            margin="normal"
            disabled={loading}
            helperText="Enter the UUID of the customer (in production, this would be a dropdown)"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          />

          <TextField
            fullWidth
            required
            label="Owner ID"
            name="ownerId"
            value={formData.ownerId}
            onChange={handleChange}
            margin="normal"
            disabled={loading}
            helperText="Enter the UUID of the project owner (in production, this would be a dropdown)"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          />

          <TextField
            fullWidth
            required
            type="date"
            label="Due Date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            margin="normal"
            disabled={loading}
            InputLabelProps={{
              shrink: true
            }}
            inputProps={{
              min: new Date().toISOString().split('T')[0]
            }}
          />

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            disabled={loading}
            helperText="Optional: Add additional details about the project"
          />

          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              startIcon={<SaveIcon />}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Creating...' : 'Create JobCode'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              size="large"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={loading}
              fullWidth
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}
