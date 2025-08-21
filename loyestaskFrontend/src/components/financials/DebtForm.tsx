import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createDebtSchema, type CreateDebtForm, type Debt, type Client } from '@/types/index'
import ErrorMessage from '@/components/ErrorMessage'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { DebtAPI, ClientAPI } from '@/api/ClientDebtAPI'
import toast from 'react-hot-toast'
import CurrencyInput from '../ui/CurrencyInput'

interface DebtFormProps {
  onSubmit?: (debt: Debt) => void
  onCancel?: () => void
  initialData?: Partial<CreateDebtForm>
  mode?: 'create' | 'edit'
  debtId?: string
}

export default function DebtForm({ 
  onSubmit, 
  onCancel, 
  initialData, 
  mode = 'create',
  debtId 
}: DebtFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<CreateDebtForm>({
    resolver: zodResolver(createDebtSchema),
    defaultValues: {
      priority: 'medium',
      paymentTerms: 30,
      interestRate: 0,
      emailNotifications: true,
      ...initialData
    }
  })

  // Búsqueda de clientes
  const { data: searchResults } = useQuery({
    queryKey: ['clientSearch', clientSearch],
    queryFn: () => ClientAPI.search(clientSearch),
    enabled: clientSearch.length >= 2
  })

  const createDebtMutation = useMutation({
    mutationFn: DebtAPI.create,
    onSuccess: (data) => {
      toast.success('Deuda creada exitosamente')
      queryClient.invalidateQueries({ queryKey: ['debts'] })
      queryClient.invalidateQueries({ queryKey: ['debtStats'] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      reset()
      onSubmit?.(data)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const updateDebtMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<CreateDebtForm> }) => 
      DebtAPI.update(id, data),
    onSuccess: (data) => {
      toast.success('Deuda actualizada exitosamente')
      queryClient.invalidateQueries({ queryKey: ['debts'] })
      queryClient.invalidateQueries({ queryKey: ['debt', debtId] })
      queryClient.invalidateQueries({ queryKey: ['debtStats'] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      onSubmit?.(data)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const handleFormSubmit: SubmitHandler<CreateDebtForm> = async (data) => {
    setIsLoading(true)
    try {
      if (mode === 'edit' && debtId) {
        await updateDebtMutation.mutateAsync({ id: debtId, data })
      } else {
        await createDebtMutation.mutateAsync(data)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    reset()
    onCancel?.()
  }

  const handleClientSelect = (client: Client) => {
    setValue('client', client._id)
    setClientSearch(client.name)
    setShowDropdown(false) // Ocultar dropdown después de seleccionar
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    }
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      urgent: 'Urgente'
    }
    return labels[priority as keyof typeof labels] || priority
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {mode === 'edit' ? 'Editar Deuda' : 'Nueva Deuda'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {mode === 'edit' 
            ? 'Actualiza la información de la deuda' 
            : 'Completa la información para registrar una nueva deuda'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Selección de Cliente */}
        <div>
          <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-2">
            Cliente *
          </label>
          <div className="relative">
            <input
              type="text"
              value={clientSearch}
              onChange={(e) => {
                setClientSearch(e.target.value)
                setShowDropdown(true) // Mostrar dropdown al escribir
              }}
              placeholder="Buscar cliente por nombre..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {/* Cliente oculto para react-hook-form */}
            <input
              type="hidden"
              {...register('client')}
            />
            
            {/* Resultados de búsqueda */}
            {searchResults && searchResults.length > 0 && clientSearch.length >= 2 && showDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {searchResults.map((client) => (
                  <button
                    key={client._id}
                    type="button"
                    onClick={() => handleClientSelect(client)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                  >
                    <div className="font-medium text-gray-900">{client.name}</div>
                    <div className="text-sm text-gray-500">
                      {client.email} • {client.type === 'individual' ? 'Persona Natural' : 
                                         client.type === 'company' ? 'Empresa' : 'Entidad Gubernamental'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {errors.client && <ErrorMessage>{errors.client.message}</ErrorMessage>}
        </div>

        {/* Información de la Deuda */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe el concepto de la deuda..."
            />
            {errors.description && <ErrorMessage>{errors.description.message}</ErrorMessage>}
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-2">
                Monto Total (COP) *
              </label>
              <CurrencyInput
                id="totalAmount"
                name="totalAmount"
                value={watch('totalAmount')}
                onChange={(value) => setValue('totalAmount', value)}
                placeholder="1.000.000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              {errors.totalAmount && <ErrorMessage>{errors.totalAmount.message}</ErrorMessage>}
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Prioridad *
              </label>
              <div className="flex space-x-2">
                {(['low', 'medium', 'high', 'urgent'] as const).map((priority) => (
                  <label key={priority} className="flex items-center">
                    <input
                      type="radio"
                      value={priority}
                      {...register('priority')}
                      className="sr-only"
                    />
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                      watch('priority') === priority 
                        ? getPriorityColor(priority)
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                      {getPriorityLabel(priority)}
                    </span>
                  </label>
                ))}
              </div>
              {errors.priority && <ErrorMessage>{errors.priority.message}</ErrorMessage>}
            </div>
          </div>
        </div>

        {/* Fechas y Términos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Vencimiento *
            </label>
            <input
              type="date"
              id="dueDate"
              {...register('dueDate')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.dueDate && <ErrorMessage>{errors.dueDate.message}</ErrorMessage>}
          </div>

          <div>
            <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700 mb-2">
              Términos de Pago (días) *
            </label>
            <input
              type="number"
              id="paymentTerms"
              min="1"
              max="365"
              {...register('paymentTerms', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="30"
            />
            {errors.paymentTerms && <ErrorMessage>{errors.paymentTerms.message}</ErrorMessage>}
          </div>

          <div>
            <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-2">
              Tasa de Interés (% mensual)
            </label>
            <input
              type="number"
              id="interestRate"
              step="0.01"
              min="0"
              max="100"
              {...register('interestRate', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="2.50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ejemplo: 2.5% mensual = $25.000 por mes sobre $1.000.000
            </p>
            {errors.interestRate && <ErrorMessage>{errors.interestRate.message}</ErrorMessage>}
          </div>
        </div>

        {/* Notas y Configuración */}
        <div className="space-y-4">
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notas Adicionales
            </label>
            <textarea
              id="notes"
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Información adicional sobre la deuda..."
            />
            {errors.notes && <ErrorMessage>{errors.notes.message}</ErrorMessage>}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="emailNotifications"
              {...register('emailNotifications')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-700">
              Enviar notificaciones por email automáticamente
            </label>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </span>
            ) : (
              mode === 'edit' ? 'Actualizar Deuda' : 'Crear Deuda'
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 sm:flex-initial px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
