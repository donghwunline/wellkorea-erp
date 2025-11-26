import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Typography
} from '@mui/material'
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid'
import { Add as AddIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import jobcodeService from '../services/jobcodeService'
import {
  JobCode,
  JobCodeStatus,
  JobCodeStatusLabels,
  JobCodeStatusColors,
  PaginatedResponse
} from '../types/jobcode'

export default function JobCodeList() {
  const navigate = useNavigate()
  const [jobCodes, setJobCodes] = useState<PaginatedResponse<JobCode>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    page: 0,
    size: 20
  })
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<JobCodeStatus | ''>('')
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20
  })

  const loadJobCodes = async () => {
    try {
      setLoading(true)
      const data = await jobcodeService.listJobCodes({
        status: statusFilter || undefined,
        page: paginationModel.page,
        size: paginationModel.pageSize,
        sortBy: 'createdAt',
        sortDirection: 'DESC'
      })
      setJobCodes(data)
    } catch (error) {
      console.error('Failed to load JobCodes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadJobCodes()
  }, [paginationModel, statusFilter])

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value as JobCodeStatus | '')
    setPaginationModel({ ...paginationModel, page: 0 })
  }

  const handleCreateClick = () => {
    navigate('/jobcodes/create')
  }

  const handleRowClick = (params: any) => {
    navigate(`/jobcodes/${params.row.id}`)
  }

  const columns: GridColDef[] = [
    {
      field: 'code',
      headerName: 'JobCode',
      width: 200,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium" sx={{ cursor: 'pointer' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'projectName',
      headerName: 'Project Name',
      width: 250,
      flex: 1
    },
    {
      field: 'customer',
      headerName: 'Customer',
      width: 200,
      valueGetter: (params) => params.row.customer?.name || '-'
    },
    {
      field: 'owner',
      headerName: 'Owner',
      width: 150,
      valueGetter: (params) => params.row.owner?.username || '-'
    },
    {
      field: 'dueDate',
      headerName: 'Due Date',
      width: 130,
      valueFormatter: (params) => {
        if (!params.value) return '-'
        return new Date(params.value).toLocaleDateString()
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={JobCodeStatusLabels[params.value as JobCodeStatus]}
          color={JobCodeStatusColors[params.value as JobCodeStatus]}
          size="small"
        />
      )
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 150,
      valueFormatter: (params) => {
        if (!params.value) return '-'
        return new Date(params.value).toLocaleString()
      }
    }
  ]

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          JobCodes
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
        >
          Create JobCode
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="status-filter-label">Filter by Status</InputLabel>
          <Select
            labelId="status-filter-label"
            value={statusFilter}
            label="Filter by Status"
            onChange={handleStatusFilterChange}
          >
            <MenuItem value="">All Statuses</MenuItem>
            {Object.values(JobCodeStatus).map((status) => (
              <MenuItem key={status} value={status}>
                {JobCodeStatusLabels[status]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={jobCodes.content}
          columns={columns}
          loading={loading}
          paginationMode="server"
          rowCount={jobCodes.totalElements}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50, 100]}
          onRowClick={handleRowClick}
          sx={{
            '& .MuiDataGrid-row': {
              cursor: 'pointer'
            }
          }}
          disableRowSelectionOnClick
        />
      </Paper>
    </Container>
  )
}
