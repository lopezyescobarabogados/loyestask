import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Switch } from '@headlessui/react';
import {
  BellIcon,
  BellSlashIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  getUserNotificationPreferences,
  getNotificationSummary,
  toggleAllNotifications,
  updateTaskNotificationPreference,
  removeTaskNotificationPreference,
} from '@/api/NotificationAPI';
import type { NotificationPreference } from '@/types/index';

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  onHold: 'En espera',
  inProgress: 'En progreso',
  underReview: 'En revisión',
  completed: 'Completada',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  onHold: 'bg-red-100 text-red-800',
  inProgress: 'bg-blue-100 text-blue-800',
  underReview: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
};

const reminderLabels: Record<number, string> = {
  0: 'El mismo día',
  1: '1 día antes',
  2: '2 días antes',
  3: '3 días antes',
  7: '1 semana antes',
  14: '2 semanas antes',
  30: '1 mes antes',
};

export default function NotificationSettings() {
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const queryClient = useQueryClient();

  // Consultar preferencias del usuario
  const { data: preferences = [], isLoading: isLoadingPreferences } = useQuery({
    queryKey: ['userNotificationPreferences'],
    queryFn: getUserNotificationPreferences,
  });

  // Consultar resumen de notificaciones
  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['notificationSummary'],
    queryFn: getNotificationSummary,
  });

  // Mutación para activar/desactivar todas las notificaciones
  const { mutate: toggleAll, isPending: isTogglingAll } = useMutation({
    mutationFn: (enabled: boolean) => toggleAllNotifications(enabled),
    onSuccess: (data) => {
      toast.success(data.message);
      setGlobalEnabled(!globalEnabled);
      queryClient.invalidateQueries({ queryKey: ['userNotificationPreferences'] });
      queryClient.invalidateQueries({ queryKey: ['notificationSummary'] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Mutación para actualizar preferencia individual
  const { mutate: updatePreference } = useMutation({
    mutationFn: ({ taskId, enabled }: { taskId: string; enabled: boolean }) =>
      updateTaskNotificationPreference(taskId, { isEnabled: enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userNotificationPreferences'] });
      queryClient.invalidateQueries({ queryKey: ['notificationSummary'] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Mutación para eliminar preferencia
  const { mutate: removePreference } = useMutation({
    mutationFn: (taskId: string) => removeTaskNotificationPreference(taskId),
    onSuccess: (message) => {
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['userNotificationPreferences'] });
      queryClient.invalidateQueries({ queryKey: ['notificationSummary'] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleToggleAll = () => {
    toggleAll(!globalEnabled);
  };

  const handleTogglePreference = (preference: NotificationPreference) => {
    updatePreference({
      taskId: preference.task._id,
      enabled: !preference.isEnabled,
    });
  };

  const handleRemovePreference = (taskId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta notificación?')) {
      removePreference(taskId);
    }
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Venció hace ${Math.abs(diffDays)} días`;
    } else if (diffDays === 0) {
      return 'Vence hoy';
    } else {
      return `Vence en ${diffDays} días`;
    }
  };

  if (isLoadingPreferences || isLoadingSummary) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con resumen */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <BellIcon className="h-6 w-6 text-blue-500 mr-2" />
              Configuración de Notificaciones
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Gestiona tus recordatorios de tareas por correo electrónico
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Todas las notificaciones</div>
              <Switch
                checked={globalEnabled}
                onChange={handleToggleAll}
                disabled={isTogglingAll}
                className={`${
                  globalEnabled ? 'bg-blue-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50`}
              >
                <span
                  className={`${
                    globalEnabled ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <BellIcon className="h-8 w-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">Total</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-900">Activas</p>
                  <p className="text-2xl font-bold text-green-600">{summary.enabled}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <BellSlashIcon className="h-8 w-8 text-gray-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Inactivas</p>
                  <p className="text-2xl font-bold text-gray-600">{summary.disabled}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-purple-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-900">Enviadas (7d)</p>
                  <p className="text-2xl font-bold text-purple-600">{summary.recentlySent}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de preferencias */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Notificaciones Configuradas ({preferences.length})
          </h3>
        </div>

        {preferences.length === 0 ? (
          <div className="p-6 text-center">
            <BellSlashIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay notificaciones configuradas</h3>
            <p className="mt-1 text-sm text-gray-500">
              Ve a cualquier tarea y configura un recordatorio para empezar a recibirlos por correo.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {preferences.map((preference) => (
              <div key={preference._id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {preference.task.name}
                      </h4>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[preference.task.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {statusLabels[preference.task.status] || preference.task.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {preference.task.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>
                        <strong>Proyecto:</strong> {preference.task.project.projectName}
                      </span>
                      {preference.task.dueDate && (
                        <span>
                          <strong>Vencimiento:</strong> {formatDueDate(preference.task.dueDate)}
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-2 flex items-center space-x-2">
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {reminderLabels[preference.reminderDays] || `${preference.reminderDays} días antes`}
                      </span>
                      {preference.lastSentAt && (
                        <span className="text-xs text-gray-400">
                          • Último envío: {new Date(preference.lastSentAt).toLocaleDateString('es-ES')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 ml-4">
                    <Switch
                      checked={preference.isEnabled}
                      onChange={() => handleTogglePreference(preference)}
                      className={`${
                        preference.isEnabled ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                    >
                      <span
                        className={`${
                          preference.isEnabled ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </Switch>
                    
                    <button
                      onClick={() => handleRemovePreference(preference.task._id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Información importante</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Los recordatorios se envían diariamente a las 9:00 AM hora local.</li>
                <li>Solo recibirás un recordatorio por día para cada tarea.</li>
                <li>Los recordatorios se pausan automáticamente cuando una tarea se completa.</li>
                <li>Puedes probar el envío de recordatorios desde la configuración de cada tarea.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
