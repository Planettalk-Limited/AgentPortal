/**
 * Training Service
 * Handles all training and resource-related API calls
 */

import { BaseService } from '../base.service';
import { PaginatedResponse } from '../client';

// Training Types
export interface TrainingMaterial {
  id: string;
  title: string;
  description: string;
  content?: string;
  type: 'document' | 'video' | 'checklist' | 'quiz' | 'external_link';
  category: 'onboarding' | 'product_knowledge' | 'sales_techniques' | 'compliance' | 'tools' | 'other';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // in minutes
  isRequired: boolean;
  isActive: boolean;
  fileUrl?: string;
  externalUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TrainingProgress {
  id: string;
  userId: string;
  trainingMaterialId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  progress: number; // percentage 0-100
  score?: number; // for quizzes
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  trainingMaterial: TrainingMaterial;
}

export interface CreateTrainingMaterialRequest {
  title: string;
  description: string;
  content?: string;
  type: 'document' | 'video' | 'checklist' | 'quiz' | 'external_link';
  category: 'onboarding' | 'product_knowledge' | 'sales_techniques' | 'compliance' | 'tools' | 'other';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
  isRequired: boolean;
  isActive: boolean;
  externalUrl?: string;
  tags: string[];
}

export interface UpdateTrainingMaterialRequest {
  title?: string;
  description?: string;
  content?: string;
  type?: 'document' | 'video' | 'checklist' | 'quiz' | 'external_link';
  category?: 'onboarding' | 'product_knowledge' | 'sales_techniques' | 'compliance' | 'tools' | 'other';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration?: number;
  isRequired?: boolean;
  isActive?: boolean;
  externalUrl?: string;
  tags?: string[];
}

export interface TrainingQueryParams {
  page?: number;
  limit?: number;
  type?: string;
  category?: string;
  difficulty?: string;
  isRequired?: boolean;
  isActive?: boolean;
  tags?: string[];
  search?: string;
}

export interface TrainingStats {
  totalMaterials: number;
  activeMaterials: number;
  requiredMaterials: number;
  completionRate: number;
  averageScore: number;
  byCategory: Record<string, number>;
  byDifficulty: Record<string, number>;
  recentCompletions: any[];
}

export class TrainingService extends BaseService {
  // ===== Agent Training Access =====

  /**
   * Get assigned training materials for current agent
   */
  async getAssignedTraining(params?: TrainingQueryParams): Promise<PaginatedResponse<TrainingMaterial>> {
    return this.getPaginated<TrainingMaterial>('agents/training', this.cleanParams(params || {}));
  }

  /**
   * Get training progress for current agent
   */
  async getTrainingProgress(params?: { materialId?: string }): Promise<TrainingProgress[]> {
    return this.getMany<TrainingProgress>('agents/training/progress', this.cleanParams(params || {}));
  }

  /**
   * Complete training material
   */
  async completeTraining(id: string, data?: { score?: number; notes?: string }): Promise<TrainingProgress> {
    return this.actionWithResult<TrainingProgress>(`agents/training/${id}/complete`, data);
  }

  /**
   * Update training progress
   */
  async updateTrainingProgress(id: string, data: { progress: number; notes?: string }): Promise<TrainingProgress> {
    return this.update<TrainingProgress>(`agents/training/${id}/progress`, data);
  }

  /**
   * Get training material details
   */
  async getTrainingMaterial(id: string): Promise<TrainingMaterial> {
    return this.getOne<TrainingMaterial>(`agents/training/${id}`);
  }

  // ===== Admin Training Management =====

  /**
   * Get all training materials (admin only)
   */
  async getAllTrainingMaterials(params?: TrainingQueryParams): Promise<PaginatedResponse<TrainingMaterial>> {
    return this.getPaginated<TrainingMaterial>('admin/training', this.cleanParams(params || {}));
  }

  /**
   * Get training statistics (admin only)
   */
  async getTrainingStats(): Promise<TrainingStats> {
    return this.getOne<TrainingStats>('admin/training/stats');
  }

  /**
   * Get training material by ID (admin only)
   */
  async getTrainingMaterialById(id: string): Promise<TrainingMaterial> {
    return this.getOne<TrainingMaterial>(`admin/training/${id}`);
  }

  /**
   * Create training material (admin only)
   */
  async createTrainingMaterial(data: CreateTrainingMaterialRequest): Promise<TrainingMaterial> {
    return this.create<TrainingMaterial, CreateTrainingMaterialRequest>('admin/training', data);
  }

  /**
   * Update training material (admin only)
   */
  async updateTrainingMaterial(id: string, data: UpdateTrainingMaterialRequest): Promise<TrainingMaterial> {
    return this.update<TrainingMaterial, UpdateTrainingMaterialRequest>(`admin/training/${id}`, data);
  }

  /**
   * Delete training material (admin only)
   */
  async deleteTrainingMaterial(id: string): Promise<void> {
    await this.delete(`admin/training/${id}`);
  }

  /**
   * Upload training file (admin only)
   */
  async uploadTrainingFile(id: string, file: File): Promise<{ fileUrl: string }> {
    return this.uploadFile<{ fileUrl: string }>(`admin/training/${id}/upload`, file);
  }

  /**
   * Assign training to users (admin only)
   */
  async assignTrainingToUsers(materialId: string, data: {
    userIds: string[];
    dueDate?: string;
    notes?: string;
  }): Promise<{ assigned: number; failed: number; errors?: any[] }> {
    return this.actionWithResult(`admin/training/${materialId}/assign`, data);
  }

  /**
   * Assign training by role (admin only)
   */
  async assignTrainingByRole(materialId: string, data: {
    role: 'admin' | 'pt_admin' | 'agent';
    dueDate?: string;
    notes?: string;
  }): Promise<{ assigned: number; failed: number; errors?: any[] }> {
    return this.actionWithResult(`admin/training/${materialId}/assign-by-role`, data);
  }

  /**
   * Get user training progress (admin only)
   */
  async getUserTrainingProgress(userId: string, params?: { materialId?: string }): Promise<TrainingProgress[]> {
    return this.getMany<TrainingProgress>(`admin/training/progress/user/${userId}`, this.cleanParams(params || {}));
  }

  /**
   * Get training material progress (admin only)
   */
  async getTrainingMaterialProgress(materialId: string): Promise<{
    totalAssigned: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    completionRate: number;
    averageScore: number;
    userProgress: TrainingProgress[];
  }> {
    return this.getOne(`admin/training/${materialId}/progress`);
  }

  /**
   * Reset user training progress (admin only)
   */
  async resetUserTrainingProgress(userId: string, materialId: string): Promise<void> {
    await this.action(`admin/training/progress/user/${userId}/material/${materialId}/reset`);
  }

  /**
   * Export training report (admin only)
   */
  async exportTrainingReport(params?: {
    materialId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    format?: 'csv' | 'xlsx';
  }): Promise<Blob> {
    const response = await this.execute(() => 
      this.client.get('admin/training/export', this.cleanParams(params || {}), {
        'Accept': params?.format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv'
      })
    );
    return new Blob([response], { 
      type: params?.format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv' 
    });
  }
}

// Export singleton instance
export const trainingService = new TrainingService();
