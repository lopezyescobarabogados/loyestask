import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClientSchema, type CreateClientForm, type Client } from '@/types/index'
import ErrorMessage from '@/components/ErrorMessage'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ClientAPI } from '@/api/ClientDebtAPI'
import toast from 'react-hot-toast'

interface ClientFormProps {
  onSubmit?: (client: Client) => void
  onCancel?: () => void
  initialData?: Partial<CreateClientForm>
  mode?: 'create' | 'edit'
  clientId?: string
}

export default function ClientForm({ 
  onSubmit, 
  onCancel, 
  initialData, 
  mode = 'create',
  clientId 
}: ClientFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<CreateClientForm>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      type: 'individual',
      paymentTerms: 30,
      creditLimit: 0,
      email: '',
      phone: '',
      address: '',
      taxId: '',
      contactPerson: '',
      notes: '',
      ...initialData
    }
  })

  const clientType = watch('type')

  const createClientMutation = useMutation({
    mutationFn: ClientAPI.create,
    onSuccess: (data) => {
      toast.success('Cliente creado exitosamente')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['clientStats'] })
      reset()
      onSubmit?.(data)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<CreateClientForm> }) => 
      ClientAPI.update(id, data),
    onSuccess: (data) => {
      toast.success('Cliente actualizado exitosamente')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['client', clientId] })
      queryClient.invalidateQueries({ queryKey: ['clientStats'] })
      onSubmit?.(data)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const handleFormSubmit: SubmitHandler<CreateClientForm> = async (data) => {
    setIsLoading(true)
    try {
      if (mode === 'edit' && clientId) {
        await updateClientMutation.mutateAsync({ id: clientId, data })
      } else {
        await createClientMutation.mutateAsync(data)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    reset()
    onCancel?.()
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {mode === 'edit' ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {mode === 'edit' 
            ? 'Actualiza la información del cliente' 
            : 'Completa la información para registrar un nuevo cliente'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Información Básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Cliente *
            </label>
            <input
              type="text"
              id="name"
              {...register('name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nombre completo o razón social"
            />
            {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Cliente *
            </label>
            <select
              id="type"
              {...register('type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="individual">Persona Natural</option>
              <option value="company">Empresa</option>
              <option value="government">Entidad Gubernamental</option>
            </select>
            {errors.type && <ErrorMessage>{errors.type.message}</ErrorMessage>}
          </div>
        </div>

        {/* Información de Contacto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              {...register('email')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="correo@ejemplo.com"
            />
            {errors.email && <ErrorMessage>{errors.email.message}</ErrorMessage>}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              id="phone"
              {...register('phone')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+57 300 123 4567"
            />
            {errors.phone && <ErrorMessage>{errors.phone.message}</ErrorMessage>}
          </div>
        </div>

        {/* Dirección y Documento Fiscal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <textarea
              id="address"
              {...register('address')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Dirección completa"
            />
            {errors.address && <ErrorMessage>{errors.address.message}</ErrorMessage>}
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-2">
                {clientType === 'individual' ? 'Documento de Identidad' : 
                 clientType === 'company' ? 'NIT/RUT' : 'Código Entidad'}
              </label>
              <input
                type="text"
                id="taxId"
                {...register('taxId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={clientType === 'individual' ? '12345678' : 
                           clientType === 'company' ? '900123456-1' : 'ENT001'}
              />
              {errors.taxId && <ErrorMessage>{errors.taxId.message}</ErrorMessage>}
            </div>

            {(clientType === 'company' || clientType === 'government') && (
              <div>
                <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-2">
                  Persona de Contacto
                </label>
                <input
                  type="text"
                  id="contactPerson"
                  {...register('contactPerson')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nombre del contacto principal"
                />
                {errors.contactPerson && <ErrorMessage>{errors.contactPerson.message}</ErrorMessage>}
              </div>
            )}
          </div>
        </div>

        {/* Configuración Financiera */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="creditLimit" className="block text-sm font-medium text-gray-700 mb-2">
              Límite de Crédito (COP)
            </label>
            <input
              type="number"
              id="creditLimit"
              step="0.01"
              min="0"
              {...register('creditLimit', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
            {errors.creditLimit && <ErrorMessage>{errors.creditLimit.message}</ErrorMessage>}
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
        </div>

        {/* Notas */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Notas Adicionales
          </label>
          <textarea
            id="notes"
            {...register('notes')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Información adicional sobre el cliente..."
          />
          {errors.notes && <ErrorMessage>{errors.notes.message}</ErrorMessage>}
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
              mode === 'edit' ? 'Actualizar Cliente' : 'Crear Cliente'
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
