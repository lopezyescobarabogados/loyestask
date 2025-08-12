import { IUserPerformance } from '../models/UserPerformance';

/**
 * SISTEMA DE MÉTRICAS AUTOMATIZADO Y OBJETIVO
 * 
 * Este módulo calcula automáticamente las métricas de desempeño
 * sin intervención manual ni favoritismo, basándose únicamente
 * en datos objetivos del sistema.
 */

export interface AutomatedMetrics {
  // Métricas de finalización
  tasksAssigned: number;
  tasksCompleted: number;
  completionRate: number; // Porcentaje de tareas completadas

  // Métricas de tiempo
  averageCompletionDays: number;
  onTimeDeliveries: number;
  onTimePercentage: number;
  
  // Métricas de retraso
  delayedDeliveries: number;
  averageDelayDays: number;
  maxDelayDays: number;

  // Métricas de productividad
  tasksCompletedThisMonth: number;
  productivityTrend: 'improving' | 'stable' | 'declining';
  
  // Métricas de calidad (basadas en tiempo de entrega)
  earlyDeliveries: number;
  earlyDeliveryPercentage: number;
  qualityScore: number; // 0-100 basado en entregas a tiempo
}

export interface MonthlyPerformanceReport {
  month: string;
  year: number;
  metrics: AutomatedMetrics;
  period: {
    startDate: Date;
    endDate: Date;
  };
}

/**
 * Calcula métricas automatizadas de desempeño para un usuario
 */
export const calculateAutomatedMetrics = (
  performanceRecords: IUserPerformance[],
  periodDays: number = 30
): AutomatedMetrics => {
  // Filtrar registros del período
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - periodDays);
  
  const periodRecords = performanceRecords.filter(
    record => record.createdAt >= cutoffDate
  );

  // Filtrar solo tareas completadas con datos válidos
  const completedTasks = periodRecords.filter(
    record => record.isCompleted && 
    record.completionTime !== null && 
    record.completionTime !== undefined &&
    record.isOnTime !== null
  );

  // MÉTRICAS DE FINALIZACIÓN
  const tasksAssigned = periodRecords.length;
  const tasksCompleted = completedTasks.length;
  const completionRate = tasksAssigned > 0 ? (tasksCompleted / tasksAssigned) * 100 : 0;

  // MÉTRICAS DE TIEMPO
  const averageCompletionDays = completedTasks.length > 0 
    ? completedTasks.reduce((sum, task) => sum + task.completionTime!, 0) / completedTasks.length
    : 0;

  const onTimeDeliveries = completedTasks.filter(task => task.isOnTime === true).length;
  const onTimePercentage = completedTasks.length > 0 
    ? (onTimeDeliveries / completedTasks.length) * 100 
    : 0;

  // MÉTRICAS DE RETRASO
  const delayedTasks = completedTasks.filter(task => task.isOnTime === false);
  const delayedDeliveries = delayedTasks.length;
  
  const delayDays = delayedTasks.map(task => {
    // Calcular días de retraso (completionTime - días permitidos)
    const dueDateWorkingDays = calculateWorkingDaysFromDueDate(task.dueDate, task.createdAt);
    return Math.max(0, task.completionTime! - dueDateWorkingDays);
  });

  const averageDelayDays = delayDays.length > 0 
    ? delayDays.reduce((sum, delay) => sum + delay, 0) / delayDays.length 
    : 0;
  const maxDelayDays = delayDays.length > 0 ? Math.max(...delayDays) : 0;

  // MÉTRICAS DE PRODUCTIVIDAD
  const currentMonth = new Date();
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const tasksCompletedThisMonth = completedTasks.filter(
    task => task.createdAt >= monthStart
  ).length;

  // Calcular tendencia comparando últimas 2 semanas vs 2 semanas anteriores
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const recentTasks = completedTasks.filter(task => task.createdAt >= twoWeeksAgo);
  const olderTasks = completedTasks.filter(
    task => task.createdAt >= fourWeeksAgo && task.createdAt < twoWeeksAgo
  );

  let productivityTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (recentTasks.length > 0 && olderTasks.length > 0) {
    const recentAvg = recentTasks.reduce((sum, task) => sum + task.completionTime!, 0) / recentTasks.length;
    const olderAvg = olderTasks.reduce((sum, task) => sum + task.completionTime!, 0) / olderTasks.length;
    
    const improvement = ((olderAvg - recentAvg) / olderAvg) * 100;
    if (improvement > 5) productivityTrend = 'improving';
    else if (improvement < -5) productivityTrend = 'declining';
  }

  // MÉTRICAS DE CALIDAD
  const earlyTasks = completedTasks.filter(task => {
    const dueDateWorkingDays = calculateWorkingDaysFromDueDate(task.dueDate, task.createdAt);
    return task.completionTime! < dueDateWorkingDays;
  });
  
  const earlyDeliveries = earlyTasks.length;
  const earlyDeliveryPercentage = completedTasks.length > 0 
    ? (earlyDeliveries / completedTasks.length) * 100 
    : 0;

  // Score de calidad: 100 puntos base, -10 por cada entrega tardía, +5 por cada entrega temprana
  const qualityScore = Math.max(0, Math.min(100, 
    100 - (delayedDeliveries * 10) + (earlyDeliveries * 5)
  ));

  return {
    tasksAssigned,
    tasksCompleted,
    completionRate: Math.round(completionRate * 100) / 100,
    
    averageCompletionDays: Math.round(averageCompletionDays * 100) / 100,
    onTimeDeliveries,
    onTimePercentage: Math.round(onTimePercentage * 100) / 100,
    
    delayedDeliveries,
    averageDelayDays: Math.round(averageDelayDays * 100) / 100,
    maxDelayDays,
    
    tasksCompletedThisMonth,
    productivityTrend,
    
    earlyDeliveries,
    earlyDeliveryPercentage: Math.round(earlyDeliveryPercentage * 100) / 100,
    qualityScore: Math.round(qualityScore)
  };
};

/**
 * Genera reporte mensual automatizado
 */
export const generateMonthlyReport = (
  performanceRecords: IUserPerformance[],
  month: number,
  year: number
): MonthlyPerformanceReport => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const monthlyRecords = performanceRecords.filter(
    record => record.createdAt >= startDate && record.createdAt <= endDate
  );

  const metrics = calculateAutomatedMetrics(monthlyRecords, 31);

  return {
    month: startDate.toLocaleString('es-ES', { month: 'long' }),
    year,
    metrics,
    period: { startDate, endDate }
  };
};

/**
 * Calcula días laborables permitidos para una tarea
 */
const calculateWorkingDaysFromDueDate = (dueDate: Date, createdAt: Date): number => {
  let workingDays = 0;
  const currentDate = new Date(createdAt);
  
  while (currentDate <= dueDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Lunes a Viernes
      workingDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return workingDays;
};

/**
 * Evalúa automáticamente el desempeño basado en métricas objetivas
 */
export const evaluatePerformanceAutomatically = (metrics: AutomatedMetrics): {
  score: number;
  rating: 'excellent' | 'good' | 'average' | 'needs_improvement' | 'poor';
  feedback: string[];
} => {
  let score = 0;
  const feedback: string[] = [];

  // Completión rate (30% del score)
  if (metrics.completionRate >= 95) {
    score += 30;
    feedback.push('Excelente tasa de finalización de tareas');
  } else if (metrics.completionRate >= 85) {
    score += 25;
    feedback.push('Buena tasa de finalización de tareas');
  } else if (metrics.completionRate >= 75) {
    score += 20;
    feedback.push('Tasa de finalización promedio');
  } else {
    score += 10;
    feedback.push('Mejorar tasa de finalización de tareas');
  }

  // On-time delivery (40% del score)
  if (metrics.onTimePercentage >= 95) {
    score += 40;
    feedback.push('Entregas consistentemente a tiempo');
  } else if (metrics.onTimePercentage >= 85) {
    score += 35;
    feedback.push('Buena puntualidad en entregas');
  } else if (metrics.onTimePercentage >= 75) {
    score += 25;
    feedback.push('Puntualidad promedio en entregas');
  } else {
    score += 15;
    feedback.push('Necesita mejorar puntualidad');
  }

  // Productivity trend (20% del score)
  if (metrics.productivityTrend === 'improving') {
    score += 20;
    feedback.push('Tendencia de mejora continua');
  } else if (metrics.productivityTrend === 'stable') {
    score += 15;
    feedback.push('Rendimiento estable');
  } else {
    score += 5;
    feedback.push('Revisar estrategias de productividad');
  }

  // Quality score (10% del score)
  score += (metrics.qualityScore / 100) * 10;

  // Determinar rating
  let rating: 'excellent' | 'good' | 'average' | 'needs_improvement' | 'poor';
  if (score >= 90) rating = 'excellent';
  else if (score >= 75) rating = 'good';
  else if (score >= 60) rating = 'average';
  else if (score >= 40) rating = 'needs_improvement';
  else rating = 'poor';

  return {
    score: Math.round(score),
    rating,
    feedback
  };
};
