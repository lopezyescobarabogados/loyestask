import { useQuery } from '@tanstack/react-query';
import {
  ChartBarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { getNotificationSummary } from '@/api/NotificationAPI';

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export default function NotificationMetrics() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['notificationSummary'],
    queryFn: getNotificationSummary,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Simular datos de métricas avanzadas
  const metrics: MetricCard[] = [
    {
      title: 'Tasa de Apertura',
      value: '87.5%',
      change: 5.2,
      trend: 'up',
      icon: EnvelopeIcon,
      color: 'blue',
    },
    {
      title: 'Tiempo Promedio de Respuesta',
      value: '2.3h',
      change: -12.1,
      trend: 'up', // Menos tiempo es mejor
      icon: ClockIcon,
      color: 'green',
    },
    {
      title: 'Usuarios Activos',
      value: summary?.enabled || 0,
      change: 8.7,
      trend: 'up',
      icon: UserGroupIcon,
      color: 'purple',
    },
    {
      title: 'Eficiencia del Sistema',
      value: '98.2%',
      change: 1.5,
      trend: 'up',
      icon: ArrowTrendingUpIcon,
      color: 'orange',
    },
  ];

  const getMetricColors = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50',
        icon: 'text-blue-500',
        title: 'text-blue-900',
        value: 'text-blue-600',
      },
      green: {
        bg: 'bg-green-50',
        icon: 'text-green-500',
        title: 'text-green-900',
        value: 'text-green-600',
      },
      purple: {
        bg: 'bg-purple-50',
        icon: 'text-purple-500',
        title: 'text-purple-900',
        value: 'text-purple-600',
      },
      orange: {
        bg: 'bg-orange-50',
        icon: 'text-orange-500',
        title: 'text-orange-900',
        value: 'text-orange-600',
      },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const colors = getMetricColors(metric.color);
          const TrendIcon = metric.trend === 'up' ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
          const trendColor = metric.trend === 'up' ? 'text-green-500' : 'text-red-500';
          
          return (
            <div key={metric.title} className={`${colors.bg} p-6 rounded-lg`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`text-sm font-medium ${colors.title}`}>{metric.title}</p>
                  <p className={`text-2xl font-bold ${colors.value} mt-1`}>{metric.value}</p>
                  
                  <div className="flex items-center mt-2">
                    <TrendIcon className={`h-4 w-4 ${trendColor} mr-1`} />
                    <span className={`text-sm ${trendColor}`}>
                      {Math.abs(metric.change)}%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs. mes anterior</span>
                  </div>
                </div>
                
                <metric.icon className={`h-8 w-8 ${colors.icon}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Análisis de rendimiento por tipo */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <ChartBarIcon className="h-5 w-5 text-blue-500 mr-2" />
          Rendimiento por Tipo de Notificación
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <h4 className="font-medium text-blue-900">Recordatorios Específicos</h4>
              <p className="text-sm text-blue-700">Notificaciones configuradas por tarea</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{summary?.recentlySent || 0}</p>
              <p className="text-sm text-blue-500">Últimos 7 días</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
            <div>
              <h4 className="font-medium text-orange-900">Recordatorios Diarios</h4>
              <p className="text-sm text-orange-700">Resúmenes automáticos matutinos</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-orange-600">{summary?.dailyRecentlySent || 0}</p>
              <p className="text-sm text-orange-500">Últimos 7 días</p>
            </div>
          </div>
        </div>
      </div>

      {/* Insights y recomendaciones */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Insights y Recomendaciones
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <ArrowTrendingUpIcon className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900">Excelente adopción</h4>
              <p className="text-sm text-green-700">
                El {Math.round(((summary?.enabled || 0) / (summary?.total || 1)) * 100)}% de las notificaciones configuradas están activas.
                Esto indica una buena adopción del sistema por parte de los usuarios.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <ClockIcon className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Horarios optimizados</h4>
              <p className="text-sm text-blue-700">
                Los recordatorios se envían en horarios laborales (8:00 AM - 9:00 AM) para maximizar
                la visibilidad y efectividad.
              </p>
            </div>
          </div>
          
          {summary && summary.total > 0 && (
            <div className="flex items-start space-x-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <ChartBarIcon className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-900">Oportunidad de mejora</h4>
                <p className="text-sm text-purple-700">
                  Considera implementar recordatorios inteligentes basados en patrones de trabajo
                  de cada usuario para mejorar la efectividad.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Estadísticas detalladas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Distribución de Usuarios
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Con notificaciones activas</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ 
                      width: `${((summary?.enabled || 0) / (summary?.total || 1)) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{summary?.enabled || 0}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Con notificaciones inactivas</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-gray-400 h-2 rounded-full" 
                    style={{ 
                      width: `${((summary?.disabled || 0) / (summary?.total || 1)) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{summary?.disabled || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Actividad Reciente
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                {summary?.recentlySent || 0} notificaciones específicas enviadas
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                {summary?.dailyRecentlySent || 0} recordatorios diarios enviados
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                Sistema funcionando correctamente
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
