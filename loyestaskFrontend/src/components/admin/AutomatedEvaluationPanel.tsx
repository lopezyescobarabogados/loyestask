import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAutomatedEvaluation } from '@/api/PerformanceAPI';
import { ChartBarIcon, ClockIcon, ArrowTrendingUpIcon, StarIcon } from '@heroicons/react/24/outline';

interface AutomatedEvaluationPanelProps {
  userId: string;
  userName: string;
}

const AutomatedEvaluationPanel: React.FC<AutomatedEvaluationPanelProps> = ({ userId, userName }) => {
  const [period, setPeriod] = useState(30);

  const { data: evaluation, isLoading, error } = useQuery({
    queryKey: ['automatedEvaluation', userId, period],
    queryFn: () => getAutomatedEvaluation(userId, period),
    enabled: !!userId,
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRatingText = (rating: string) => {
    const ratings = {
      excellent: 'Excelente',
      good: 'Bueno',
      average: 'Promedio',
      needs_improvement: 'Necesita Mejora',
      poor: 'Deficiente'
    };
    return ratings[rating as keyof typeof ratings] || rating;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <p>Error al cargar la evaluación automatizada</p>
          <p className="text-sm text-gray-500 mt-1">
            {error instanceof Error ? error.message : 'Error desconocido'}
          </p>
        </div>
      </div>
    );
  }

  if (!evaluation) return null;

  const { automatedMetrics, evaluation: evalResult } = evaluation;

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Evaluación Automatizada</h3>
            <p className="text-sm text-gray-500">
              {userName} - Período: {period} días
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value={7}>7 días</option>
              <option value={30}>30 días</option>
              <option value={90}>90 días</option>
            </select>
            <div className="flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              🤖 100% Automatizado
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Score Principal */}
        <div className="text-center">
          <div className={`inline-flex items-center px-6 py-3 rounded-full text-2xl font-bold ${getScoreColor(evalResult.score)}`}>
            <StarIcon className="h-6 w-6 mr-2" />
            {evalResult.score}/100
          </div>
          <p className="text-lg font-medium text-gray-900 mt-2">
            {getRatingText(evalResult.rating)}
          </p>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <ChartBarIcon className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-sm font-medium text-gray-600">Finalización</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {automatedMetrics.completionRate.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">
              {automatedMetrics.tasksCompleted}/{automatedMetrics.tasksAssigned} tareas
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm font-medium text-gray-600">Puntualidad</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {automatedMetrics.onTimePercentage.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">
              {automatedMetrics.onTimeDeliveries} entregas a tiempo
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <ArrowTrendingUpIcon className="h-5 w-5 text-purple-500 mr-2" />
              <span className="text-sm font-medium text-gray-600">Tendencia</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {automatedMetrics.productivityTrend === 'improving' && '📈'}
              {automatedMetrics.productivityTrend === 'stable' && '➡️'}
              {automatedMetrics.productivityTrend === 'declining' && '📉'}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {automatedMetrics.productivityTrend === 'improving' && 'Mejorando'}
              {automatedMetrics.productivityTrend === 'stable' && 'Estable'}
              {automatedMetrics.productivityTrend === 'declining' && 'Declive'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <StarIcon className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="text-sm font-medium text-gray-600">Calidad</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {automatedMetrics.qualityScore}/100
            </p>
            <p className="text-xs text-gray-500">
              Score automatizado
            </p>
          </div>
        </div>

        {/* Métricas Detalladas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Métricas de Tiempo</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Tiempo promedio:</span>
                <span className="font-medium">{automatedMetrics.averageCompletionDays.toFixed(1)} días</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Entregas tempranas:</span>
                <span className="font-medium">{automatedMetrics.earlyDeliveries}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Entregas tardías:</span>
                <span className="font-medium">{automatedMetrics.delayedDeliveries}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Demora promedio:</span>
                <span className="font-medium">{automatedMetrics.averageDelayDays.toFixed(1)} días</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Productividad</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Tareas este mes:</span>
                <span className="font-medium">{automatedMetrics.tasksCompletedThisMonth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Demora máxima:</span>
                <span className="font-medium">{automatedMetrics.maxDelayDays} días</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Automatizado */}
        {evalResult.feedback && evalResult.feedback.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Feedback Automatizado</h4>
            <ul className="space-y-1">
              {evalResult.feedback.map((feedback: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm text-gray-700">{feedback}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              🤖
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                <strong>Evaluación 100% Automatizada:</strong> Esta evaluación ha sido generada 
                automáticamente basándose únicamente en datos objetivos del sistema, eliminando 
                cualquier sesgo humano o favoritismo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomatedEvaluationPanel;
