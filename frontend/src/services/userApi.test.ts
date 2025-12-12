/**
 * Tests for userApi service
 */

import {describe, it, expect, beforeEach, vi, type Mock} from 'vitest';
import {userApi} from './userApi';
import apiService from './apiService';
import type {RoleName} from '@/types/auth';

// Mock dependencies
vi.mock('./apiService');

describe('userApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    fullName: 'Test User',
    isActive: true,
    roles: ['ROLE_SALES'] as RoleName[],
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: null,
  };

  const mockPaginatedResponse = {
    data: [mockUser],
    pagination: {
      page: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    },
  };

  describe('getUsers', () => {
    it('should call apiService.getPaginated with correct parameters', async () => {
      (apiService.getPaginated as Mock).mockResolvedValue(mockPaginatedResponse);

      const params = {page: 0, size: 10, search: 'test'};
      const result = await userApi.getUsers(params);

      expect(apiService.getPaginated).toHaveBeenCalledWith('/users', {params});
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should work without parameters', async () => {
      (apiService.getPaginated as Mock).mockResolvedValue(mockPaginatedResponse);

      await userApi.getUsers();

      expect(apiService.getPaginated).toHaveBeenCalledWith('/users', {params: undefined});
    });
  });

  describe('getUser', () => {
    it('should call apiService.get with correct path', async () => {
      (apiService.get as Mock).mockResolvedValue(mockUser);

      const result = await userApi.getUser(1);

      expect(apiService.get).toHaveBeenCalledWith('/users/1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('createUser', () => {
    it('should call apiService.post with correct parameters', async () => {
      (apiService.post as Mock).mockResolvedValue(mockUser);

      const request = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        fullName: 'New User',
        roles: ['ROLE_SALES'] as RoleName[],
      };
      const result = await userApi.createUser(request);

      expect(apiService.post).toHaveBeenCalledWith('/users', request);
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUser', () => {
    it('should call apiService.put with correct parameters', async () => {
      (apiService.put as Mock).mockResolvedValue(mockUser);

      const request = {fullName: 'Updated Name', email: 'updated@example.com'};
      const result = await userApi.updateUser(1, request);

      expect(apiService.put).toHaveBeenCalledWith('/users/1', request);
      expect(result).toEqual(mockUser);
    });
  });

  describe('assignRoles', () => {
    it('should call apiService.put with correct parameters', async () => {
      const updatedUser = {...mockUser, roles: ['ROLE_ADMIN', 'ROLE_SALES'] as RoleName[]};
      (apiService.put as Mock).mockResolvedValue(updatedUser);

      const request = {roles: ['ROLE_ADMIN', 'ROLE_SALES'] as RoleName[]};
      const result = await userApi.assignRoles(1, request);

      expect(apiService.put).toHaveBeenCalledWith('/users/1/roles', request);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('changePassword', () => {
    it('should call apiService.put with correct parameters', async () => {
      (apiService.put as Mock).mockResolvedValue(undefined);

      const request = {newPassword: 'newpassword123'};
      await userApi.changePassword(1, request);

      expect(apiService.put).toHaveBeenCalledWith('/users/1/password', request);
    });
  });

  describe('activateUser', () => {
    it('should call apiService.post with correct path', async () => {
      const activatedUser = {...mockUser, isActive: true};
      (apiService.post as Mock).mockResolvedValue(activatedUser);

      const result = await userApi.activateUser(1);

      expect(apiService.post).toHaveBeenCalledWith('/users/1/activate');
      expect(result).toEqual(activatedUser);
    });
  });

  describe('deleteUser', () => {
    it('should call apiService.delete with correct path', async () => {
      (apiService.delete as Mock).mockResolvedValue(undefined);

      await userApi.deleteUser(1);

      expect(apiService.delete).toHaveBeenCalledWith('/users/1');
    });
  });
});
