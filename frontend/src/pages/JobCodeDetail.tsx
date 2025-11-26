import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material'
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import { useSnackbar } from 'notistack'
import jobcodeService from '../services/jobcodeService'
import {
  JobCode,
  JobCodeStatus,
  JobCodeStatusLabels,
  JobCodeStatusColors
} from '../types/jobcode'

export default function JobCodeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()
  const [jobCode, setJobCode] = useState<JobCode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadJobCode = async () => {
    if (!id) return

    try {
      setLoading(true)
      const data = await jobcodeService.getJobCodeById(id)
      setJobCode(data)
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

  const handleEdit = () => {
    navigate(`/jobcodes/${id}/edit`)
  }

  const handleDelete = async () => {
    if (!id || !jobCode) return

    if (jobCode.status !== JobCodeStatus.DRAFT) {
      enqueueSnackbar('Only DRAFT JobCodes can be deleted', { variant: 'error' })
      return
    }

    if (!window.confirm(`Are you sure you want to delete JobCode ${jobCode.code}?`)) {
      return
    }

    try {
      await jobcodeService.deleteJobCode(id)
      enqueueSnackbar('JobCode deleted successfully', { variant: 'success' })
      navigate('/jobcodes')
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete JobCode'
      enqueueSnackbar(errorMessage, { variant: 'error' })
    }
  }

  const handleBack = () => {
    navigate('/jobcodes')
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  if (error || !jobCode) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error || 'JobCode not found'}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mt: 2 }}>
          Back to List
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mr: 2 }}>
          Back
        </Button>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          JobCode Details
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<EditIcon />}
          onClick={handleEdit}
          sx={{ mr: 1 }}
        >
          Edit
        </Button>
        {jobCode.status === JobCodeStatus.DRAFT && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        )}
      </Box>

      <Paper sx={{ p: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h5" component="h2">
                {jobCode.code}
              </Typography>
              <Chip
                label={JobCodeStatusLabels[jobCode.status]}
                color={JobCodeStatusColors[jobCode.status]}
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Project Name
            </Typography>
            <Typography variant="body1">{jobCode.projectName}</Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Customer
            </Typography>
            <Typography variant="body1">{jobCode.customer.name}</Typography>
            {jobCode.customer.companyRegistrationNumber && (
              <Typography variant="caption" color="text.secondary">
                {jobCode.customer.companyRegistrationNumber}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Owner
            </Typography>
            <Typography variant="body1">{jobCode.owner.username}</Typography>
            <Typography variant="caption" color="text.secondary">
              {jobCode.owner.email}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Due Date
            </Typography>
            <Typography variant="body1">
              {new Date(jobCode.dueDate).toLocaleDateString()}
            </Typography>
          </Grid>

          {jobCode.description && (
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" display="block">
                Description
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {jobCode.description}
              </Typography>
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Created At
            </Typography>
            <Typography variant="body2">
              {new Date(jobCode.createdAt).toLocaleString()}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Last Updated
            </Typography>
            <Typography variant="body2">
              {new Date(jobCode.updatedAt).toLocaleString()}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  )
}
