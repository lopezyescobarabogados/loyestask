import { useQuery } from '@tanstack/react-query';
import { getSystemConfig } from '@/api/ConfigAPI';

// Función para obtener textos de display
const getDisplayTexts = (config?: { notifications?: { times?: { dailyReminderDisplay?: string; specificReminderDisplay?: string } } }) => ({
  dailyReminderTime: config?.notifications?.times?.dailyReminderDisplay || '8:00 AM',
  specificReminderTime: config?.notifications?.times?.specificReminderDisplay || '9:00 AM',
  dailyReminderDescription: `Recibe un resumen diario de tus tareas pendientes cada mañana a las ${config?.notifications?.times?.dailyReminderDisplay || '8:00 AM'}`,
  specificReminderDescription: `Los recordatorios de tareas específicas se envían diariamente a las ${config?.notifications?.times?.specificReminderDisplay || '9:00 AM'}`,
  combinedScheduleInfo: `Los recordatorios se envían en horarios laborales (${config?.notifications?.times?.dailyReminderDisplay || '8:00 AM'} - ${config?.notifications?.times?.specificReminderDisplay || '9:00 AM'}) para maximizar la visibilidad y efectividad.`,
});

export const useSystemConfig = () => {
  const { data: config, isLoading, error } = useQuery({
    queryKey: ['systemConfig'],
    queryFn: getSystemConfig,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (gcTime reemplaza cacheTime en React Query v5)
  });

  const displayTexts = getDisplayTexts(config);

  return {
    config,
    isLoading,
    error,
    displayTexts,
  };
};

// Hook para configuración de notificaciones específicamente
export const useNotificationConfig = () => {
  const { config, isLoading, error, displayTexts } = useSystemConfig();
  
  return {
    notificationConfig: config?.notifications,
    isLoading,
    error,
    displayTexts,
  };
};
