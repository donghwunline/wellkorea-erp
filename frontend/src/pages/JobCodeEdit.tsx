import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material'
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import { useSnackbar } from 'notistack'
import jobcodeService from '../services/jobcodeService'
import {
  JobCode,
  UpdateJobCodeRequest,
  JobCodeStatus,
  JobCodeStatusLabels
} from '../types/jobcode'

export default function JobCodeEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()
  const [jobCode, setJobCode] = useState<JobCode | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<UpdateJobCodeRequest>({
    projectName: '',
    dueDate: '',
    description: '',
    status: undefined
  })

  const loadJobCode = async () => {
    if (!id) return

    try {
      setLoading(true)
      const data = await jobcodeService.getJobCodeById(id)
      setJobCode(data)
      setFormData({
        projectName: data.projectName,
        dueDate: data.dueDate,
        description: data.description || '',
        status: data.status
      })
      setError(null)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load JobCode'
      setError(errorMessage)
      enqueueSnackbar(errorMessage, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadJobCode()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
    setError(null)
  }

  const handleStatusChange = (e: SelectChangeEvent) => {
    setFormData((prev) => ({
      ...prev,
      status: e.target.value as JobCodeStatus
    }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!id) return

    // Basic validation
    if (!formData.projectName?.trim()) {
      setError('Project name is required')
      return
    }

    try {
      setSaving(true)
      const updatedJobCode = await jobcodeService.updateJobCode(id, formData)
      enqueueSnackbar(`JobCode ${updatedJobCode.code} updated successfully!`, { variant: 'success' })
      navigate(`/jobcodes/${id}`)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update JobCode'
      setError(errorMessage)
      enqueueSnackbar(errorMessage, { variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate(`/jobcodes/${id}`)
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  if (error && !jobCode) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  if (!jobCode) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">JobCode not found</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Edit JobCode: {jobCode.code}
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
            disabled={saving}
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
            disabled={saving}
            InputLabelProps={{
              shrink: true
            }}
            inputProps={{
              min: new Date().toISOString().split('T')[0]
            }}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              value={formData.status || ''}
              label="Status"
              onChange={handleStatusChange}
              disabled={saving}
            >
              {Object.values(JobCodeStatus).map((status) => (
                <MenuItem key={status} value={status}>
                  {JobCodeStatusLabels[status]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            disabled={saving}
          />

          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              startIcon={<SaveIcon />}
              disabled={saving}
              fullWidth
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              size="large"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={saving}
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
