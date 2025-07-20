/**
 * Utilidades para cálculo de días laborables y métricas de desempeño
 */

/**
 * Verifica si una fecha es día laborable (lunes a viernes)
 */
export const isWorkingDay = (date: Date): boolean => {
  const day = date.getDay();
  return day >= 1 && day <= 5; // 1 = Lunes, 5 = Viernes
};

/**
 * Calcula el número de días laborables entre dos fechas
 */
export const calculateWorkingDays = (startDate: Date, endDate: Date): number => {
  let workingDays = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (isWorkingDay(currentDate)) {
      workingDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return workingDays;
};

/**
 * Obtiene la próxima fecha laborable
 */
export const getNextWorkingDay = (date: Date): Date => {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  
  while (!isWorkingDay(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay;
};

/**
 * Obtiene la fecha laborable anterior
 */
export const getPreviousWorkingDay = (date: Date): Date => {
  const prevDay = new Date(date);
  prevDay.setDate(prevDay.getDate() - 1);
  
  while (!isWorkingDay(prevDay)) {
    prevDay.setDate(prevDay.getDate() - 1);
  }
  
  return prevDay;
};

/**
 * Calcula días laborables desde una fecha hasta hoy
 */
export const calculateWorkingDaysFromStart = (startDate: Date): number => {
  const today = new Date();
  return calculateWorkingDays(startDate, today);
};

/**
 * Calcula si una tarea está retrasada considerando solo días laborables
 */
export const isTaskOverdue = (dueDate: Date, completionDate?: Date): boolean => {
  const compareDate = completionDate || new Date();
  return compareDate > dueDate && isWorkingDay(compareDate);
};

/**
 * Calcula el progreso esperado de una tarea basado en días laborables
 */
export const calculateExpectedProgress = (
  startDate: Date,
  dueDate: Date,
  currentDate: Date = new Date()
): number => {
  const totalWorkingDays = calculateWorkingDays(startDate, dueDate);
  const elapsedWorkingDays = calculateWorkingDays(startDate, currentDate);
  
  if (totalWorkingDays === 0) return 100;
  
  const progress = (elapsedWorkingDays / totalWorkingDays) * 100;
  return Math.min(Math.max(progress, 0), 100);
};

/**
 * Calcula métricas de rendimiento para predicciones
 */
export const calculatePerformanceMetrics = (completedTasks: Array<{
  completionTime: number;
  isOnTime: boolean;
  dueDate: Date;
  createdAt: Date;
}>): {
  averageCompletionTime: number;
  onTimePercentage: number;
  productivityTrend: number;
  estimatedCompletionTime: number;
} => {
  if (completedTasks.length === 0) {
    return {
      averageCompletionTime: 0,
      onTimePercentage: 0,
      productivityTrend: 0,
      estimatedCompletionTime: 0,
    };
  }

  const averageCompletionTime = 
    completedTasks.reduce((sum, task) => sum + task.completionTime, 0) / completedTasks.length;

  const onTimeCount = completedTasks.filter(task => task.isOnTime).length;
  const onTimePercentage = (onTimeCount / completedTasks.length) * 100;

  // Calcular tendencia de productividad (últimas 5 tareas vs anteriores)
  const recentTasks = completedTasks.slice(-5);
  const olderTasks = completedTasks.slice(0, -5);
  
  let productivityTrend = 0;
  if (olderTasks.length > 0 && recentTasks.length > 0) {
    const recentAvg = recentTasks.reduce((sum, task) => sum + task.completionTime, 0) / recentTasks.length;
    const olderAvg = olderTasks.reduce((sum, task) => sum + task.completionTime, 0) / olderTasks.length;
    productivityTrend = ((olderAvg - recentAvg) / olderAvg) * 100; // Positivo = mejora
  }

  // Estimar tiempo de finalización basado en tendencia
  const estimatedCompletionTime = Math.max(averageCompletionTime * (1 - (productivityTrend / 100)), 1);

  return {
    averageCompletionTime: Math.round(averageCompletionTime * 100) / 100,
    onTimePercentage: Math.round(onTimePercentage * 100) / 100,
    productivityTrend: Math.round(productivityTrend * 100) / 100,
    estimatedCompletionTime: Math.round(estimatedCompletionTime * 100) / 100,
  };
};
