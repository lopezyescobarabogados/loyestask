import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserEvaluations, getUserDashboard } from '@/api/PerformanceAPI';
import { useAuth } from '@/hooks/useAuth';
import { StarIcon, ClockIcon, ArrowTrendingUpIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { ChartBarIcon } from '@heroicons/react/24/outline';

const UserPerformanceDashboard: React.FC = () => {
  const { data: user } = useAuth();
  
  const { data: evaluations, isLoading: evaluationsLoading } = useQuery({
    queryKey: ['userEvaluations', user?._id],
    queryFn: () => getUserEvaluations(user!._id),
    enabled: !!user?._id
  });

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['userDashboard'],
    queryFn: getUserDashboard
  });

  if (evaluationsLoading || dashboardLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Desempeño</h1>
        <p className="mt-1 text-sm text-gray-500">
          Revisa tus métricas de rendimiento y evaluaciones
        </p>
      </div>

      {/* Métricas actuales */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Tareas
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboard.currentPeriodMetrics.totalTasks}
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
                  <CheckCircleIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completadas
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboard.currentPeriodMetrics.completedTasks}
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
                  <ClockIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Puntualidad
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboard.currentPeriodMetrics.onTimePercentage.toFixed(1)}%
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
                  <ArrowTrendingUpIcon className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Tiempo Promedio
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboard.currentPeriodMetrics.averageCompletionTime.toFixed(1)} días
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Última evaluación destacada */}
      {dashboard?.latestEvaluation && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Última Evaluación</h3>
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(dashboard.latestEvaluation.score)}`}>
                <StarIcon className="h-4 w-4 mr-1" />
                {dashboard.latestEvaluation.score}/100
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">
                {dashboard.latestEvaluation.comments}
              </p>
              <div className="flex items-center text-xs text-gray-500">
                <span>Evaluado por {dashboard.latestEvaluation.evaluatedBy.name}</span>
                <span className="mx-2">•</span>
                <span>{formatDate(dashboard.latestEvaluation.date)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tareas recientes */}
      {dashboard?.recentTasks && dashboard.recentTasks.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Tareas Recientes</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {dashboard.recentTasks.map((task, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {task.task.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {task.project.projectName}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {task.isCompleted && (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        task.isOnTime 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {task.isOnTime ? 'A tiempo' : 'Tarde'}
                      </span>
                    )}
                    {task.completionTime && (
                      <span className="text-sm text-gray-500">
                        {task.completionTime} días
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial de evaluaciones */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Historial de Evaluaciones</h3>
        </div>
        <div className="p-6">
          {evaluations && evaluations.length > 0 ? (
            <div className="space-y-6">
              {evaluations.map((evaluation) => (
                <div key={evaluation._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(evaluation.score)}`}>
                        <StarIcon className="h-4 w-4 mr-1" />
                        {evaluation.score}/100
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(evaluation.period.startDate)} - {formatDate(evaluation.period.endDate)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(evaluation.createdAt)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <dt className="text-xs text-gray-500">Finalización</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {evaluation.metrics.taskCompletionRate.toFixed(1)}%
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Tiempo Promedio</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {evaluation.metrics.averageCompletionTime.toFixed(1)} días
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Productividad</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {evaluation.metrics.productivity} tareas
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Calidad</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {evaluation.metrics.qualityScore.toFixed(1)}/10
                      </dd>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Comentarios</h4>
                      <p className="text-sm text-gray-600 mt-1">{evaluation.comments}</p>
                    </div>
                    
                    {evaluation.recommendations && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Recomendaciones</h4>
                        <p className="text-sm text-gray-600 mt-1">{evaluation.recommendations}</p>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      Evaluado por {evaluation.evaluatedBy.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <StarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Sin evaluaciones
              </h3>
              <p className="text-sm text-gray-500">
                Aún no tienes evaluaciones de rendimiento.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPerformanceDashboard;
