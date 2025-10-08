/**
 * API Types - TypeScript interfaces for API requests and responses
 */

// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
  role: 'admin' | 'pt_admin' | 'agent';
  status: 'active' | 'inactive' | 'suspended';
  phoneNumber?: string;
  country?: string;
  lastLoginAt?: string | null;
  emailVerifiedAt?: string | null;
  isFirstLogin?: boolean;
  metadata?: {
    twoFactorEnabled?: boolean;
    [key: string]: string | number | boolean | null | undefined;
  };
  preferences?: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    language?: string;
    timezone?: string;
    currency?: string;
    [key: string]: string | number | boolean | null | undefined;
  };
  settings?: {
    twoFactorEnabled?: boolean;
    requirePasswordChange?: boolean;
    loginNotifications?: boolean;
    sessionTimeout?: number;
    [key: string]: string | number | boolean | null | undefined;
  };
  adminSettings?: {
    permissions?: string[];
    [key: string]: string | number | boolean | string[] | null | undefined;
  };
  agents?: Array<{ id: string; agentCode: string; status: string; [key: string]: unknown }>;
  createdAt: string;
  updatedAt: string;
  fullName?: string;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  country: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    createdAt: string;
  };
  pendingVerification: boolean;
}

export interface LoginResponse {
  success?: boolean;
  access_token?: string;
  user?: User;
  // 2FA fields
  requires2FA?: boolean;
  // Email verification fields
  requiresEmailVerification?: boolean;
  emailVerified?: boolean;
  email?: string;
  otpSent?: boolean;
  otpMessage?: string;
  message?: string;
}

// 2FA specific types
export interface TwoFactorAuthRequest {
  email: string;
  code: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
}

export interface TwoFactorVerifySetupRequest {
  verificationCode: string;
}

export interface TwoFactorVerifySetupResponse {
  success: boolean;
  backupCodes: string[];
}

export interface TwoFactorDisableRequest {
  verificationCode: string;
  currentPassword: string;
}

export interface TwoFactorCheckRequiredRequest {
  email: string;
}

export interface TwoFactorCheckRequiredResponse {
  required: boolean;
  user?: Partial<User>;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  country?: string;
}

// Agent Types
export interface Agent {
  id: string;
  agentCode: string;
  status: 'pending_application' | 'application_approved' | 'code_generated' | 'credentials_sent' | 'active' | 'suspended';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  totalReferrals: number;
  activeReferrals: number;
  commissionRate: number;
  user: User;
  createdAt: string;
  updatedAt: string;
  // Additional properties that may be present in some contexts
  firstName?: string;
  lastName?: string;
  email?: string;
  activatedAt?: string;
  lastActivityAt?: string;
}

export interface AgentApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  experience: string;
  motivation: string;
  hasLicense: boolean;
  licenseNumber?: string;
  status: 'submitted' | 'approved' | 'rejected';
  reviewNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentApplicationRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  experience: string;
  motivation: string;
  hasLicense: boolean;
  licenseNumber?: string;
}

export interface ReviewApplicationRequest {
  status: 'approved' | 'rejected';
  reviewNotes?: string;
  rejectionReason?: string;
}

// Referral Code Types
export interface ReferralCode {
  id: string;
  code: string;
  type: 'standard' | 'promotional';
  description?: string;
  bonusCommissionRate?: number;
  maxUses?: number;
  currentUses: number;
  status: 'active' | 'inactive' | 'expired';
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReferralCodeRequest {
  code: string;
  type: 'standard' | 'promotional';
  description?: string;
  bonusCommissionRate?: number;
  maxUses?: number;
  expiresAt?: string;
}

export interface UseReferralCodeRequest {
  referredUserEmail: string;
  referredUserName: string;
  referredUserPhone: string;
  metadata?: Record<string, any>;
}

export interface PublicUseReferralCodeRequest {
  fullName: string;
  phoneNumber: string;
}

export interface ReferralCodeValidation {
  valid: boolean;
  agent?: {
    agentCode: string;
    name: string;
    tier: string;
  };
  details?: {
    type: string;
    description?: string;
    bonusCommissionRate?: number;
    remainingUses?: number;
    expiresAt?: string;
  };
}

// New Referral Flow API Types
export interface PublicReferralResponse {
  valid: boolean;
  message?: string; // For error responses
  agent?: {
    firstName: string;
    lastName: string;
    fullName: string;
    agentCode: string;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  };
  program?: {
    title: string;
    subtitle: string;
    description: string;
    benefits: string[];
  };
  personalizedMessage?: string;
  codeDetails?: {
    agentCode: string;
    type: 'agent_code' | 'standard' | 'promotional';
    description: string;
    commissionRate: string;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    totalReferrals: number;
    activeSince: string | null;
    // Legacy fields for backward compatibility
    code?: string;
    bonusRate?: number;
    remainingUses?: number;
    expiresAt?: string;
  };
  callToAction?: {
    primary: string;
    secondary: string;
    buttonText: string;
  };
}

export interface UseReferralCodeRequestEnhanced {
  referredUserName: string;
  referredUserEmail: string;
  referredUserPhone: string;
  metadata?: {
    customerType?: string;
    serviceType?: string;
    signupAmount?: number;
    country?: string;
    carrier?: string;
    source?: string;
    campaign?: string;
    notes?: string;
    [key: string]: any;
  };
}

export interface UseReferralCodeResponse {
  id: string;
  referralCodeId: string;
  referredUserName: string;
  referredUserEmail: string;
  referredUserPhone: string;
  usedAt: string;
  status: 'confirmed' | 'pending' | 'failed';
  metadata?: {
    customerType?: string;
    serviceType?: string;
    signupAmount?: number;
    country?: string;
    carrier?: string;
    source?: string;
    campaign?: string;
    notes?: string;
    [key: string]: any;
  };
  referralCode: {
    code: string;
    type: 'standard' | 'promotional';
    agent: {
      agentCode: string;
      firstName: string;
      lastName: string;
      fullName: string;
    };
  };
  automaticEarnings: {
    created: boolean;
    amount: number;
    status: 'pending' | 'confirmed' | 'failed';
    description: string;
    referenceId: string;
    calculation: {
      baseAmount: number;
      agentRate: number;
      bonusRate: number;
      totalRate: number;
      finalAmount: number;
    };
    commissionPeriod: string;
    earnedAt: string;
    confirmedAt?: string | null;
  };
  agentNotification: {
    emailSent: boolean;
    message: string;
  };
}

// Earnings Types
export interface Earning {
  id: string;
  type: 'referral_commission' | 'bonus' | 'penalty' | 'adjustment';
  amount: number;
  description: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  earnedAt: string;
  referralCode?: string;
  referredUser?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  // Agent information
  agent?: {
    agentCode?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    tier?: string;
  };
  // Referral usage information
  referralUsage?: {
    referredUserName?: string;
    referredUserPhone?: string;
  };
}

export interface CreateEarningAdjustmentRequest {
  amount: number;
  type: 'bonus' | 'penalty' | 'adjustment';
  reason: string;
  notes?: string;
}

export interface EarningsSummary {
  totalEarnings: number;
  monthlyEarnings: number;
  weeklyEarnings: number;
  dailyEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  totalReferrals: number;
  activeReferralCodes: number;
  thisMonthReferrals: number;
  conversionRate: number;
}

// Payout Types
export interface Payout {
  id: string;
  agentId: string;
  amount: string | number;
  fees: string | number;
  netAmount: string | number;
  currency: string;
  method: 'bank_transfer' | 'paypal' | 'check' | 'crypto' | 'airtime_topup';
  status: 'requested' | 'pending_review' | 'approved' | 'processing' | 'completed' | 'rejected' | 'cancelled';
  description?: string;
  transactionId?: string;
  rejectionReason?: string;
  adminNotes?: string;
  paymentDetails: Record<string, any>;
  requestedAt: string;
  approvedAt?: string;
  processedAt?: string;
  completedAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  processedBy?: string;
  agent?: {
    id: string;
    agentCode: string;
    status: string;
    tier: string;
    totalEarnings: string;
    availableBalance: string;
    pendingBalance: string;
    totalReferrals: number;
    activeReferrals: number;
    commissionRate: string;
    notes?: string;
    metadata?: Record<string, any>;
    activatedAt?: string;
    lastActivityAt?: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      username: string;
      email: string;
      role: string;
      status: string;
      phoneNumber?: string;
      lastLoginAt?: string;
      emailVerifiedAt?: string;
      isFirstLogin: boolean;
      metadata?: Record<string, string | number | boolean | null | undefined>;
      createdAt: string;
      updatedAt: string;
    };
  };
  processor?: { id: string; name: string; type: string; [key: string]: unknown };
}

export interface CreatePayoutRequest {
  amount: number;
  method: 'bank_transfer' | 'airtime_topup';
  description?: string;
  paymentDetails: {
    bankAccount?: {
      accountNumber: string;
      routingNumber: string;
      accountName: string;
      bankName: string;
    };
    airtimeTopup?: {
      phoneNumber: string;
      accountName?: string;
    };
  };
}

export interface UpdatePayoutStatusRequest {
  status: 'approved' | 'rejected' | 'processing' | 'completed';
  transactionId?: string;
  fees?: number;
  adminNotes?: string;
  rejectionReason?: string;
}

// Dashboard Types
export interface AgentDashboard {
  agent: Agent;
  earnings: Earning[];
  referralCodes: ReferralCode[];
  summary: EarningsSummary;
  recentPayouts: Payout[];
  monthlyStats: {
    month: string;
    earnings: number;
    referrals: number;
  }[];
}

// Admin Types
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  agentUsers: number;
  adminUsers: number;
  newUsersThisMonth: number;
  usersByRole: Record<string, number>;
  usersByStatus: Record<string, number>;
}

export interface PayoutStats {
  totalPayouts: number;
  pendingPayouts: number;
  completedPayouts: number;
  totalPayoutAmount: number;
  pendingPayoutAmount: number;
  completedPayoutAmount: number;
  averagePayoutAmount: number;
  payoutsByStatus: Record<string, number>;
}

export interface AgentStats {
  totalAgents: number;
  activeAgents: number;
  pendingApplications: number;
  totalEarnings: number;
  totalReferrals: number;
  averageCommissionRate: number;
  agentsByTier: Record<string, number>;
  agentsByStatus: Record<string, number>;
}

export interface SystemStats {
  users: UserStats;
  agents: AgentStats;
  payouts: PayoutStats;
  systemHealth: {
    status: 'healthy' | 'warning' | 'error';
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

// Resource Management Types
export interface Resource {
  id: string;
  title: string;
  description: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  type: 'document' | 'image' | 'video' | 'audio' | 'archive' | 'other';
  category: 'training' | 'marketing' | 'compliance' | 'policy' | 'guide' | 'template' | 'other';
  visibility: 'public' | 'private' | 'restricted';
  s3Key: string;
  s3Url: string;
  s3Bucket?: string;
  externalUrl?: string;
  embeddedContent?: string;
  isEmbedded: boolean;
  isExternal: boolean;
  isActive: boolean;
  isFeatured: boolean;
  downloadCount: number;
  viewCount: number;
  publishedAt?: string;
  expiresAt?: string;
  tags: string[];
  metadata?: Record<string, any>;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface ResourceQueryParams {
  category?: string;
  type?: string;
  visibility?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  search?: string;
  tags?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'title' | 'category' | 'type' | 'downloadCount' | 'viewCount';
  sortOrder?: 'ASC' | 'DESC';
}

export interface UploadResourceRequest {
  file: File;
  title: string;
  description: string;
  type: 'document' | 'image' | 'video' | 'audio' | 'archive' | 'other';
  category: 'training' | 'marketing' | 'compliance' | 'policy' | 'guide' | 'template' | 'other';
  visibility: 'public' | 'private' | 'restricted';
  isFeatured?: boolean;
  publishedAt?: string;
  expiresAt?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateResourceRequest {
  title?: string;
  description?: string;
  visibility?: 'public' | 'private' | 'restricted';
  isFeatured?: boolean;
  isActive?: boolean;
  tags?: string[];
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export interface BulkResourceUpdateRequest {
  resourceIds: string[];
  updates: {
    visibility?: 'public' | 'private' | 'restricted';
    isActive?: boolean;
    category?: string;
    isFeatured?: boolean;
    tags?: string[];
  };
}

export interface BulkResourceDeleteRequest {
  resourceIds: string[];
}

export interface ResourceStats {
  total: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  totalDownloads: number;
  totalViews: number;
  recentUploads: number;
}

export interface ResourceDownloadResponse {
  url: string;
  fileName?: string;
  expiresIn?: number;
}

// Query Parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface UserQueryParams extends PaginationParams {
  role?: string;
  status?: string;
  search?: string;
}

export interface AgentQueryParams extends PaginationParams {
  status?: string;
  tier?: string;
  search?: string;
}

export interface PayoutQueryParams extends PaginationParams {
  status?: string;
  method?: string;
  agentId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface EarningsQueryParams extends PaginationParams {
  type?: string;
  status?: string;
  agentId?: string;
  tier?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  // Legacy date fields for backward compatibility
  dateFrom?: string;
  dateTo?: string;
}

// Earnings Approval Types
export interface ApproveEarningRequest {
  notes?: string;
}

export interface RejectEarningRequest {
  reason: string;
  notes?: string;
}

export interface BulkEarningsActionRequest {
  earningIds: string[];
  notes?: string;
  reason?: string; // Required for bulk reject
}

export interface EarningsActionResponse {
  success: boolean;
  id?: string;
  amount?: number;
  status?: string;
  reason?: string;
  message: string;
}

export interface BulkEarningsActionResponse {
  success: boolean;
  summary: string;
  approved?: number;
  rejected?: number;
  failed: number;
  errors: Array<{
    earningId: string;
    error: string;
  }>;
}

// Bulk Operations
export interface BulkUserActionRequest {
  userIds: string[];
  action: 'updateStatus' | 'updateRole' | 'delete';
  parameters: Record<string, string | number | boolean | null | undefined>;
}

export interface BulkPayoutActionRequest {
  payoutIds: string[];
  action: 'approve' | 'reject' | 'process';
  parameters?: Record<string, string | number | boolean | null | undefined>;
}

// Email Templates
export interface EmailTemplate {
  name: string;
  subject: string;
  description: string;
  variables: string[];
}

export interface EmailPreviewRequest {
  templateName: string;
  templateData: Record<string, string | number | boolean | null | undefined>;
}

export interface SendTestEmailRequest {
  templateName: string;
  testEmail: string;
  subject: string;
  templateData: Record<string, string | number | boolean | null | undefined>;
}

// System Settings
export interface SystemSettings {
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  minimumPayoutAmount: number;
  defaultCommissionRate: number;
  payoutProcessingFee: number;
  maxReferralCodes: number;
  emailNotifications: {
    agentApplications: boolean;
    payoutRequests: boolean;
    systemAlerts: boolean;
  };
  features: {
    agentApplications: boolean;
    payoutRequests: boolean;
    referralCodes: boolean;
    emailTemplates: boolean;
  };
}

export type UpdateSystemSettingsRequest = Partial<SystemSettings>

// Audit Logs
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, string | number | boolean | null | undefined>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>;
}

export interface AuditLogQueryParams extends PaginationParams {
  userId?: string;
  action?: string;
  resource?: string;
  dateFrom?: string;
  dateTo?: string;
}
