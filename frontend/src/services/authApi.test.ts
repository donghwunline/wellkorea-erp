/**
 * Tests for authApi service
 */

import {describe, it, expect, beforeEach, vi, type Mock} from 'vitest';
import {authApi} from './authApi';
import api from './api';
import apiService from './apiService';

// Mock dependencies
vi.mock('./api');
vi.mock('./apiService');

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should call apiService.post with correct parameters', async () => {
      const mockResponse = {
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        user: {id: 1, username: 'admin', email: 'admin@test.com', fullName: 'Admin', roles: ['ROLE_ADMIN']},
      };
      (apiService.post as Mock).mockResolvedValue(mockResponse);

      const credentials = {username: 'admin', password: 'password123'};
      const result = await authApi.login(credentials);

      expect(apiService.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result).toEqual(mockResponse);
    });

    it('should propagate errors from apiService', async () => {
      const error = new Error('Invalid credentials');
      (apiService.post as Mock).mockRejectedValue(error);

      await expect(authApi.login({username: 'test', password: 'wrong'})).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('logout', () => {
    it('should call api.post with correct path', async () => {
      (api.post as Mock).mockResolvedValue({});

      await authApi.logout();

      expect(api.post).toHaveBeenCalledWith('/auth/logout');
    });

    it('should return undefined on success', async () => {
      (api.post as Mock).mockResolvedValue({});

      const result = await authApi.logout();

      expect(result).toBeUndefined();
    });

    it('should propagate errors from api', async () => {
      const error = new Error('Network error');
      (api.post as Mock).mockRejectedValue(error);

      await expect(authApi.logout()).rejects.toThrow('Network error');
    });
  });

  describe('refreshToken', () => {
    it('should call apiService.post with correct path', async () => {
      const mockResponse = {
        accessToken: 'new-token',
        refreshToken: 'new-refresh-token',
        user: {id: 1, username: 'admin', email: 'admin@test.com', fullName: 'Admin', roles: ['ROLE_ADMIN']},
      };
      (apiService.post as Mock).mockResolvedValue(mockResponse);

      const result = await authApi.refreshToken();

      expect(apiService.post).toHaveBeenCalledWith('/auth/refresh');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCurrentUser', () => {
    it('should call apiService.get with correct path', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        email: 'admin@test.com',
        fullName: 'Admin User',
        roles: ['ROLE_ADMIN'],
      };
      (apiService.get as Mock).mockResolvedValue(mockUser);

      const result = await authApi.getCurrentUser();

      expect(apiService.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockUser);
    });
  });
});
