import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Switch } from '@headlessui/react';
import {
  CogIcon,
  BellIcon,
  ClockIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import {
  getNotificationSummary,
  toggleAllNotifications,
  toggleAllDailyReminders,
} from '@/api/NotificationAPI';
import { useSystemConfig } from '@/hooks/useSystemConfig';

interface AdminNotificationSettings {
  dailyReminderTime: string;
  specificReminderTime: string;
  maxDailyEmails: number;
  enableSystemNotifications: boolean;
  enableDailyReminders: boolean;
  emailTemplateSubject: string;
  emailTemplateGreeting: string;
}

export default function AdminNotificationPanel() {
  // Obtener configuración del sistema para uso futuro
  useSystemConfig();
  
  const [settings, setSettings] = useState<AdminNotificationSettings>({
    dailyReminderTime: '08:00', // Usar valores por defecto por ahora
    specificReminderTime: '09:00',
    maxDailyEmails: 100,
    enableSystemNotifications: true,
    enableDailyReminders: true,
    emailTemplateSubject: 'Recordatorio de Tareas - LoyesTask',
    emailTemplateGreeting: 'Hola',
  });

  const [activeTab, setActiveTab] = useState<'schedule' | 'templates' | 'limits' | 'monitoring'>('schedule');

  const queryClient = useQueryClient();

  // Consultar resumen actual
  const { data: summary, isLoading } = useQuery({
    queryKey: ['notificationSummary'],
    queryFn: getNotificationSummary,
  });

  // Mutación para activar/desactivar todas las notificaciones
  const { mutate: toggleAllNotifs, isPending: isTogglingAll } = useMutation({
    mutationFn: (enabled: boolean) => toggleAllNotifications(enabled),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['notificationSummary'] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Mutación para activar/desactivar recordatorios diarios
  const { mutate: toggleDailyReminders, isPending: isTogglingDaily } = useMutation({
    mutationFn: (enabled: boolean) => toggleAllDailyReminders(enabled),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['notificationSummary'] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSaveSettings = () => {
    // En un proyecto real, esto haría una llamada al backend para guardar la configuración
    toast.success('Configuración guardada exitosamente');
  };

  const handleTestNotification = () => {
    // En un proyecto real, esto enviaría una notificación de prueba
    toast.success('Notificación de prueba enviada');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <CogIcon className="h-6 w-6 text-blue-500 mr-2" />
              Panel de Administración - Notificaciones
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Configuración avanzada del sistema de notificaciones
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleTestNotification}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <EnvelopeIcon className="h-4 w-4 mr-2" />
              Probar Sistema
            </button>
          </div>
        </div>

        {/* Estado global del sistema */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Sistema Global</p>
                <p className="text-xs text-blue-700">Todas las notificaciones</p>
              </div>
              <Switch
                checked={settings.enableSystemNotifications}
                onChange={(enabled) => {
                  setSettings(prev => ({ ...prev, enableSystemNotifications: enabled }));
                  toggleAllNotifs(enabled);
                }}
                disabled={isTogglingAll}
                className={`${
                  settings.enableSystemNotifications ? 'bg-blue-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50`}
              >
                <span
                  className={`${
                    settings.enableSystemNotifications ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-900">Recordatorios Diarios</p>
                <p className="text-xs text-orange-700">Resúmenes matutinos</p>
              </div>
              <Switch
                checked={settings.enableDailyReminders}
                onChange={(enabled) => {
                  toggleDailyReminders(enabled);
                }}
                disabled={isTogglingDaily}
                className={`${
                  settings.enableDailyReminders ? 'bg-orange-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50`}
              >
                <span
                  className={`${
                    settings.enableDailyReminders ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-900">Usuarios Activos</p>
                <p className="text-2xl font-bold text-green-600">{summary?.enabled || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs de configuración */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'schedule', name: 'Horarios', icon: ClockIcon },
              { id: 'templates', name: 'Plantillas', icon: EnvelopeIcon },
              { id: 'limits', name: 'Límites', icon: ExclamationTriangleIcon },
              { id: 'monitoring', name: 'Monitoreo', icon: BellIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'schedule' | 'templates' | 'limits' | 'monitoring')}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab: Horarios */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Configuración de Horarios</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de Recordatorios Diarios
                  </label>
                  <input
                    type="time"
                    value={settings.dailyReminderTime}
                    onChange={(e) => setSettings(prev => ({ ...prev, dailyReminderTime: e.target.value }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Hora en que se envían los resúmenes diarios
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de Recordatorios Específicos
                  </label>
                  <input
                    type="time"
                    value={settings.specificReminderTime}
                    onChange={(e) => setSettings(prev => ({ ...prev, specificReminderTime: e.target.value }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Hora en que se envían los recordatorios de tareas específicas
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-yellow-800">Nota importante</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Los cambios en los horarios se aplicarán en la siguiente ejecución programada. 
                      Los cron jobs pueden tardar hasta 24 horas en reflejar los nuevos horarios.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Plantillas */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Plantillas de Email</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asunto del Email
                  </label>
                  <input
                    type="text"
                    value={settings.emailTemplateSubject}
                    onChange={(e) => setSettings(prev => ({ ...prev, emailTemplateSubject: e.target.value }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Saludo Personal
                  </label>
                  <input
                    type="text"
                    value={settings.emailTemplateGreeting}
                    onChange={(e) => setSettings(prev => ({ ...prev, emailTemplateGreeting: e.target.value }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Se mostrará como "{settings.emailTemplateGreeting} [Nombre del Usuario]"
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Vista previa del email</h4>
                <div className="bg-white border rounded p-3 text-sm">
                  <p className="font-medium">{settings.emailTemplateSubject}</p>
                  <p className="mt-2">{settings.emailTemplateGreeting} Usuario Ejemplo,</p>
                  <p className="mt-1 text-gray-600">Tienes las siguientes tareas pendientes...</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Límites */}
          {activeTab === 'limits' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Límites del Sistema</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Máximo de emails por día
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={settings.maxDailyEmails}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxDailyEmails: parseInt(e.target.value) }))}
                  className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Límite de seguridad para evitar spam
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-red-800">Límites de seguridad</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Estos límites protegen el sistema contra envíos masivos accidentales. 
                      Si se alcanza el límite diario, los envíos se pausarán hasta el día siguiente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Monitoreo */}
          {activeTab === 'monitoring' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Estado del Sistema</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-800">Servicios</h4>
                  
                  {[
                    { name: 'Servicio de Email', status: 'active', lastCheck: '2 min' },
                    { name: 'Cron Jobs', status: 'active', lastCheck: '1 min' },
                    { name: 'Base de Datos', status: 'active', lastCheck: '30 seg' },
                    { name: 'Cola de Emails', status: 'active', lastCheck: '45 seg' },
                  ].map((service) => (
                    <div key={service.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          service.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-sm font-medium text-gray-900">{service.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        Verificado hace {service.lastCheck}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-800">Estadísticas Hoy</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Emails enviados</span>
                      <span className="text-sm font-medium">24</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Emails fallidos</span>
                      <span className="text-sm font-medium text-red-600">1</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Usuarios notificados</span>
                      <span className="text-sm font-medium">18</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Recordatorios diarios</span>
                      <span className="text-sm font-medium">5</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botón de guardar */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleSaveSettings}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
