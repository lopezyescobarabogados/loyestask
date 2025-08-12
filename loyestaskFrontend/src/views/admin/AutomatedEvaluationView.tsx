import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAutomatedEvaluation } from '@/api/PerformanceAPI';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import AutomatedEvaluationPanel from '@/components/admin/AutomatedEvaluationPanel';

const AutomatedEvaluationView: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      // Obtener datos básicos del usuario desde la evaluación automatizada
      const evaluation = await getAutomatedEvaluation(userId!, 30);
      return evaluation.user;
    },
    enabled: !!userId,
  });

  if (!userId) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">ID de usuario no válido</p>
        <Link 
          to="/admin/performance" 
          className="text-indigo-600 hover:text-indigo-900 mt-4 inline-block"
        >
          Volver al panel de performance
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/admin/performance"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Volver al Panel de Performance
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Evaluación Automatizada</h1>
            <p className="mt-2 text-sm text-gray-600">
              Sistema de evaluación 100% objetiva sin intervención humana
            </p>
          </div>
          
          <div className="flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
            <span className="text-sm font-medium">🤖 Completamente Automatizado</span>
          </div>
        </div>
      </div>

      {/* Panel de Evaluación */}
      <AutomatedEvaluationPanel 
        userId={userId} 
        userName={user?.name || 'Usuario'} 
      />
    </div>
  );
};

export default AutomatedEvaluationView;
