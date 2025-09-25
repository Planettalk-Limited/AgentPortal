/**
 * API Services Index
 * Central export point for all API services
 */

// Core Services
export { AuthService, authService } from './auth.service';
export { UserService, userService } from './user.service';
export { AgentService, agentService } from './agent.service';
export { AdminService, adminService } from './admin.service';

// New Dedicated Services
export { NotificationService, notificationService } from './notification.service';
export { TrainingService, trainingService } from './training.service';
export { PayoutService, payoutService } from './payout.service';

// Export all types from notification service
export type {
  Notification,
  CreateNotificationRequest,
  BulkNotificationRequest,
  RoleAnnouncementRequest,
  NotificationQueryParams
} from './notification.service';

// Export all types from training service
export type {
  TrainingMaterial,
  TrainingProgress,
  CreateTrainingMaterialRequest,
  UpdateTrainingMaterialRequest,
  TrainingQueryParams,
  TrainingStats
} from './training.service';

// Export all types from payout service
export type {
  Payout,
  CreatePayoutRequest,
  PayoutQueryParams,
  PayoutStats,
  BulkPayoutActionRequest
} from './payout.service';

// Import service instances directly for the services object
import { authService } from './auth.service';
import { userService } from './user.service';
import { agentService } from './agent.service';
import { adminService } from './admin.service';
import { notificationService } from './notification.service';
import { trainingService } from './training.service';
import { payoutService } from './payout.service';

// Re-export commonly used service instances for easy access
export const services = {
  auth: authService,
  user: userService,
  agent: agentService,
  admin: adminService,
  notification: notificationService,
  training: trainingService,
  payout: payoutService,
} as const;

// Default export with all services
export default services;
