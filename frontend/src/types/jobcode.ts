export enum JobCodeStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface CustomerInfo {
  id: string
  name: string
  companyRegistrationNumber?: string
}

export interface UserInfo {
  id: string
  username: string
  email: string
}

export interface JobCode {
  id: string
  code: string
  projectName: string
  customer: CustomerInfo
  owner: UserInfo
  dueDate: string
  status: JobCodeStatus
  description?: string
  createdAt: string
  updatedAt: string
}

export interface CreateJobCodeRequest {
  projectName: string
  customerId: string
  ownerId: string
  dueDate: string
  description?: string
}

export interface UpdateJobCodeRequest {
  projectName?: string
  customerId?: string
  ownerId?: string
  dueDate?: string
  description?: string
  status?: JobCodeStatus
}

export interface JobCodeListParams {
  status?: JobCodeStatus
  customerId?: string
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: 'ASC' | 'DESC'
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export const JobCodeStatusLabels: Record<JobCodeStatus, string> = {
  [JobCodeStatus.DRAFT]: 'Draft',
  [JobCodeStatus.ACTIVE]: 'Active',
  [JobCodeStatus.IN_PROGRESS]: 'In Progress',
  [JobCodeStatus.COMPLETED]: 'Completed',
  [JobCodeStatus.CANCELLED]: 'Cancelled'
}

export const JobCodeStatusColors: Record<JobCodeStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  [JobCodeStatus.DRAFT]: 'default',
  [JobCodeStatus.ACTIVE]: 'primary',
  [JobCodeStatus.IN_PROGRESS]: 'info',
  [JobCodeStatus.COMPLETED]: 'success',
  [JobCodeStatus.CANCELLED]: 'error'
}
