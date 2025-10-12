/**
 * Payout Service
 * Handles all payout-related API calls
 */

import { BaseService } from '../base.service';
import { PaginatedResponse } from '../client';

// Payout Types
export interface Payout {
  id: string;
  agentId: string;
  amount: number;
  fees?: number;
  netAmount: number;
  currency: string;
  status: 'pending' | 'approved' | 'review';
  method: 'bank_transfer' | 'planettalk_credit';
  description?: string;
  paymentDetails: Record<string, any>;
  requestedAt: string;
  approvedAt?: string;
  reviewMessage?: string;
  adminNotes?: string;
  metadata?: Record<string, any>;
  agent: {
    id: string;
    agentCode: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePayoutRequest {
  amount: number;
  method: 'bank_transfer' | 'planettalk_credit';
  description?: string;
  paymentDetails: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface PayoutQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  agentId?: string;
  method?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface PayoutStats {
  total: number;
  totalAmount: number;
  totalFees: number;
  pending: number;
  pendingAmount: number;
  completed: number;
  completedAmount: number;
  rejected: number;
  rejectedAmount: number;
  averageProcessingTime: number; // in hours
  byStatus: Record<string, number>;
  byPaymentMethod: Record<string, number>;
  recentActivity: any[];
}

export interface BulkPayoutActionRequest {
  payoutIds: string[];
  action: 'approve' | 'reject' | 'process' | 'complete';
  reason?: string;
  transactionIds?: string[]; // for complete action
}

export class PayoutService extends BaseService {
  // ===== Agent Payout Management =====

  /**
   * Request payout for agent
   */
  async requestPayout(agentId: string, data: CreatePayoutRequest): Promise<Payout> {
    return this.create<Payout, CreatePayoutRequest>(`agents/${agentId}/payouts`, data);
  }

  /**
   * Get agent payouts
   */
  async getAgentPayouts(agentId: string, params?: PayoutQueryParams): Promise<PaginatedResponse<Payout>> {
    return this.getPaginated<Payout>(`agents/${agentId}/payouts`, this.cleanParams(params || {}));
  }

  /**
   * Get payout details
   */
  async getPayout(id: string): Promise<Payout> {
    return this.getOne<Payout>(`agents/payouts/${id}`);
  }

  /**
   * Cancel payout (agent only, before approval)
   */
  async cancelPayout(id: string): Promise<void> {
    await this.delete(`agents/payouts/${id}`);
  }

  /**
   * Get available balance for payout
   */
  async getAvailableBalance(agentId: string): Promise<{
    availableBalance: number;
    pendingBalance: number;
    totalEarnings: number;
    currency: string;
  }> {
    return this.getOne(`agents/${agentId}/payouts/available-balance`);
  }

  /**
   * Get payout fee calculation
   */
  async calculatePayoutFees(agentId: string, data: {
    amount: number;
    method: string;
  }): Promise<{
    amount: number;
    fees: number;
    netAmount: number;
    feeBreakdown: Record<string, number>;
  }> {
    return this.actionWithResult(`agents/${agentId}/payouts/calculate-fees`, data);
  }

  // ===== Admin Payout Management =====

  /**
   * Get all payouts (admin only)
   */
  async getAllPayouts(params?: PayoutQueryParams): Promise<PaginatedResponse<Payout>> {
    return this.getPaginated<Payout>('admin/payouts', this.cleanParams(params || {}));
  }

  /**
   * Get payout statistics (admin only)
   */
  async getPayoutStats(): Promise<PayoutStats> {
    return this.getOne<PayoutStats>('admin/payouts/stats');
  }

  /**
   * Get pending payouts (admin only)
   */
  async getPendingPayouts(): Promise<Payout[]> {
    return this.getMany<Payout>('admin/payouts', { status: 'pending_review' });
  }

  /**
   * Approve payout (admin only)
   */
  async approvePayout(id: string, data?: { adminNotes?: string }): Promise<Payout> {
    return this.actionWithResult<Payout>(`admin/payouts/${id}/approve`, data);
  }

  /**
   * Set payout to review status (admin only)
   */
  async setPayoutToReview(id: string, data: {
    reviewMessage: string;
    adminNotes?: string;
  }): Promise<Payout> {
    return this.actionWithResult<Payout>(`admin/payouts/${id}/review`, data);
  }

  /**
   * Process payout (admin only)
   */
  async processPayout(id: string, data?: { adminNotes?: string }): Promise<Payout> {
    return this.actionWithResult<Payout>(`admin/payouts/${id}/process`, data);
  }

  /**
   * Complete payout (admin only)
   */
  async completePayout(id: string, data: {
    transactionId: string;
    fees?: number;
    adminNotes?: string;
  }): Promise<Payout> {
    return this.actionWithResult<Payout>(`admin/payouts/${id}/complete`, data);
  }

  /**
   * Mark payout as failed (admin only)
   */
  async failPayout(id: string, data: {
    failureReason: string;
    adminNotes?: string;
  }): Promise<Payout> {
    return this.actionWithResult<Payout>(`admin/payouts/${id}/fail`, data);
  }

  /**
   * Bulk process payouts (admin only)
   */
  async bulkProcessPayouts(data: BulkPayoutActionRequest): Promise<{
    success: number;
    failed: number;
    errors?: any[];
  }> {
    return this.actionWithResult('admin/payouts/bulk-process', data);
  }

  /**
   * Bulk process payouts with new API format (admin only)
   */
  async bulkProcess(data: {
    payoutIds: string[];
    action: 'approve' | 'review';
    adminNotes?: string;
    individualMessages?: Array<{
      payoutId: string;
      reviewMessage: string;
    }>;
  }): Promise<{
    success: number;
    failed: number;
    errors?: string[];
    successfulPayouts?: Array<{
      payoutId: string;
      agentCode: string;
      amount: number;
      message: string;
    }>;
    failedPayouts?: Array<{
      payoutId: string;
      error: string;
    }>;
  }> {
    // Use direct client call to handle the response structure properly
    const response = await this.execute(() => 
      this.client.post('admin/payouts/bulk-process', data)
    );
    
    // The API returns the bulk response directly, not wrapped in ApiResponse
    return response as any;
  }

  /**
   * Get payout by ID (admin only)
   */
  async getPayoutById(id: string): Promise<Payout> {
    return this.getOne<Payout>(`admin/payouts/${id}`);
  }

  /**
   * Get payout history for agent (admin only)
   */
  async getAgentPayoutHistory(agentId: string, params?: PayoutQueryParams): Promise<PaginatedResponse<Payout>> {
    return this.getPaginated<Payout>(`admin/payouts/agent/${agentId}`, this.cleanParams(params || {}));
  }

  /**
   * Export payouts (admin only)
   */
  async exportPayouts(params?: PayoutQueryParams & { format?: 'csv' | 'xlsx' }): Promise<Blob> {
    const response = await this.execute(() => 
      this.client.get('admin/payouts/export', this.cleanParams(params || {}), {
        'Accept': params?.format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv'
      })
    );
    return new Blob([response], { 
      type: params?.format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv' 
    });
  }

  /**
   * Get payout trends (admin only)
   */
  async getPayoutTrends(params?: {
    period: 'daily' | 'weekly' | 'monthly';
    startDate?: string;
    endDate?: string;
  }): Promise<{
    period: string;
    data: Array<{
      date: string;
      totalAmount: number;
      totalFees: number;
      count: number;
      completedAmount: number;
      completedCount: number;
    }>;
  }> {
    return this.getOne('admin/payouts/trends', this.cleanParams(params || {}));
  }

  /**
   * Get payment method statistics (admin only)
   */
  async getPaymentMethodStats(): Promise<{
    byMethod: Record<string, {
      count: number;
      totalAmount: number;
      averageAmount: number;
      averageProcessingTime: number;
    }>;
  }> {
    return this.getOne('admin/payouts/payment-method-stats');
  }

  /**
   * Resend payout notification (admin only)
   */
  async resendPayoutNotification(id: string, type: 'approval' | 'completion' | 'rejection'): Promise<void> {
    await this.action(`admin/payouts/${id}/resend-notification`, { type });
  }

  /**
   * Get payout compliance check (admin only)
   */
  async getPayoutComplianceCheck(id: string): Promise<{
    isCompliant: boolean;
    checks: Array<{
      name: string;
      status: 'passed' | 'failed' | 'warning';
      message: string;
    }>;
    recommendation: 'approve' | 'review' | 'reject';
  }> {
    return this.getOne(`admin/payouts/${id}/compliance-check`);
  }
}

// Export singleton instance
export const payoutService = new PayoutService();
// Updated with new bulkProcess method
