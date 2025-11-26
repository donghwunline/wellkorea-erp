import api from './api'
import {
  JobCode,
  CreateJobCodeRequest,
  UpdateJobCodeRequest,
  JobCodeListParams,
  PaginatedResponse
} from '../types/jobcode'

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  timestamp: string
}

/**
 * JobCode API Service
 * Provides CRUD operations for JobCode management
 */
class JobCodeService {
  private readonly baseURL = '/api/v1/jobcodes'

  /**
   * Create a new JobCode
   */
  async createJobCode(request: CreateJobCodeRequest): Promise<JobCode> {
    const response = await api.post<ApiResponse<JobCode>>(this.baseURL, request)
    return response.data.data
  }

  /**
   * Get a JobCode by ID
   */
  async getJobCodeById(id: string): Promise<JobCode> {
    const response = await api.get<ApiResponse<JobCode>>(`${this.baseURL}/${id}`)
    return response.data.data
  }

  /**
   * Get a JobCode by code
   */
  async getJobCodeByCode(code: string): Promise<JobCode> {
    const response = await api.get<ApiResponse<JobCode>>(`${this.baseURL}/code/${code}`)
    return response.data.data
  }

  /**
   * List JobCodes with pagination and filtering
   */
  async listJobCodes(params?: JobCodeListParams): Promise<PaginatedResponse<JobCode>> {
    const queryParams = new URLSearchParams()

    if (params?.status) {
      queryParams.append('status', params.status)
    }
    if (params?.customerId) {
      queryParams.append('customerId', params.customerId)
    }
    if (params?.page !== undefined) {
      queryParams.append('page', params.page.toString())
    }
    if (params?.size !== undefined) {
      queryParams.append('size', params.size.toString())
    }
    if (params?.sortBy) {
      queryParams.append('sortBy', params.sortBy)
    }
    if (params?.sortDirection) {
      queryParams.append('sortDirection', params.sortDirection)
    }

    const url = queryParams.toString()
      ? `${this.baseURL}?${queryParams.toString()}`
      : this.baseURL

    const response = await api.get<ApiResponse<PaginatedResponse<JobCode>>>(url)
    return response.data.data
  }

  /**
   * Update a JobCode
   */
  async updateJobCode(id: string, request: UpdateJobCodeRequest): Promise<JobCode> {
    const response = await api.put<ApiResponse<JobCode>>(`${this.baseURL}/${id}`, request)
    return response.data.data
  }

  /**
   * Delete a JobCode (only DRAFT status allowed)
   */
  async deleteJobCode(id: string): Promise<void> {
    await api.delete(`${this.baseURL}/${id}`)
  }
}

export default new JobCodeService()
