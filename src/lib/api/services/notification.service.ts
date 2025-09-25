/**
 * Notification Service
 * Handles all notification-related API calls
 */

import { BaseService } from '../base.service';
import { PaginatedResponse } from '../client';

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'announcement' | 'training' | 'earnings';
  isRead: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  data?: Record<string, any>;
}

export interface CreateNotificationRequest {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'announcement' | 'training' | 'earnings';
  userId: string;
  data?: Record<string, any>;
}

export interface BulkNotificationRequest {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'announcement' | 'training' | 'earnings';
  userIds: string[];
  data?: Record<string, any>;
}

export interface RoleAnnouncementRequest {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'announcement' | 'training' | 'earnings';
  role: 'admin' | 'pt_admin' | 'agent';
  data?: Record<string, any>;
}

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  type?: string;
  isRead?: boolean;
  startDate?: string;
  endDate?: string;
}

export class NotificationService extends BaseService {
  // ===== User Notification Management =====

  /**
   * List notifications for current user
   */
  async getNotifications(params?: NotificationQueryParams): Promise<PaginatedResponse<Notification>> {
    return this.getPaginated<Notification>('notifications', this.cleanParams(params || {}));
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<{ count: number }> {
    return this.getOne<{ count: number }>('notifications/unread-count');
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<void> {
    await this.action(`notifications/${id}/mark-read`);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await this.action('notifications/mark-all-read');
  }

  /**
   * Delete notification
   */
  async deleteNotification(id: string): Promise<void> {
    await this.delete(`notifications/${id}`);
  }

  // ===== Admin Notification Management =====

  /**
   * Send notification to specific user (admin only)
   */
  async sendNotification(data: CreateNotificationRequest): Promise<Notification> {
    return this.create<Notification, CreateNotificationRequest>('admin/notifications', data);
  }

  /**
   * Send bulk notifications (admin only)
   */
  async sendBulkNotifications(data: BulkNotificationRequest): Promise<{ 
    sent: number; 
    failed: number; 
    errors?: any[] 
  }> {
    return this.actionWithResult('admin/notifications/bulk', data);
  }

  /**
   * Send role-based announcement (admin only)
   */
  async sendRoleAnnouncement(data: RoleAnnouncementRequest): Promise<{ 
    sent: number; 
    failed: number; 
    errors?: any[] 
  }> {
    return this.actionWithResult('admin/notifications/announcement/role', data);
  }

  /**
   * Send global announcement (admin only)
   */
  async sendGlobalAnnouncement(data: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'announcement' | 'training' | 'earnings';
    data?: Record<string, any>;
  }): Promise<{ 
    sent: number; 
    failed: number; 
    errors?: any[] 
  }> {
    return this.actionWithResult('admin/notifications/announcement/all', data);
  }

  /**
   * Get notification statistics (admin only)
   */
  async getNotificationStats(): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
    byRole: Record<string, number>;
    recentActivity: any[];
  }> {
    return this.getOne('admin/notifications/stats');
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
