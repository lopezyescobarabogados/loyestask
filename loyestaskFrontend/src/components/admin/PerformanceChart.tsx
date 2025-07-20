import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface PerformanceChartProps {
  data: Array<{
    user: {
      _id: string;
      name: string;
      email: string;
    };
    metrics: {
      averageCompletionTime: number;
      onTimePercentage: number;
      productivityTrend: number;
      estimatedCompletionTime: number;
      totalTasks: number;
      completedTasks: number;
      tasksInProgress: number;
    };
    latestEvaluation: {
      score: number;
      date: string;
    } | null;
  }>;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
  // Datos para gráfica de barras - Rendimiento general
  const barChartData = {
    labels: data.map(item => item.user.name),
    datasets: [
      {
        label: 'Porcentaje Puntualidad',
        data: data.map(item => item.metrics.onTimePercentage),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
      {
        label: 'Tareas Completadas',
        data: data.map(item => item.metrics.completedTasks),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Tiempo Promedio (días)',
        data: data.map(item => item.metrics.averageCompletionTime),
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
        borderColor: 'rgba(249, 115, 22, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Datos para gráfica lineal - Predicciones
  const lineChartData = {
    labels: data.map(item => item.user.name),
    datasets: [
      {
        label: 'Tendencia de Productividad (%)',
        data: data.map(item => item.metrics.productivityTrend),
        borderColor: 'rgba(168, 85, 247, 1)',
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Tiempo Estimado Futuro (días)',
        data: data.map(item => item.metrics.estimatedCompletionTime),
        borderColor: 'rgba(236, 72, 153, 1)',
        backgroundColor: 'rgba(236, 72, 153, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Métricas de Rendimiento por Usuario',
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Predicciones y Tendencias de Productividad',
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Gráficas de Rendimiento
        </h3>
        <p className="text-gray-500">No hay datos disponibles para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Gráfica de Barras */}
      <div className="bg-white p-6 rounded-lg shadow">
        <Bar data={barChartData} options={barOptions} />
      </div>

      {/* Gráfica Lineal */}
      <div className="bg-white p-6 rounded-lg shadow">
        <Line data={lineChartData} options={lineOptions} />
      </div>

      {/* Tabla de Evaluaciones */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Últimas Evaluaciones
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puntuación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puntualidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Productividad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Evaluación
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item) => (
                <tr key={item.user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.user.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.latestEvaluation
                        ? item.latestEvaluation.score >= 80
                          ? 'bg-green-100 text-green-800'
                          : item.latestEvaluation.score >= 60
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.latestEvaluation ? `${item.latestEvaluation.score}/100` : 'Sin evaluar'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            item.metrics.onTimePercentage >= 80
                              ? 'bg-green-500'
                              : item.metrics.onTimePercentage >= 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(item.metrics.onTimePercentage, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">
                        {item.metrics.onTimePercentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${
                        item.metrics.productivityTrend > 0
                          ? 'text-green-600'
                          : item.metrics.productivityTrend < 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}>
                        {item.metrics.productivityTrend > 0 ? '↗' : item.metrics.productivityTrend < 0 ? '↘' : '→'}
                        {Math.abs(item.metrics.productivityTrend).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.latestEvaluation
                      ? new Date(item.latestEvaluation.date).toLocaleDateString('es-ES')
                      : 'N/A'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PerformanceChart;
