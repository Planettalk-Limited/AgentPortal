/**
 * Admin Service
 * Handles all admin-related API calls
 */

import { BaseService } from '../base.service';
import { PaginatedResponse, ApiResponse } from '../client';
import {
  User,
  UserQueryParams,
  UserStats,
  Agent,
  AgentStats,
  Earning,
  EarningsQueryParams,
  ApproveEarningRequest,
  RejectEarningRequest,
  BulkEarningsActionRequest,
  EarningsActionResponse,
  BulkEarningsActionResponse,
  Payout,
  PayoutStats,
  PayoutQueryParams,
  UpdatePayoutStatusRequest,
  SystemStats,
  SystemSettings,
  UpdateSystemSettingsRequest,
  AuditLog,
  AuditLogQueryParams,
  BulkUserActionRequest,
  BulkPayoutActionRequest,
  EmailTemplate,
  EmailPreviewRequest,
  SendTestEmailRequest,
  Resource,
  ResourceQueryParams,
  UploadResourceRequest,
  UpdateResourceRequest,
  BulkResourceUpdateRequest,
  BulkResourceDeleteRequest,
  ResourceStats,
  ResourceDownloadResponse,
} from '../types';

export class AdminService extends BaseService {
  // ===== User Management =====

  /**
   * Get all users (admin)
   */
  async getUsers(params?: UserQueryParams): Promise<PaginatedResponse<User>> {
    return this.getPaginated<User>('admin/users', this.cleanParams(params || {}));
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    return this.getOne<UserStats>('admin/users/stats');
  }

  /**
   * Update user role (admin)
   */
  async updateUserRole(id: string, data: { role: string; reason?: string }): Promise<User> {
    return this.update<User>(`admin/users/${id}/role`, data);
  }

  /**
   * Update user status (admin)
   */
  async updateUserStatus(id: string, data: { status: string; reason?: string }): Promise<User> {
    return this.update<User>(`admin/users/${id}/status`, data);
  }

  /**
   * Reset user password (admin)
   */
  async resetUserPassword(id: string): Promise<{ temporaryPassword: string }> {
    return this.actionWithResult<{ temporaryPassword: string }>(`admin/users/${id}/reset-password`);
  }

  /**
   * Force password change (admin)
   */
  async forcePasswordChange(id: string): Promise<void> {
    await this.action(`admin/users/${id}/force-password-change`);
  }

  /**
   * Unlock user (admin)
   */
  async unlockUser(id: string): Promise<User> {
    return this.actionWithResult<User>(`admin/users/${id}/unlock`);
  }

  /**
   * Bulk user actions (admin)
   */
  async bulkUserActions(data: BulkUserActionRequest): Promise<{ success: number; failed: number; errors?: any[] }> {
    return this.actionWithResult(`admin/users/bulk-actions`, data);
  }

  // ===== Payout Management =====

  /**
   * Get all payouts (admin)
   */
  async getAllPayouts(params?: PayoutQueryParams): Promise<PaginatedResponse<Payout>> {
    return this.getPaginated<Payout>('admin/payouts', this.cleanParams(params || {}));
  }

  /**
   * Get pending payouts (admin)
   */
  async getPendingPayouts(): Promise<Payout[]> {
    return this.getMany<Payout>('admin/payouts/pending');
  }

  /**
   * Get payout statistics (admin)
   */
  async getPayoutStats(): Promise<PayoutStats> {
    return this.getOne<PayoutStats>('admin/payouts/stats');
  }

  /**
   * Update payout status (admin)
   */
  async updatePayoutStatus(id: string, data: UpdatePayoutStatusRequest): Promise<Payout> {
    return this.update<Payout, UpdatePayoutStatusRequest>(`admin/payouts/${id}/status`, data);
  }

  /**
   * Approve payout (admin)
   */
  async approvePayout(id: string): Promise<Payout> {
    return this.actionWithResult<Payout>(`admin/payouts/${id}/approve`);
  }

  /**
   * Reject payout (admin)
   */
  async rejectPayout(id: string, data: { rejectionReason: string; adminNotes?: string }): Promise<Payout> {
    return this.actionWithResult<Payout>(`admin/payouts/${id}/reject`, data);
  }

  /**
   * Process payout (admin)
   */
  async processPayout(id: string): Promise<Payout> {
    return this.actionWithResult<Payout>(`admin/payouts/${id}/process`);
  }

  /**
   * Complete payout (admin)
   */
  async completePayout(id: string, data: { transactionId: string; fees?: number; adminNotes?: string }): Promise<Payout> {
    return this.actionWithResult<Payout>(`admin/payouts/${id}/complete`, data);
  }

  /**
   * Bulk process payouts (admin)
   */
  async bulkProcessPayouts(data: BulkPayoutActionRequest): Promise<{ success: number; failed: number; errors?: any[] }> {
    return this.actionWithResult(`admin/payouts/bulk-process`, data);
  }

  // ===== Agent Management =====

  /**
   * Get agent statistics (admin)
   */
  async getAgentStats(): Promise<AgentStats> {
    return this.getOne<AgentStats>('admin/agents/stats');
  }

  /**
   * Get system earnings summary (admin)
   */
  async getSystemEarningsSummary(): Promise<any> {
    return this.getOne('admin/earnings/summary');
  }

  /**
   * Get agent financial overview (admin)
   */
  async getAgentFinancialOverview(id: string): Promise<any> {
    return this.getOne(`admin/agents/${id}/financial-overview`);
  }

  /**
   * Suspend agent earnings (admin)
   */
  async suspendAgentEarnings(id: string, reason?: string): Promise<Agent> {
    return this.actionWithResult<Agent>(`admin/agents/${id}/suspend-earnings`, { reason });
  }

  /**
   * Resume agent earnings (admin)
   */
  async resumeAgentEarnings(id: string, reason?: string): Promise<Agent> {
    return this.actionWithResult<Agent>(`admin/agents/${id}/resume-earnings`, { reason });
  }

  // ===== Earnings Management =====

  /**
   * Get all earnings with optional filters
   */
  async getAllEarnings(params?: EarningsQueryParams): Promise<Earning[] | PaginatedResponse<Earning>> {
    try {
      return this.getPaginated<Earning>('admin/earnings', this.cleanParams(params || {}));
    } catch (error) {
      return this.execute(() => this.client.get<Earning[]>('admin/earnings', this.cleanParams(params || {})));
    }
  }

  /**
   * Get pending earnings for approval
   */
  async getPendingEarnings(params?: EarningsQueryParams): Promise<Earning[] | PaginatedResponse<Earning>> {
    try {
      return this.getPaginated<Earning>('admin/earnings/pending', this.cleanParams(params || {}));
    } catch (error) {
      return this.execute(() => this.client.get<Earning[]>('admin/earnings/pending', this.cleanParams(params || {})));
    }
  }

  /**
   * Approve individual earning
   */
  async approveEarning(earningId: string, data?: ApproveEarningRequest): Promise<EarningsActionResponse> {
    return this.execute(() => 
      this.client.post<EarningsActionResponse>(`admin/earnings/${earningId}/approve`, data || {})
    );
  }

  /**
   * Reject individual earning
   */
  async rejectEarning(earningId: string, data: RejectEarningRequest): Promise<EarningsActionResponse> {
    return this.execute(() => 
      this.client.post<EarningsActionResponse>(`admin/earnings/${earningId}/reject`, data)
    );
  }

  /**
   * Bulk approve earnings
   */
  async bulkApproveEarnings(data: BulkEarningsActionRequest): Promise<BulkEarningsActionResponse> {
    return this.execute(() => 
      this.client.post<BulkEarningsActionResponse>('admin/earnings/bulk-approve', data)
    );
  }

  /**
   * Bulk reject earnings
   */
  async bulkRejectEarnings(data: BulkEarningsActionRequest): Promise<BulkEarningsActionResponse> {
    return this.execute(() => 
      this.client.post<BulkEarningsActionResponse>('admin/earnings/bulk-reject', data)
    );
  }

  /**
   * Bulk upload earnings
   */
  async bulkUploadEarnings(payload: {
    earnings: Array<{
      agentCode: string
      amount: number
      type: 'referral_commission' | 'bonus' | 'penalty' | 'adjustment' | 'promotion_bonus'
      description: string
      referenceId?: string
      commissionRate?: number
      earnedAt?: string
      currency?: string
    }>
    batchDescription?: string
    autoConfirm?: boolean
    metadata?: any
  }): Promise<{
    totalProcessed: number
    successful: number
    failed: number
    skipped: number
    totalAmount: number
    updatedAgents: string[]
    details: Array<{
      agentCode: string
      status: 'success' | 'failed' | 'skipped'
      earningId?: string
      amount: number
      message?: string
      error?: string
    }>
    errorSummary: {
      invalidAgentCodes: string[]
      duplicateReferences: string[]
      validationErrors: string[]
      otherErrors: string[]
    }
    batchInfo: {
      batchId: string
      processedAt: string
      processingTimeMs: number
      uploadedBy: string
    }
  }> {
    return this.execute(() => 
      this.client.post('admin/earnings/bulk-upload', payload)
    );
  }

  /**
   * Export earnings (admin only)
   */
  async exportEarnings(params?: EarningsQueryParams & { format?: 'csv' | 'xlsx' }): Promise<Blob> {
    const response = await this.execute(() => 
      this.client.get('admin/earnings/export', this.cleanParams(params || {}), {
        'Accept': params?.format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv'
      })
    );
    return new Blob([response], { 
      type: params?.format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv' 
    });
  }

  // ===== Resource Management =====

  /**
   * Upload a new resource file
   */
  async uploadResource(data: UploadResourceRequest): Promise<Resource> {
    // Validate required fields before creating FormData
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      throw new Error('Title is required and must be a non-empty string');
    }
    if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
      throw new Error('Description is required and must be a non-empty string');
    }
    if (data.title.length > 255) {
      throw new Error('Title must be 255 characters or less');
    }

    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('title', data.title.trim());
    formData.append('description', data.description.trim());
    formData.append('type', data.type);
    formData.append('category', data.category);
    formData.append('visibility', data.visibility);
    
    // Send boolean as "true"/"false" string for API compatibility
    formData.append('isFeatured', data.isFeatured ? "true" : "false");
    
    if (data.publishedAt) formData.append('publishedAt', data.publishedAt);
    if (data.expiresAt) formData.append('expiresAt', data.expiresAt);
    if (data.tags && data.tags.length > 0) {
      // Send as JSON string for array data
      formData.append('tags', JSON.stringify(data.tags));
    }
    if (data.metadata) formData.append('metadata', JSON.stringify(data.metadata));

    return this.execute(() => 
      this.client.post<Resource>('admin/resources/upload', formData)
    );
  }

  /**
   * Get all resources with filtering and pagination
   */
  async getResources(params?: ResourceQueryParams): Promise<PaginatedResponse<Resource>> {
    return this.getPaginated<Resource>('admin/resources', this.cleanParams(params || {}));
  }

  /**
   * Update resource metadata
   */
  async updateResource(id: string, data: UpdateResourceRequest): Promise<Resource> {
    return this.update<Resource>(`admin/resources/${id}`, data);
  }

  /**
   * Delete resource
   */
  async deleteResource(id: string): Promise<{ success: boolean; message: string }> {
    return this.execute(() => 
      this.client.delete(`admin/resources/${id}`)
    );
  }

  /**
   * Get resource download URL
   */
  async getResourceDownloadUrl(id: string): Promise<ResourceDownloadResponse> {
    return this.execute(() => 
      this.client.get<ResourceDownloadResponse>(`admin/resources/${id}/download-url`)
    );
  }

  /**
   * Bulk update resources
   */
  async bulkUpdateResources(data: BulkResourceUpdateRequest): Promise<{ updated: number; failed: number }> {
    return this.execute(() => 
      this.client.post('admin/resources/bulk-update', data)
    );
  }

  /**
   * Bulk delete resources
   */
  async bulkDeleteResources(data: BulkResourceDeleteRequest): Promise<{ deleted: number; failed: number }> {
    return this.execute(() => 
      this.client.post('admin/resources/bulk-delete', data)
    );
  }

  /**
   * Get resource statistics
   */
  async getResourceStats(): Promise<ResourceStats> {
    return this.execute(() => 
      this.client.get<ResourceStats>('admin/resources/stats')
    );
  }

  // ===== System Management =====

  /**
   * Get admin dashboard data
   */
  async getDashboard(): Promise<any> {
    try {
      // Try to get wrapped response first
      const wrappedResponse = await this.execute(() =>
        this.client.get<ApiResponse<any>>('admin/system/dashboard')
      );

      if (wrappedResponse && wrappedResponse.data) {
        return wrappedResponse.data;
      }

      // If wrapped response doesn't have data, try direct response
      const directResponse = await this.execute(() => 
        this.client.get<any>('admin/system/dashboard')
      );
      return directResponse;

    } catch (error) {
      // Fallback to direct response
      const result = await this.execute(() => 
        this.client.get<any>('admin/system/dashboard')
      );
      return result;
    }
  }

  /**
   * Get system health
   */
  async getSystemHealth(): Promise<any> {
    return this.getOne('admin/system/health');
  }

  /**
   * Get system statistics
   */
  async getSystemStats(): Promise<SystemStats> {
    return this.getOne<SystemStats>('admin/system/stats');
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(params?: AuditLogQueryParams): Promise<PaginatedResponse<AuditLog>> {
    return this.getPaginated<AuditLog>('admin/system/audit-logs', this.cleanParams(params || {}));
  }

  /**
   * Get system settings
   */
  async getSystemSettings(): Promise<SystemSettings> {
    return this.getOne<SystemSettings>('admin/system/settings');
  }

  /**
   * Update system settings
   */
  async updateSystemSettings(data: UpdateSystemSettingsRequest): Promise<SystemSettings> {
    return this.update<SystemSettings, UpdateSystemSettingsRequest>('admin/system/settings', data);
  }

  /**
   * Enable maintenance mode
   */
  async enableMaintenanceMode(reason?: string): Promise<void> {
    await this.action('admin/system/maintenance-mode', { reason });
  }

  /**
   * Disable maintenance mode
   */
  async disableMaintenanceMode(): Promise<void> {
    await this.delete('admin/system/maintenance-mode');
  }

  /**
   * Create backup
   */
  async createBackup(): Promise<{ backupId: string; filename: string }> {
    return this.actionWithResult('admin/system/backup');
  }

  /**
   * List backups
   */
  async listBackups(): Promise<{ backupId: string; filename: string; size: number; createdAt: string }[]> {
    return this.getMany('admin/system/backups');
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    await this.action('admin/system/cache/clear');
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<any> {
    return this.getOne('admin/system/performance');
  }

  /**
   * Get error logs
   */
  async getErrorLogs(params?: { page?: number; limit?: number; level?: string; startDate?: string; endDate?: string }): Promise<PaginatedResponse<any>> {
    return this.getPaginated('admin/system/errors', this.cleanParams(params || {}));
  }

  // ===== Email Templates =====

  /**
   * Get available email templates
   */
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return this.getMany<EmailTemplate>('admin/email-templates');
  }

  /**
   * Preview email template
   */
  async previewEmailTemplate(data: EmailPreviewRequest): Promise<{ html: string; text: string; subject: string }> {
    return this.actionWithResult('admin/email-templates/preview', data);
  }

  /**
   * Send test email
   */
  async sendTestEmail(data: SendTestEmailRequest): Promise<void> {
    await this.action('admin/email-templates/test-send', data);
  }

  /**
   * Get sample template data
   */
  async getSampleTemplateData(): Promise<Record<string, any>> {
    return this.getOne('admin/email-templates/samples');
  }

  /**
   * Clear template cache
   */
  async clearTemplateCache(): Promise<void> {
    await this.action('admin/email-templates/clear-cache');
  }

  /**
   * Validate template
   */
  async validateEmailTemplate(name: string): Promise<{ isValid: boolean; errors?: string[] }> {
    return this.getOne(`admin/email-templates/validate/${name}`);
  }

  // ===== Reports & Analytics =====

  /**
   * Export users to CSV
   */
  async exportUsers(params?: UserQueryParams): Promise<Blob> {
    const response = await this.execute(() => 
      this.client.get('admin/reports/users/export', this.cleanParams(params || {}), {
        'Accept': 'text/csv'
      })
    );
    return new Blob([response], { type: 'text/csv' });
  }

  /**
   * Export payouts to CSV
   */
  async exportPayouts(params?: PayoutQueryParams): Promise<Blob> {
    const response = await this.execute(() => 
      this.client.get('admin/reports/payouts/export', this.cleanParams(params || {}), {
        'Accept': 'text/csv'
      })
    );
    return new Blob([response], { type: 'text/csv' });
  }

  /**
   * Export agents to CSV
   */
  async exportAgents(params?: any): Promise<Blob> {
    const response = await this.execute(() => 
      this.client.get('admin/reports/agents/export', this.cleanParams(params || {}), {
        'Accept': 'text/csv'
      })
    );
    return new Blob([response], { type: 'text/csv' });
  }

  // ===== Notes =====
  // Payout operations have been moved to the dedicated PayoutService
  // Notification operations have been moved to the dedicated NotificationService
  // Training operations have been moved to the dedicated TrainingService
  // Use those services for new implementations
}

// Export singleton instance
export const adminService = new AdminService();
