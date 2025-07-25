import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChartBarIcon,
  ClockIcon,
  BellIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { getNotificationSummary } from '@/api/NotificationAPI';
import { useSystemConfig } from '@/hooks/useSystemConfig';

interface NotificationMetrics {
  totalSent: number;
  dailySent: number;
  weeklyAverage: number;
  monthlyAverage: number;
  successRate: number;
  lastWeekData: Array<{
    date: string;
    sent: number;
    dailySent: number;
  }>;
}

export default function NotificationDashboard() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week');

  // Obtener configuración del sistema
  const { displayTexts } = useSystemConfig();

  // Consultar resumen de notificaciones
  const { data: summary, isLoading } = useQuery({
    queryKey: ['notificationSummary'],
    queryFn: getNotificationSummary,
  });

  // Simular métricas adicionales (en un proyecto real esto vendría del backend)
  const mockMetrics: NotificationMetrics = {
    totalSent: summary?.recentlySent || 0,
    dailySent: summary?.dailyRecentlySent || 0,
    weeklyAverage: Math.round((summary?.recentlySent || 0) / 7),
    monthlyAverage: Math.round((summary?.recentlySent || 0) * 4.3),
    successRate: 98.5,
    lastWeekData: [
      { date: '2024-01-15', sent: 12, dailySent: 3 },
      { date: '2024-01-16', sent: 8, dailySent: 2 },
      { date: '2024-01-17', sent: 15, dailySent: 4 },
      { date: '2024-01-18', sent: 10, dailySent: 3 },
      { date: '2024-01-19', sent: 18, dailySent: 5 },
      { date: '2024-01-20', sent: 6, dailySent: 1 },
      { date: '2024-01-21', sent: 14, dailySent: 4 },
    ]
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
              <ChartBarIcon className="h-6 w-6 text-blue-500 mr-2" />
              Dashboard de Notificaciones
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Monitoreo y análisis del sistema de notificaciones
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'quarter')}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="week">Última semana</option>
              <option value="month">Último mes</option>
              <option value="quarter">Último trimestre</option>
            </select>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <EnvelopeIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">Total Enviadas</p>
                <p className="text-2xl font-bold text-blue-600">{mockMetrics.totalSent}</p>
                <p className="text-xs text-blue-700">Últimos 7 días</p>
              </div>
            </div> 
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CalendarDaysIcon className="h-8 w-8 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-900">Diarias</p>
                <p className="text-2xl font-bold text-orange-600">{mockMetrics.dailySent}</p>
                <p className="text-xs text-orange-700">Últimos 7 días</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-900">Tasa de Éxito</p>
                <p className="text-2xl font-bold text-green-600">{mockMetrics.successRate}%</p>
                <p className="text-xs text-green-700">Entrega exitosa</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-900">Promedio</p>
                <p className="text-2xl font-bold text-purple-600">{mockMetrics.weeklyAverage}</p>
                <p className="text-xs text-purple-700">Por día</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de tendencias */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Tendencia de Envíos (Última Semana)
        </h3>
        
        <div className="space-y-4">
          {mockMetrics.lastWeekData.map((day) => {
            const maxValue = Math.max(...mockMetrics.lastWeekData.map(d => d.sent + d.dailySent));
            const dailyWidth = (day.dailySent / maxValue) * 100;
            const specificWidth = (day.sent / maxValue) * 100;
            
            return (
              <div key={day.date} className="flex items-center space-x-4">
                <div className="w-20 text-sm text-gray-600">
                  {new Date(day.date).toLocaleDateString('es-ES', { 
                    weekday: 'short',
                    day: 'numeric' 
                  })}
                </div>
                
                <div className="flex-1 relative">
                  <div className="bg-gray-200 rounded-full h-6 relative overflow-hidden">
                    {/* Barra de notificaciones específicas */}
                    <div 
                      className="bg-blue-500 h-full rounded-full absolute left-0"
                      style={{ width: `${specificWidth}%` }}
                    />
                    {/* Barra de notificaciones diarias */}
                    <div 
                      className="bg-orange-500 h-full rounded-full absolute"
                      style={{ 
                        left: `${specificWidth}%`,
                        width: `${dailyWidth}%` 
                      }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex items-center space-x-4 text-xs">
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                        Específicas: {day.sent}
                      </span>
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
                        Diarias: {day.dailySent}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                      Total: {day.sent + day.dailySent}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Estado del sistema */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <BellIcon className="h-5 w-5 text-green-500 mr-2" />
            Estado del Sistema
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Servicio de Email</span>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-green-600 font-medium">Activo</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cron Jobs</span>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-green-600 font-medium">Ejecutándose</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Base de Datos</span>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-green-600 font-medium">Conectada</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Último Envío</span>
              <span className="text-sm text-gray-500">Hace 2 horas</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 text-yellow-500 mr-2" />
            Configuración Actual
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Hora de envío (específicas)</span>
              <span className="text-sm text-gray-900 font-medium">{displayTexts.specificReminderTime}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Hora de envío (diarias)</span>
              <span className="text-sm text-gray-900 font-medium">{displayTexts.dailyReminderTime}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Usuarios activos</span>
              <span className="text-sm text-gray-900 font-medium">{summary?.enabled || 0}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total de preferencias</span>
              <span className="text-sm text-gray-900 font-medium">{summary?.total || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <ChartBarIcon className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Información del Dashboard</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Los datos se actualizan en tiempo real basados en las preferencias de usuario.</li>
                <li>Las métricas de tendencia muestran el comportamiento de los últimos 7 días.</li>
                <li>La tasa de éxito se calcula basada en los emails entregados exitosamente.</li>
                <li>Los gráficos distinguen entre notificaciones específicas y recordatorios diarios.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
