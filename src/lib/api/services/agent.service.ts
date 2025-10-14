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
  Resource,
  ResourceQueryParams,
  ResourceDownloadResponse,
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
    const response = await this.execute(() => 
      this.client.get<any>(`admin/agents/${id}`)
    );
    
    // Handle wrapped response
    if (response?.data) {
      return response.data;
    }
    
    // Handle direct agent response
    if (response?.agentCode) {
      return response;
    }
    
    throw new Error('Invalid response from get agent API');
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
    const response = await this.execute(() => 
      this.client.post<ApiResponse<Agent>>('admin/agents', data)
    );
    
    // Return the data directly from response
    if (response?.data) {
      return response.data;
    }
    
    // If response itself looks like an agent (has agentCode), return it
    if ((response as any)?.agentCode) {
      return response as unknown as Agent;
    }
    
    throw new Error('Invalid response from create agent API');
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
   *     // Process referral data
   *     // Agent: ${referralData.agent?.fullName}
   *     // Message: ${referralData.personalizedMessage}
   *     // Remaining uses: ${referralData.codeDetails?.remainingUses}
   *   } else {
   *     // Handle error: ${referralData.message}
   *   }
   * } catch (error) {
   *   // Handle error: Failed to get referral data
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
   *   // Usage confirmed: ${result.id}
   *   // Commission created: $${result.automaticEarnings.amount}
   *   // Agent notified: ${result.agentNotification.emailSent}
   * } catch (error) {
   *   // Handle error: Failed to use referral code
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

  // ===== Resource Access =====

  /**
   * Get public resources for agents
   */
  async getPublicResources(params?: ResourceQueryParams): Promise<PaginatedResponse<Resource>> {
    return this.getPaginated<Resource>('resources', this.cleanParams(params || {}));
  }

  /**
   * Get featured resources for dashboard
   */
  async getFeaturedResources(limit: number = 5): Promise<Resource[]> {
    return this.getMany<Resource>(`resources/featured?limit=${limit}`);
  }

  /**
   * Get resource details and increment view count
   */
  async getResource(id: string): Promise<Resource> {
    return this.getOne<Resource>(`resources/${id}`);
  }

  /**
   * Get resource download URL and increment download count
   */
  async downloadResource(id: string): Promise<ResourceDownloadResponse> {
    return this.getOne<ResourceDownloadResponse>(`resources/${id}/download`);
  }

  /**
   * Search resources
   */
  async searchResources(query: string, params?: ResourceQueryParams): Promise<Resource[]> {
    return this.getMany<Resource>(`resources/search/${encodeURIComponent(query)}`, this.cleanParams(params || {}));
  }

  /**
   * Get resources by category
   */
  async getResourcesByCategory(category: string, params?: ResourceQueryParams): Promise<Resource[]> {
    return this.getMany<Resource>(`resources/category/${category}`, this.cleanParams(params || {}));
  }

  /**
   * Get resources by type
   */
  async getResourcesByType(type: string, params?: ResourceQueryParams): Promise<Resource[]> {
    return this.getMany<Resource>(`resources/type/${type}`, this.cleanParams(params || {}));
  }

  // ===== Agent Media Resources =====

  /**
   * Get all agent media resources organized by category
   */
  async getAgentMedia(): Promise<{
    trainingMaterials: Resource[];
    bankForms: Resource[];
    termsAndConditions: Resource[];
    compliance: Resource[];
    marketing: Resource[];
    policies: Resource[];
    guides: Resource[];
    templates: Resource[];
    media: Resource[];
    announcements: Resource[];
    other: Resource[];
    summary: {
      totalResources: number;
      newThisMonth: number;
      featuredCount: number;
    };
  }> {
    try {
      const result = await this.execute(() => 
        this.client.get('agents/media')
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get resources by specific category with pagination
   */
  async getMediaByCategory(category: string, params?: { page?: number; limit?: number }): Promise<{
    resources: Resource[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryParams = this.cleanParams(params || {});
    return this.getOne(`agents/media/${category}`, queryParams);
  }

  /**
   * Get featured resources for agent dashboard
   */
  async getFeaturedMedia(limit: number = 5): Promise<Resource[]> {
    return this.getMany<Resource>(`agents/media/featured?limit=${limit}`);
  }

  /**
   * Get recent resources
   */
  async getRecentMedia(limit: number = 10, days: number = 30): Promise<Resource[]> {
    return this.getMany<Resource>(`agents/media/recent?limit=${limit}&days=${days}`);
  }

  /**
   * Get resource content (embedded, external, or download URL)
   */
  async getResourceContent(id: string): Promise<{
    type: 'embedded' | 'external' | 'file';
    content?: string;
    url?: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    expiresIn?: number;
  }> {
    // Use direct client call since this endpoint returns content directly, not wrapped in ApiResponse
    return this.execute(() => 
      this.client.get<{
        type: 'embedded' | 'external' | 'file';
        content?: string;
        url?: string;
        fileName?: string;
        mimeType?: string;
        fileSize?: number;
        expiresIn?: number;
      }>(`agents/media/${id}/content`)
    );
  }

  /**
   * Get specific resource details
   */
  async getMediaResource(id: string): Promise<Resource> {
    return this.getOne<Resource>(`agents/media/${id}`);
  }

  /**
   * Download resource (generates secure URL and increments download count)
   */
  async downloadMediaResource(id: string): Promise<{
    url: string;
    fileName: string;
  }> {
    return this.getOne(`agents/media/${id}/download`);
  }

  /**
   * Track resource access for compliance
   */
  async trackResourceAccess(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.execute(() => 
      this.client.post(`agents/media/${id}/track-access`, {})
    );
  }

  /**
   * Search media resources
   */
  async searchMediaResources(searchTerm: string, params?: { page?: number; limit?: number }): Promise<{
    resources: Resource[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryParams = this.cleanParams(params || {});
    return this.getOne(`agents/media/search/${encodeURIComponent(searchTerm)}`, queryParams);
  }

  /**
   * Get categories summary with resource counts
   */
  async getMediaCategoriesSummary(): Promise<{
    training: number;
    bank_forms: number;
    terms_conditions: number;
    compliance: number;
    marketing: number;
    policy: number;
    guide: number;
    template: number;
    media: number;
    announcement: number;
    other: number;
  }> {
    return this.getOne('agents/media/categories/summary');
  }
}

// Export singleton instance
export const agentService = new AgentService();
