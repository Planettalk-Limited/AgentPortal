/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { BaseService } from '../base.service';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  TwoFactorAuthRequest,
  TwoFactorSetupResponse,
  TwoFactorVerifySetupRequest,
  TwoFactorVerifySetupResponse,
  TwoFactorDisableRequest,
  TwoFactorCheckRequiredRequest,
  TwoFactorCheckRequiredResponse,
} from '../types';

export class AuthService extends BaseService {
  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await this.execute(() => 
      this.client.post<RegisterResponse>('auth/register', data)
    );
    
    return response;
  }

  /**
   * Login user (Step 1 of 2FA flow)
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Use direct API call since login returns unwrapped response
    const response = await this.execute(() => 
      this.client.post<LoginResponse>('auth/login', credentials)
    );
    
    // Only store token if 2FA is not required
    if (!response.requires2FA && response.access_token) {
      this.client.setAuthToken(response.access_token);
      
      // Store token in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
    }
    
    return response;
  }

  /**
   * Verify OTP code (Step 2 of email OTP flow)
   */
  async verify2FA(data: TwoFactorAuthRequest): Promise<LoginResponse> {
    const response = await this.execute(() => 
      this.client.post<LoginResponse>('auth/verify-otp', data)
    );
    
    // Store the token after successful OTP verification
    if (response.access_token) {
      this.client.setAuthToken(response.access_token);
      
      // Store token in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
    }
    
    return response;
  }

  /**
   * Verify Email OTP code (alias for verify2FA)
   */
  async verifyOTP(data: TwoFactorAuthRequest): Promise<LoginResponse> {
    return this.verify2FA(data);
  }

  /**
   * Check if 2FA is required for a user
   */
  async check2FARequired(data: TwoFactorCheckRequiredRequest): Promise<TwoFactorCheckRequiredResponse> {
    return this.execute(() => 
      this.client.post<TwoFactorCheckRequiredResponse>('auth/2fa/check-required', data)
    );
  }

  /**
   * Setup 2FA - Generate QR code
   */
  async setup2FA(): Promise<TwoFactorSetupResponse> {
    return this.execute(() => 
      this.client.post<TwoFactorSetupResponse>('auth/2fa/setup')
    );
  }

  /**
   * Verify and enable 2FA
   */
  async verifySetup2FA(data: TwoFactorVerifySetupRequest): Promise<TwoFactorVerifySetupResponse> {
    return this.execute(() => 
      this.client.post<TwoFactorVerifySetupResponse>('auth/2fa/verify-setup', data)
    );
  }

  /**
   * Disable 2FA
   */
  async disable2FA(data: TwoFactorDisableRequest): Promise<{ success: boolean }> {
    return this.execute(() => 
      this.client.post<{ success: boolean }>('auth/2fa/disable', data)
    );
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await this.action('auth/logout');
    } catch (error) {
      // Continue with local logout even if API call fails
      // Logout API call failed - continue with cleanup
    } finally {
      // Always clear local storage and token
      this.client.setAuthToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    try {
      // Call API directly since it returns User object directly, not wrapped in ApiResponse
      const profile = await this.execute(() => 
        this.client.get<User>('auth/profile')
      );
      return profile;
    } catch (error) {
      // Failed to get user profile
      throw error;
    }
  }

  /**
   * Update current user profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const updatedUser = await this.update<User, UpdateProfileRequest>('auth/profile', data);
    
    // Update stored user data
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    return updatedUser;
  }

  /**
   * Get user preferences
   */
  async getPreferences(): Promise<any> {
    try {
      const result = await this.getOne<any>('auth/profile/preferences');
      return result;
    } catch (error) {
      // Failed to fetch preferences
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(data: any): Promise<any> {
    return this.update<any>('auth/profile/preferences', data);
  }

  /**
   * Get security settings
   */
  async getSecuritySettings(): Promise<any> {
    try {
      const result = await this.getOne<any>('auth/profile/security');
      return result;
    } catch (error) {
      // Failed to fetch security settings
      throw error;
    }
  }

  /**
   * Update security settings
   */
  async updateSecuritySettings(data: {
    twoFactorEnabled?: boolean;
    requirePasswordChange?: boolean;
    loginNotifications?: boolean;
    sessionTimeout?: number;
  }): Promise<any> {
    return this.update<any>('auth/profile/security', data);
  }

  /**
   * Get notification preferences
   */
  async getNotificationPreferences(): Promise<any> {
    try {
      const result = await this.getOne<any>('auth/profile/notifications');
      return result;
    } catch (error) {
      // Failed to fetch notification preferences
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(data: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    loginNotifications?: boolean;
    specificNotifications?: {
      payoutNotifications?: boolean;
      earningsNotifications?: boolean;
      trainingNotifications?: boolean;
      announcementNotifications?: boolean;
      applicationNotifications?: boolean;
      systemNotifications?: boolean;
    };
    // Legacy format for backward compatibility
    email?: {
      payouts?: boolean;
      earnings?: boolean;
      training?: boolean;
      system?: boolean;
      marketing?: boolean;
    };
    sms?: {
      payouts?: boolean;
      security?: boolean;
      urgent?: boolean;
    };
    push?: {
      enabled?: boolean;
      payouts?: boolean;
      earnings?: boolean;
      training?: boolean;
    };
  }): Promise<any> {
    try {
      const result = await this.update<any>('auth/profile/notifications', data);
      return result;
    } catch (error) {
      // Failed to update notification preferences
      throw error;
    }
  }

  /**
   * Toggle two-factor authentication
   */
  async toggle2FA(enabled: boolean): Promise<{ 
    enabled: boolean; 
    qrCode?: string; 
    backupCodes?: string[];
    user?: User;
  }> {
    const response = await this.actionWithResult('auth/profile/toggle-2fa', { enabled });
    
    // Handle the actual API response format
    if (response && typeof response === 'object') {
      // If response is the full user object (as shown in your example)
      if ('metadata' in response || 'settings' in response || 'id' in response) {
        const user = response as unknown as User;
        return {
          enabled: user.metadata?.twoFactorEnabled || user.settings?.twoFactorEnabled || enabled,
          user: user
        };
      }
      
      // If response is already in the expected format
      if ('enabled' in response) {
        return response as { enabled: boolean; qrCode?: string; backupCodes?: string[] };
      }
    }
    
    // Fallback - assume the operation succeeded
    return { enabled };
  }

  /**
   * Toggle email notifications
   */
  async toggleEmailNotifications(enabled: boolean): Promise<{ enabled: boolean }> {
    return this.actionWithResult('auth/profile/toggle-email-notifications', { enabled });
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await this.action('auth/change-password', data);
  }

  /**
   * Request password reset
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await this.action('auth/forgot-password', data);
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await this.action('auth/reset-password', data);
  }


  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.client.getAuthToken();
  }

  /**
   * Get stored user data
   */
  getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Clear authentication
   */
  clearAuth(): void {
    this.client.setAuthToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  }

  /**
   * Refresh token (if your API supports it)
   */
  async refreshToken(): Promise<string> {
    const response = await this.actionWithResult<{ access_token: string }>('auth/refresh');
    
    this.client.setAuthToken(response.access_token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', response.access_token);
    }
    
    return response.access_token;
  }

  /**
   * Validate current token
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.getProfile();
      return true;
    } catch (error) {
      // Token is invalid, clear auth
      this.clearAuth();
      return false;
    }
  }

  /**
   * Initialize authentication from stored token
   */
  initializeAuth(): User | null {
    if (typeof window === 'undefined') return null;
    
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.client.setAuthToken(token);
        return user;
      } catch (error) {
        // Failed to parse stored user data
        this.clearAuth();
      }
    }
    
    return null;
  }
}

// Export singleton instance
export const authService = new AuthService();
