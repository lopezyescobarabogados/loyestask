import api from '@/lib/axios';
import { isAxiosError } from 'axios';
import type {
  FullUserPerformanceMetrics,
  UserEvaluation,
  PerformancePrediction,
  UserDashboard,
  CreateEvaluationForm
} from '@/types/index';

/**
 * Obtener métricas de rendimiento de todos los usuarios (solo admin)
 */
export async function getAllUsersPerformance(period?: number): Promise<FullUserPerformanceMetrics[]> {
  try {
    const params = period ? `?period=${period}` : '';
    const { data } = await api.get<FullUserPerformanceMetrics[]>(`/performance/users${params}`);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Error al obtener métricas de usuarios');
  }
}

/**
 * Obtener métricas detalladas de un usuario específico (solo admin)
 */
export async function getUserPerformance(userId: string, period?: number): Promise<FullUserPerformanceMetrics> {
  try {
    const params = period ? `?period=${period}` : '';
    const { data } = await api.get<FullUserPerformanceMetrics>(`/performance/users/${userId}${params}`);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Error al obtener métricas del usuario');
  }
}

/**
 * Obtener predicciones de rendimiento (solo admin)
 */
export async function getPerformancePredictions(userId: string): Promise<PerformancePrediction> {
  try {
    const { data } = await api.get<PerformancePrediction>(`/performance/users/${userId}/predictions`);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Error al obtener predicciones');
  }
}

/**
 * Crear evaluación de usuario (solo admin)
 */
export async function createUserEvaluation(userId: string, evaluation: CreateEvaluationForm): Promise<string> {
  try {
    const { data } = await api.post(`/performance/users/${userId}/evaluations`, evaluation);
    return data.message;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Error al crear evaluación');
  }
}

/**
 * Obtener evaluaciones de un usuario
 */
export async function getUserEvaluations(userId: string): Promise<UserEvaluation[]> {
  try {
    const { data } = await api.get<UserEvaluation[]>(`/performance/users/${userId}/evaluations`);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Error al obtener evaluaciones');
  }
}

/**
 * Obtener dashboard personal del usuario
 */
export async function getUserDashboard(): Promise<UserDashboard> {
  try {
    const { data } = await api.get<UserDashboard>('/performance/dashboard');
    
    // Validación y sanitización de datos defensiva
    const sanitizedData = {
      ...data,
      recentTasks: (data.recentTasks || []).filter(task => 
        task && 
        task.task && 
        task.project && 
        typeof task.task === 'object' && 
        typeof task.project === 'object' &&
        task.task.name &&
        task.project.projectName
      ),
      latestEvaluation: data.latestEvaluation && 
        data.latestEvaluation.evaluatedBy && 
        data.latestEvaluation.evaluatedBy.name 
          ? data.latestEvaluation 
          : null
    };
    
    return sanitizedData;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Error al obtener dashboard');
  }
}
