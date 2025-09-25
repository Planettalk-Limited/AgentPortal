/**
 * Base Service - Abstract base class for all API services
 * Provides common functionality and error handling
 */

import { apiClient, ApiResponse, PaginatedResponse, ApiError } from './client';
import { PaginationParams } from './types';

export abstract class BaseService {
  protected client = apiClient;

  /**
   * Handle API errors consistently across all services
   */
  protected handleError(error: any): never {
    if (error.statusCode) {
      // API error with structured format
      throw error as ApiError;
    } else if (error instanceof TypeError && error.message.includes('fetch')) {
      // Network error
      throw {
        success: false,
        error: 'Network error. Please check your connection and try again.',
        statusCode: 0,
        timestamp: new Date().toISOString(),
        path: '',
      } as ApiError;
    } else {
      // Unknown error
      throw {
        success: false,
        error: error.message || 'An unexpected error occurred',
        statusCode: 500,
        timestamp: new Date().toISOString(),
        path: '',
      } as ApiError;
    }
  }

  /**
   * Execute API call with error handling
   */
  protected async execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get paginated results
   */
  protected async getPaginated<T>(
    endpoint: string,
    params?: PaginationParams & Record<string, any>
  ): Promise<PaginatedResponse<T>> {
    return this.execute(() => this.client.get<PaginatedResponse<T>>(endpoint, params));
  }

  /**
   * Get single resource
   */
  protected async getOne<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const response = await this.execute(() => 
      this.client.get<ApiResponse<T>>(endpoint, params)
    );
    return response.data!;
  }

  /**
   * Get multiple resources (non-paginated)
   */
  protected async getMany<T>(endpoint: string, params?: Record<string, any>): Promise<T[]> {
    const response = await this.execute(() => 
      this.client.get<ApiResponse<T[]>>(endpoint, params)
    );
    return response.data!;
  }

  /**
   * Create resource
   */
  protected async create<T, K = any>(endpoint: string, data: K): Promise<T> {
    const response = await this.execute(() => 
      this.client.post<ApiResponse<T>>(endpoint, data)
    );
    return response.data!;
  }

  /**
   * Update resource
   */
  protected async update<T, K = any>(endpoint: string, data: K): Promise<T> {
    const response = await this.execute(() => 
      this.client.patch<ApiResponse<T>>(endpoint, data)
    );
    return response.data!;
  }

  /**
   * Replace resource
   */
  protected async replace<T, K = any>(endpoint: string, data: K): Promise<T> {
    const response = await this.execute(() => 
      this.client.put<ApiResponse<T>>(endpoint, data)
    );
    return response.data!;
  }

  /**
   * Delete resource
   */
  protected async delete<T = void>(endpoint: string): Promise<T> {
    const response = await this.execute(() => 
      this.client.delete<ApiResponse<T>>(endpoint)
    );
    return response.data!;
  }

  /**
   * Perform action without expecting data back
   */
  protected async action(endpoint: string, data?: any): Promise<void> {
    await this.execute(() => this.client.post<ApiResponse<void>>(endpoint, data));
  }

  /**
   * Perform action and return result
   */
  protected async actionWithResult<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.execute(() => 
      this.client.post<ApiResponse<T>>(endpoint, data)
    );
    return response.data!;
  }

  /**
   * Upload file
   */
  protected async uploadFile<T>(
    endpoint: string, 
    file: File, 
    additionalData?: Record<string, any>
  ): Promise<T> {
    const response = await this.execute(() => 
      this.client.uploadFile<ApiResponse<T>>(endpoint, file, additionalData)
    );
    return response.data!;
  }

  /**
   * Build endpoint with ID
   */
  protected buildEndpoint(base: string, id?: string | number, suffix?: string): string {
    let endpoint = base;
    if (id !== undefined) {
      endpoint += `/${id}`;
    }
    if (suffix) {
      endpoint += `/${suffix}`;
    }
    return endpoint;
  }

  /**
   * Clean undefined values from params
   */
  protected cleanParams(params: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }
}
