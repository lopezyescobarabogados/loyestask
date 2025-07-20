import React from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createUserEvaluation } from '@/api/PerformanceAPI';
import { toast } from 'react-toastify';
import ErrorMessage from '../ErrorMessage';
import type { CreateEvaluationForm } from '@/types/index';

interface CreateEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

const CreateEvaluationModal: React.FC<CreateEvaluationModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
}) => {
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch
  } = useForm<CreateEvaluationForm>();

  const { mutate: createEvaluation, isPending } = useMutation({
    mutationFn: (data: CreateEvaluationForm) => createUserEvaluation(userId, data),
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: (data) => {
      toast.success(data);
      queryClient.invalidateQueries({ queryKey: ['userEvaluations', userId] });
      reset();
      onClose();
    }
  });

  const onSubmit = (data: CreateEvaluationForm) => {
    createEvaluation(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Calcular puntuación automática basada en métricas
  const calculateScore = () => {
    const metrics = watch('metrics');
    if (!metrics) return 0;
    
    const {
      taskCompletionRate = 0,
      averageCompletionTime = 0,
      productivity = 0,
      qualityScore = 0
    } = metrics;

    // Fórmula para calcular puntuación (se puede ajustar)
    const timeScore = Math.max(0, 100 - (averageCompletionTime - 3) * 5); // Penalizar si toma más de 3 días
    const productivityScore = Math.min(productivity * 2, 100); // Máximo 50 tareas = 100 puntos
    const qualityScore10 = (qualityScore / 10) * 100; // Convertir de 1-10 a 1-100
    
    const totalScore = (
      taskCompletionRate * 0.3 +
      timeScore * 0.25 +
      productivityScore * 0.25 +
      qualityScore10 * 0.2
    );

    return Math.round(Math.max(1, Math.min(100, totalScore)));
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto max-w-2xl w-full bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Crear Evaluación para {userName}
            </DialogTitle>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Período de Evaluación */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  {...register('period.startDate', {
                    required: 'La fecha de inicio es obligatoria'
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.period?.startDate && (
                  <ErrorMessage>{errors.period.startDate.message}</ErrorMessage>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de Fin
                </label>
                <input
                  type="date"
                  {...register('period.endDate', {
                    required: 'La fecha de fin es obligatoria'
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.period?.endDate && (
                  <ErrorMessage>{errors.period.endDate.message}</ErrorMessage>
                )}
              </div>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tasa de Finalización (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  {...register('metrics.taskCompletionRate', {
                    required: 'La tasa de finalización es obligatoria',
                    min: { value: 0, message: 'Debe ser mayor a 0' },
                    max: { value: 100, message: 'Debe ser menor a 100' }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.metrics?.taskCompletionRate && (
                  <ErrorMessage>{errors.metrics.taskCompletionRate.message}</ErrorMessage>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tiempo Promedio (días)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  {...register('metrics.averageCompletionTime', {
                    required: 'El tiempo promedio es obligatorio',
                    min: { value: 0, message: 'Debe ser mayor a 0' }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.metrics?.averageCompletionTime && (
                  <ErrorMessage>{errors.metrics.averageCompletionTime.message}</ErrorMessage>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Productividad (tareas/período)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  {...register('metrics.productivity', {
                    required: 'La productividad es obligatoria',
                    min: { value: 0, message: 'Debe ser mayor a 0' }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.metrics?.productivity && (
                  <ErrorMessage>{errors.metrics.productivity.message}</ErrorMessage>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Puntuación de Calidad (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  {...register('metrics.qualityScore', {
                    required: 'La puntuación de calidad es obligatoria',
                    min: { value: 1, message: 'Debe ser mayor a 1' },
                    max: { value: 10, message: 'Debe ser menor a 10' }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.metrics?.qualityScore && (
                  <ErrorMessage>{errors.metrics.qualityScore.message}</ErrorMessage>
                )}
              </div>
            </div>

            {/* Puntuación General */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Puntuación General (1-100)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  {...register('score', {
                    required: 'La puntuación es obligatoria',
                    min: { value: 1, message: 'Debe ser mayor a 1' },
                    max: { value: 100, message: 'Debe ser menor a 100' }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const score = calculateScore();
                    register('score').onChange({ target: { value: score } });
                  }}
                  className="mt-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Calcular
                </button>
              </div>
              {errors.score && (
                <ErrorMessage>{errors.score.message}</ErrorMessage>
              )}
            </div>

            {/* Comentarios */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Comentarios
              </label>
              <textarea
                rows={4}
                {...register('comments', {
                  required: 'Los comentarios son obligatorios',
                  minLength: { value: 10, message: 'Debe tener al menos 10 caracteres' }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Describe el desempeño del usuario, fortalezas y áreas de mejora..."
              />
              {errors.comments && (
                <ErrorMessage>{errors.comments.message}</ErrorMessage>
              )}
            </div>

            {/* Recomendaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Recomendaciones (Opcional)
              </label>
              <textarea
                rows={3}
                {...register('recommendations')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Sugerencias para mejorar el rendimiento..."
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {isPending ? 'Creando...' : 'Crear Evaluación'}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default CreateEvaluationModal;
