import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllUsersPerformance } from '@/api/PerformanceAPI';
import PerformanceChart from '@/components/admin/PerformanceChart';
import CreateEvaluationModal from '@/components/admin/CreateEvaluationModal';
import { ChartBarIcon, ClockIcon, ArrowTrendingUpIcon, UserIcon } from '@heroicons/react/24/outline';

const PerformanceAnalyticsView: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);

  const { data: performanceData, isLoading, error } = useQuery({
    queryKey: ['usersPerformance', selectedPeriod],
    queryFn: () => getAllUsersPerformance(selectedPeriod)
  });

  const handleCreateEvaluation = (userId: string, userName: string) => {
    setSelectedUser({ id: userId, name: userName });
    setIsEvaluationModalOpen(true);
  };

  const closeEvaluationModal = () => {
    setIsEvaluationModalOpen(false);
    setSelectedUser(null);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <ChartBarIcon className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar datos</h3>
        <p className="text-gray-500">No se pudieron cargar las métricas de rendimiento.</p>
      </div>
    );
  }

  const data = performanceData || [];

  // Calcular estadísticas generales
  const totalUsers = data.length;
  const avgOnTimeRate = data.length > 0 
    ? data.reduce((sum, user) => sum + user.metrics.onTimePercentage, 0) / data.length 
    : 0;
  const avgCompletionTime = data.length > 0 
    ? data.reduce((sum, user) => sum + user.metrics.averageCompletionTime, 0) / data.length 
    : 0;
  const totalCompletedTasks = data.reduce((sum, user) => sum + user.metrics.completedTasks, 0);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics de Rendimiento</h1>
          <p className="mt-1 text-sm text-gray-500">
            Métricas y análisis del desempeño de los usuarios
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value={7}>Últimos 7 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={90}>Últimos 90 días</option>
            <option value={180}>Últimos 6 meses</option>
            <option value={365}>Último año</option>
          </select>
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Usuarios
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalUsers}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Puntualidad Promedio
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {avgOnTimeRate.toFixed(1)}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tiempo Promedio
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {avgCompletionTime.toFixed(1)} días
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tareas Completadas
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalCompletedTasks}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <PerformanceChart data={data} />

      {/* Lista detallada de usuarios */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Detalle por Usuario
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tareas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completadas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puntualidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiempo Promedio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tendencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((user) => (
                <tr key={user.user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.user.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.metrics.totalTasks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.metrics.completedTasks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.metrics.onTimePercentage >= 80
                        ? 'bg-green-100 text-green-800'
                        : user.metrics.onTimePercentage >= 60
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.metrics.onTimePercentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.metrics.averageCompletionTime.toFixed(1)} días
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      user.metrics.productivityTrend > 0
                        ? 'text-green-600'
                        : user.metrics.productivityTrend < 0
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}>
                      {user.metrics.productivityTrend > 0 ? '↗' : user.metrics.productivityTrend < 0 ? '↘' : '→'}
                      {Math.abs(user.metrics.productivityTrend).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleCreateEvaluation(user.user._id, user.user.name)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Evaluar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de evaluación */}
      {selectedUser && (
        <CreateEvaluationModal
          isOpen={isEvaluationModalOpen}
          onClose={closeEvaluationModal}
          userId={selectedUser.id}
          userName={selectedUser.name}
        />
      )}
    </div>
  );
};

export default PerformanceAnalyticsView;
