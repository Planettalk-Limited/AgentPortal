/**
 * User Service
 * Handles general user management API calls
 */

import { BaseService } from '../base.service';
import { PaginatedResponse } from '../client';
import {
  User,
  UserQueryParams,
} from '../types';

export class UserService extends BaseService {
  /**
   * Get all users (admin only) - Updated to use admin endpoint
   */
  async getUsers(params?: UserQueryParams): Promise<PaginatedResponse<User>> {
    return this.getPaginated<User>('admin/users', this.cleanParams(params || {}));
  }

  /**
   * Get user by ID (admin only) - Updated to use admin endpoint
   */
  async getUser(id: string): Promise<User> {
    return this.getOne<User>(`admin/users/${id}`);
  }

  /**
   * Get user statistics (admin only) - New endpoint
   */
  async getUserStats(): Promise<any> {
    return this.getOne<any>('admin/users/stats');
  }

  /**
   * Create user (admin only) - Updated to use admin endpoint
   */
  async createUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
    phoneNumber?: string;
  }): Promise<User> {
    return this.create<User>('admin/users', data);
  }

  /**
   * Update user (admin only) - Updated to use admin endpoint
   */
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return this.update<User>(`admin/users/${id}`, data);
  }

  /**
   * Delete user (admin only) - Updated to use admin endpoint
   */
  async deleteUser(id: string): Promise<void> {
    await this.delete(`admin/users/${id}`);
  }

  /**
   * Update user role (admin only) - New endpoint
   */
  async updateUserRole(id: string, data: { role: string; reason?: string }): Promise<User> {
    return this.update<User>(`admin/users/${id}/role`, data);
  }

  /**
   * Update user status (admin only) - New endpoint
   */
  async updateUserStatus(id: string, data: { status: string; reason?: string }): Promise<User> {
    return this.update<User>(`admin/users/${id}/status`, data);
  }

  /**
   * Reset user password (admin only) - New endpoint
   */
  async resetUserPassword(id: string): Promise<{ temporaryPassword: string }> {
    return this.actionWithResult<{ temporaryPassword: string }>(`admin/users/${id}/reset-password`);
  }

  /**
   * Force password change (admin only) - New endpoint
   */
  async forcePasswordChange(id: string): Promise<void> {
    await this.action(`admin/users/${id}/force-password-change`);
  }

  /**
   * Unlock user (admin only) - New endpoint
   */
  async unlockUser(id: string): Promise<User> {
    return this.actionWithResult<User>(`admin/users/${id}/unlock`);
  }

  /**
   * Bulk user actions (admin only) - New endpoint
   */
  async bulkUserActions(data: {
    userIds: string[];
    action: 'activate' | 'deactivate' | 'delete' | 'unlock';
    reason?: string;
  }): Promise<{ success: number; failed: number; errors?: any[] }> {
    return this.actionWithResult(`admin/users/bulk-actions`, data);
  }

  /**
   * Search users - Kept for backward compatibility
   */
  async searchUsers(query: string, params?: { limit?: number; role?: string }): Promise<User[]> {
    return this.getMany<User>('admin/users', { search: query, ...this.cleanParams(params || {}) });
  }
}

// Export singleton instance
export const userService = new UserService();
