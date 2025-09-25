/**
 * Agent Service
 * Handles all agent-related API calls
 */

import { BaseService } from '../base.service';
import { PaginatedResponse, ApiResponse } from '../client';
import {
  Agent,
  AgentApplication,
  CreateAgentApplicationRequest,
  ReviewApplicationRequest,
  AgentQueryParams,
  AgentDashboard,
  ReferralCode,
  CreateReferralCodeRequest,
  UseReferralCodeRequest,
  PublicUseReferralCodeRequest,
  ReferralCodeValidation,
  PublicReferralResponse,
  UseReferralCodeRequestEnhanced,
  UseReferralCodeResponse,
  Earning,
  EarningsSummary,
  CreateEarningAdjustmentRequest,
  EarningsQueryParams,
  Payout,
  CreatePayoutRequest,
  PayoutQueryParams,
} from '../types';

export class AgentService extends BaseService {
  // ===== Agent Management =====

  /**
   * Get current agent (for authenticated agent users)
   */
  async getCurrentAgent(): Promise<Agent> {
    // Direct call since agents/me returns agent data directly, not wrapped in ApiResponse
    return this.execute(() => 
      this.client.get<Agent>('agents/me')
    );
  }

  /**
   * Get all agents (admin only) - Updated to use admin endpoint
   */
  async getAgents(params?: AgentQueryParams): Promise<Agent[] | PaginatedResponse<Agent>> {
    try {
      // Try to get paginated response first
      return this.getPaginated<Agent>('admin/agents', this.cleanParams(params || {}));
    } catch (error) {
      // Fallback to direct array response
      return this.execute(() => this.client.get<Agent[]>('admin/agents', this.cleanParams(params || {})));
    }
  }

  /**
   * Get agent by ID (admin only) - Updated to use admin endpoint
   */
  async getAgent(id: string): Promise<Agent> {
    return this.getOne<Agent>(`admin/agents/${id}`);
  }

  /**
   * Get agent by user ID
   */
  async getAgentByUserId(userId: string): Promise<Agent> {
    
    try {
      // Try to get wrapped response first
      const wrappedResponse = await this.execute(() => 
        this.client.get<ApiResponse<Agent>>(`agents/by-user/${userId}`)
      );
      
      if (wrappedResponse && wrappedResponse.data) {
        return wrappedResponse.data;
      }
      
      const directResponse = await this.execute(() => this.client.get<Agent>(`agents/by-user/${userId}`));
      return directResponse;
      
    } catch (error) {
      const result = await this.execute(() => this.client.get<Agent>(`agents/by-user/${userId}`));
      return result;
    }
  }

  /**
   * Create agent (admin only) - Updated to use admin endpoint
   */
  async createAgent(data: any): Promise<Agent> {
    return this.create<Agent>('admin/agents', data);
  }

  /**
   * Update agent (admin only) - Updated to use admin endpoint
   */
  async updateAgent(id: string, data: Partial<Agent>): Promise<Agent> {
    return this.update<Agent>(`admin/agents/${id}`, data);
  }

  /**
   * Delete agent (admin only) - Updated to use admin endpoint
   */
  async deleteAgent(id: string): Promise<void> {
    await this.delete(`admin/agents/${id}`);
  }

  // ===== Agent Applications =====

  /**
   * Submit agent application
   */
  async submitApplication(data: CreateAgentApplicationRequest): Promise<AgentApplication> {
    return this.create<AgentApplication, CreateAgentApplicationRequest>('agents/applications', data);
  }

  /**
   * Submit public agent application
   */
  async submitPublicApplication(data: CreateAgentApplicationRequest): Promise<AgentApplication> {
    return this.create<AgentApplication, CreateAgentApplicationRequest>('public/agents/apply', data);
  }

  /**
   * Get all applications (admin only) - Updated to use admin endpoint
   */
  async getApplications(params?: { status?: string; page?: number; limit?: number }): Promise<AgentApplication[] | PaginatedResponse<AgentApplication>> {
    try {
      // Try to get paginated response first
      return this.getPaginated<AgentApplication>('admin/agents/applications', this.cleanParams(params || {}));
    } catch (error) {
      // Fallback to direct array response
      return this.execute(() => this.client.get<AgentApplication[]>('admin/agents/applications', this.cleanParams(params || {})));
    }
  }

  /**
   * Get application by ID (admin only) - Updated to use admin endpoint
   */
  async getApplication(id: string): Promise<AgentApplication> {
    return this.getOne<AgentApplication>(`admin/agents/applications/${id}`);
  }

  /**
   * Review application (admin only) - Updated to use admin endpoint
   */
  async reviewApplication(id: string, data: ReviewApplicationRequest): Promise<AgentApplication> {
    return this.update<AgentApplication, ReviewApplicationRequest>(`admin/agents/applications/${id}/review`, data);
  }

  // ===== Agent Workflow =====

  /**
   * Approve agent (admin only) - Updated to use admin endpoint
   */
  async approveAgent(id: string): Promise<Agent> {
    return this.actionWithResult<Agent>(`admin/agents/${id}/approve`);
  }

  /**
   * Send credentials to agent (admin only) - Updated to use admin endpoint
   */
  async sendCredentials(id: string): Promise<void> {
    await this.action(`admin/agents/${id}/send-credentials`);
  }

  /**
   * Activate agent
   */
  async activateAgent(id: string): Promise<Agent> {
    return this.actionWithResult<Agent>(`agents/${id}/activate`);
  }

  /**
   * Deactivate agent (admin only) - New endpoint
   */
  async deactivateAgent(id: string, reason?: string): Promise<Agent> {
    return this.actionWithResult<Agent>(`admin/agents/${id}/deactivate`, { reason });
  }

  /**
   * Reactivate agent (admin only) - New endpoint
   */
  async reactivateAgent(id: string, reason?: string): Promise<Agent> {
    return this.actionWithResult<Agent>(`admin/agents/${id}/reactivate`, { reason });
  }

  /**
   * Check inactive agents (admin only) - New endpoint
   */
  async checkInactiveAgents(): Promise<{ deactivatedCount: number; agentIds: string[] }> {
    return this.actionWithResult<{ deactivatedCount: number; agentIds: string[] }>('admin/agents/check-inactive');
  }

  // ===== Referral Codes =====

  /**
   * Create referral code for agent
   */
  async createReferralCode(agentId: string, data: CreateReferralCodeRequest): Promise<ReferralCode> {
    return this.create<ReferralCode, CreateReferralCodeRequest>(`agents/${agentId}/referral-codes`, data);
  }

  /**
   * Get agent's referral codes
   */
  async getAgentReferralCodes(agentId: string): Promise<ReferralCode[]> {
    return this.getMany<ReferralCode>(`agents/${agentId}/referral-codes`);
  }

  /**
   * Use referral code
   */
  async useReferralCode(code: string, data: UseReferralCodeRequest): Promise<void> {
    await this.action(`agents/referral-codes/${code}/use`, data);
  }

  /**
   * Validate referral code (public)
   */
  async validateReferralCode(code: string): Promise<ReferralCodeValidation> {
    return this.getOne<ReferralCodeValidation>(`public/agents/referral-codes/${code}/validate`);
  }

  // ===== New Referral Flow API Endpoints =====

  /**
   * Get personalized referral data (public endpoint)
   * Endpoint: GET /public/referral/:code
   * Purpose: Get agent's personalized referral message and validation
   * 
   * @param code - The referral code to validate (e.g., "DIASPORA2024")
   * @returns Promise<PublicReferralResponse> - Agent details, personalized message, and program info
   * 
   * @example
   * ```typescript
   * try {
   *   const referralData = await agentService.getPublicReferralData('DIASPORA2024');
   *   if (referralData.valid) {
   *     console.log(`Agent: ${referralData.agent?.fullName}`);
   *     console.log(`Message: ${referralData.personalizedMessage}`);
   *     console.log(`Remaining uses: ${referralData.codeDetails?.remainingUses}`);
   *   } else {
   *     console.log(`Error: ${referralData.message}`);
   *   }
   * } catch (error) {
   *   console.error('Failed to get referral data:', error);
   * }
   * ```
   */
  async getPublicReferralData(code: string): Promise<PublicReferralResponse> {
    return this.execute(() => 
      this.client.get<PublicReferralResponse>(`public/referral/${code}`)
    );
  }

  /**
   * Use referral code via public endpoint (no authentication required)
   * Endpoint: POST /public/referral/{agentCode}/use
   * Purpose: Submit referral code usage from public referral landing page
   * 
   * @param agentCode - The agent code (e.g., "AGT97902")
   * @param data - Customer information (fullName and phoneNumber)
   * @returns Promise<any> - Usage confirmation
   */
  async usePublicReferralCode(agentCode: string, data: PublicUseReferralCodeRequest): Promise<any> {
    return this.execute(() => 
      this.client.post<any>(`public/referral/${agentCode}/use`, data)
    );
  }

  /**
   * Use referral code with enhanced tracking (authenticated endpoint)
   * Endpoint: POST /agents/referral-codes/:code/use
   * Purpose: Validate referral code use and automatically create commission earnings
   * 
   * @param code - The referral code being used (e.g., "DIASPORA2024")
   * @param data - Customer information and transaction metadata
   * @returns Promise<UseReferralCodeResponse> - Usage confirmation with automatic earnings details
   * 
   * @example
   * ```typescript
   * try {
   *   const result = await agentService.useReferralCodeEnhanced('DIASPORA2024', {
   *     referredUserName: 'John Smith',
   *     referredUserEmail: 'john.smith@example.com',
   *     referredUserPhone: '+1234567890',
   *     metadata: {
   *       customerType: 'Individual',
   *       serviceType: 'Nigeria MTN Airtime',
   *       signupAmount: 25.00,
   *       country: 'Nigeria',
   *       carrier: 'MTN',
   *       source: 'planettalk-website',
   *       campaign: 'diaspora2024',
   *       notes: 'New customer signup via referral'
   *     }
   *   });
   *   
   *   console.log(`Usage confirmed: ${result.id}`);
   *   console.log(`Commission created: $${result.automaticEarnings.amount}`);
   *   console.log(`Agent notified: ${result.agentNotification.emailSent}`);
   * } catch (error) {
   *   console.error('Failed to use referral code:', error);
   * }
   * ```
   */
  async useReferralCodeEnhanced(code: string, data: UseReferralCodeRequestEnhanced): Promise<UseReferralCodeResponse> {
    return this.execute(() => 
      this.client.post<UseReferralCodeResponse>(`agents/referral-codes/${code}/use`, data)
    );
  }

  // ===== Earnings =====

  /**
   * Get agent earnings
   */
  async getAgentEarnings(agentId: string, params?: EarningsQueryParams): Promise<Earning[] | PaginatedResponse<Earning>> {
    try {
      return this.getPaginated<Earning>(`agents/${agentId}/earnings`, this.cleanParams(params || {}));
    } catch (error) {
      return this.execute(() => this.client.get<Earning[]>(`agents/${agentId}/earnings`, this.cleanParams(params || {})));
    }
  }

  /**
   * Get earnings summary
   */
  async getEarningsSummary(agentId: string): Promise<EarningsSummary> {
    return this.getOne<EarningsSummary>(`agents/${agentId}/earnings/summary`);
  }

  /**
   * Create earning adjustment (admin only) - Updated to use admin endpoint
   */
  async createEarningAdjustment(agentId: string, data: CreateEarningAdjustmentRequest): Promise<Earning> {
    return this.create<Earning, CreateEarningAdjustmentRequest>(`admin/agents/${agentId}/earnings/adjust`, data);
  }

  // ===== Dashboard =====
  // Dashboard data is now included in the agent response, no separate endpoint needed

  // ===== Payouts =====

  /**
   * Request payout
   */
  async requestPayout(agentId: string, data: CreatePayoutRequest): Promise<Payout> {
    return this.create<Payout, CreatePayoutRequest>(`agents/${agentId}/payouts`, data);
  }

  /**
   * Get agent payouts
   */
  async getAgentPayouts(agentId: string, params?: PayoutQueryParams): Promise<Payout[] | PaginatedResponse<Payout>> {
    try {
      return this.getPaginated<Payout>(`agents/${agentId}/payouts`, this.cleanParams(params || {}));
    } catch (error) {
      return this.execute(() => this.client.get<Payout[]>(`agents/${agentId}/payouts`, this.cleanParams(params || {})));
    }
  }

  /**
   * Get payout details
   */
  async getPayout(id: string): Promise<Payout> {
    return this.getOne<Payout>(`agents/payouts/${id}`);
  }

  /**
   * Cancel payout
   */
  async cancelPayout(id: string): Promise<void> {
    await this.delete(`agents/payouts/${id}`);
  }
}

// Export singleton instance
export const agentService = new AgentService();
