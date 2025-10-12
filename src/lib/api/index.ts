/**
 * API Module - Main export file for all API services
 * Provides centralized access to all services and types
 */

// Export API client and base classes
export { apiClient, ApiClient } from './client';
export { BaseService } from './base.service';

// Export all types
export * from './types';

// Import services
import { authService, AuthService } from './services/auth.service';
import { agentService, AgentService } from './services/agent.service';
import { adminService, AdminService } from './services/admin.service';
import { userService, UserService } from './services/user.service';
import { notificationService, NotificationService } from './services/notification.service';
import { trainingService, TrainingService } from './services/training.service';
import { payoutService, PayoutService } from './services/payout.service';

// Export services
export { AuthService, AgentService, AdminService, UserService, NotificationService, TrainingService, PayoutService };
export { authService, agentService, adminService, userService, notificationService, trainingService, payoutService };

// Export response interfaces for convenience
export type {
  ApiResponse,
  PaginatedResponse,
  ApiError,
} from './client';

// Export new service types
export type {
  Notification,
  CreateNotificationRequest,
  BulkNotificationRequest,
  RoleAnnouncementRequest,
  NotificationQueryParams,
  TrainingMaterial,
  TrainingProgress,
  CreateTrainingMaterialRequest,
  UpdateTrainingMaterialRequest,
  TrainingQueryParams,
  TrainingStats,
  Payout,
  PayoutQueryParams,
  PayoutStats,
  BulkPayoutActionRequest
} from './services';

// Service instances for easy import
export const api = {
  auth: authService,
  agent: agentService,
  admin: adminService,
  user: userService,
  notification: notificationService,
  training: trainingService,
  payout: payoutService,
};

// Initialize authentication on module load
if (typeof window !== 'undefined') {
  // Initialize auth from stored token
  authService.initializeAuth();
}
