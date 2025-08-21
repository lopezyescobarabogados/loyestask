import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DebtAPI, ClientAPI } from '@/api/ClientDebtAPI'
import type { Debt } from '@/types/index'
import DebtForm from './DebtForm'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/utils/financialUtils'

export default function DebtManagement() {
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    status: '' as '' | 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled',
    priority: '' as '' | 'low' | 'medium' | 'high' | 'urgent',
    client: '',
    search: ''
  })
  const [showForm, setShowForm] = useState(false)
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null)

  const queryClient = useQueryClient()
  const limit = 10

  // Obtener deudas
  const { data: debtsData, isLoading: loadingDebts } = useQuery({
    queryKey: ['debts', currentPage, filters],
    queryFn: () => DebtAPI.getAll({
      page: currentPage,
      limit,
      status: filters.status || undefined,
      priority: filters.priority || undefined,
      client: filters.client || undefined,
      search: filters.search || undefined
    })
  })

  // Obtener estadísticas
  const { data: stats } = useQuery({
    queryKey: ['debtStats'],
    queryFn: () => DebtAPI.getStats()
  })

  // Obtener clientes para filtro
  const { data: clientsData } = useQuery({
    queryKey: ['clientsSelect'],
    queryFn: () => ClientAPI.getAll({ limit: 100 })
  })

  // Mutación para eliminar deuda
  const deleteDebtMutation = useMutation({
    mutationFn: DebtAPI.delete,
    onSuccess: () => {
      toast.success('Deuda eliminada exitosamente')
      queryClient.invalidateQueries({ queryKey: ['debts'] })
      queryClient.invalidateQueries({ queryKey: ['debtStats'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  // Mutación para cambiar estado
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled' }) =>
      DebtAPI.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Estado actualizado exitosamente')
      queryClient.invalidateQueries({ queryKey: ['debts'] })
      queryClient.invalidateQueries({ queryKey: ['debtStats'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  // Mutación para enviar notificación
  const sendNotificationMutation = useMutation({
    mutationFn: DebtAPI.sendNotification,
    onSuccess: () => {
      toast.success('Notificación enviada exitosamente')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const handleEdit = (debt: Debt) => {
    setEditingDebt(debt)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta deuda?')) {
      await deleteDebtMutation.mutateAsync(id)
    }
  }

  const handleStatusChange = async (id: string, status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled') => {
    await updateStatusMutation.mutateAsync({ id, status })
  }

  const handleSendNotification = async (id: string) => {
    await sendNotificationMutation.mutateAsync(id)
  }

  const handleFormSubmit = () => {
    setShowForm(false)
    setEditingDebt(null)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingDebt(null)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-orange-100 text-orange-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }
    return statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    }
    return priorityConfig[priority as keyof typeof priorityConfig] || 'bg-gray-100 text-gray-800'
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

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  if (showForm) {
    return (
      <DebtForm
        mode={editingDebt ? 'edit' : 'create'}
        debtId={editingDebt?._id}
        initialData={editingDebt ? {
          client: typeof editingDebt.client === 'object' ? editingDebt.client._id : editingDebt.client,
          description: editingDebt.description,
          totalAmount: editingDebt.totalAmount,
          priority: editingDebt.priority,
          dueDate: editingDebt.dueDate.split('T')[0],
          paymentTerms: editingDebt.paymentTerms,
          interestRate: editingDebt.interestRate || 0,
          notes: editingDebt.notes || '',
          emailNotifications: editingDebt.emailNotifications
        } : undefined}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Deudas</h1>
          <p className="text-sm text-gray-600">Administra las deudas y pagos de tus clientes</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          + Nueva Deuda
        </button>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Deudas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDebts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Vencidas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdueCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Por Cobrar</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount.remaining)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cobrado</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount.paid)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              id="search"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Descripción, número..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
              Cliente
            </label>
            <select
              id="client"
              value={filters.client}
              onChange={(e) => handleFilterChange('client', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los clientes</option>
              {clientsData?.clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              id="status"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="partial">Parcial</option>
              <option value="paid">Pagada</option>
              <option value="overdue">Vencida</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Prioridad
            </label>
            <select
              id="priority"
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las prioridades</option>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Deudas */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loadingDebts ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando deudas...</p>
          </div>
        ) : debtsData?.debts.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay deudas</h3>
            <p className="mt-1 text-sm text-gray-500">Comienza registrando tu primera deuda.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                + Nueva Deuda
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deuda
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vencimiento
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {debtsData?.debts.map((debt) => (
                    <tr key={debt._id} className={`hover:bg-gray-50 ${isOverdue(debt.dueDate) && debt.status !== 'paid' ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{debt.debtNumber}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{debt.description}</div>
                          <div className="flex space-x-1 mt-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadge(debt.priority)}`}>
                              {getPriorityLabel(debt.priority)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {typeof debt.client === 'object' ? debt.client.name : 'Cliente no disponible'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(debt.totalAmount)}</div>
                        <div className="text-sm text-gray-500">
                          Restante: {formatCurrency(debt.remainingAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={debt.status}
                          onChange={(e) => handleStatusChange(debt._id, e.target.value as 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled')}
                          className={`text-xs font-semibold rounded-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 ${getStatusBadge(debt.status)}`}
                        >
                          <option value="pending">Pendiente</option>
                          <option value="partial">Parcial</option>
                          <option value="paid">Pagada</option>
                          <option value="overdue">Vencida</option>
                          <option value="cancelled">Cancelada</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isOverdue(debt.dueDate) && debt.status !== 'paid' ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                          {new Date(debt.dueDate).toLocaleDateString()}
                        </div>
                        {isOverdue(debt.dueDate) && debt.status !== 'paid' && (
                          <div className="text-xs text-red-500">Vencida</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleSendNotification(debt._id)}
                            className="text-yellow-600 hover:text-yellow-900 p-1 rounded"
                            title="Enviar notificación"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(debt)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(debt._id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Eliminar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {debtsData && debtsData.totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando {((currentPage - 1) * limit) + 1} a {Math.min(currentPage * limit, debtsData.total)} de {debtsData.total} deudas
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">
                      {currentPage}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, debtsData.totalPages))}
                      disabled={currentPage === debtsData.totalPages}
                      className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
