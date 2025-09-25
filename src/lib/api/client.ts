/**
 * API Client - Base HTTP client for all API communications
 * Handles authentication, error handling, and common request/response logic
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
  timestamp?: string;
  path?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: string;
  statusCode: number;
  timestamp: string;
  path: string;
  details?: any;
}

export class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = 'http://localhost:3000/api/v1') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string | null) {
    if (token) {
      this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders['Authorization'];
    }
  }

  /**
   * Get current auth token
   */
  getAuthToken(): string | null {
    const authHeader = this.defaultHeaders['Authorization'];
    return authHeader ? authHeader.replace('Bearer ', '') : null;
  }

  /**
   * Build full URL
   */
  private buildUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.baseURL}/${cleanEndpoint}`;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    let data: any;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      // Handle different error formats
      const error: ApiError = {
        success: false,
        error: data.error || data.message || `HTTP ${response.status}`,
        statusCode: response.status,
        timestamp: new Date().toISOString(),
        path: response.url,
        details: data.details || data
      };
      throw error;
    }

    return data;
  }

  /**
   * Build query string from params
   */
  private buildQueryString(params?: Record<string, any>): string {
    if (!params) return '';
    
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Generic GET request
   */
  async get<T = any>(
    endpoint: string, 
    params?: Record<string, any>,
    headers?: Record<string, string>
  ): Promise<T> {
    const url = this.buildUrl(endpoint) + this.buildQueryString(params);
    const response = await fetch(url, {
      method: 'GET',
      headers: { ...this.defaultHeaders, ...headers },
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Generic POST request
   */
  async post<T = any>(
    endpoint: string, 
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const response = await fetch(url, {
      method: 'POST',
      headers: { ...this.defaultHeaders, ...headers },
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Generic PATCH request
   */
  async patch<T = any>(
    endpoint: string, 
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { ...this.defaultHeaders, ...headers },
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Generic PUT request
   */
  async put<T = any>(
    endpoint: string, 
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const response = await fetch(url, {
      method: 'PUT',
      headers: { ...this.defaultHeaders, ...headers },
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Generic DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { ...this.defaultHeaders, ...headers },
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Upload file
   */
  async uploadFile<T = any>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const headers = { ...this.defaultHeaders };
    // Remove Content-Type to let browser set it with boundary for multipart/form-data
    delete headers['Content-Type'];

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse<T>(response);
  }
}

// Create singleton instance
export const apiClient = new ApiClient();
