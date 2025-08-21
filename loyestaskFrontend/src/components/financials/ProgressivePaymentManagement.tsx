import { useState } from 'react'
import { usePayments, useCreatePayment, useUpdatePayment, useDeletePayment } from '@/hooks/usePayments'
import { useAccounts } from '@/hooks/useAccounts'
import {
    CurrencyDollarIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    ExclamationTriangleIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    BanknotesIcon,
    CreditCardIcon,
} from '@heroicons/react/24/outline'
import type { Payment, CreatePaymentForm, Account } from '@/types/index'

// Función utilitaria para formatear moneda
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
    }).format(amount)
}

// Función utilitaria para formatear fecha
const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date))
}

// Función utilitaria para obtener color del estado
const getStatusColor = (status: string) => {
    const colors = {
        pending: 'bg-yellow-100 text-yellow-800',
        completed: 'bg-green-100 text-green-800',
        failed: 'bg-red-100 text-red-800',
        cancelled: 'bg-gray-100 text-gray-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

// Función utilitaria para obtener color del tipo
const getTypeColor = (type: string) => {
    return type === 'income' ? 'text-green-600' : 'text-red-600'
}

// Función utilitaria para obtener icono del método
const getMethodIcon = (method: string) => {
    const icons = {
        cash: BanknotesIcon,
        bank_transfer: ArrowUpIcon,
        credit_card: CreditCardIcon,
        debit_card: CreditCardIcon,
        check: ArrowDownIcon,
        transfer: ArrowUpIcon,
        other: CurrencyDollarIcon,
    }
    return icons[method as keyof typeof icons] || CurrencyDollarIcon
}

// Función utilitaria para traducir estados
const getStatusLabel = (status: string) => {
    const labels = {
        pending: 'Pendiente',
        completed: 'Completado',
        failed: 'Fallido',
        cancelled: 'Cancelado',
    }
    return labels[status as keyof typeof labels] || status
}

// Función utilitaria para traducir métodos
const getMethodLabel = (method: string) => {
    const labels = {
        cash: 'Efectivo',
        bank_transfer: 'Transferencia Bancaria',
        credit_card: 'Tarjeta de Crédito',
        debit_card: 'Tarjeta de Débito',
        check: 'Cheque',
        transfer: 'Transferencia',
        other: 'Otro',
    }
    return labels[method as keyof typeof labels] || method
}

// Esqueleto de carga para los pagos
function PaymentsSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="flex justify-between items-center">
                <div className="h-8 bg-gray-200 rounded w-48"></div>
                <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="flex gap-4">
                <div className="h-10 bg-gray-200 rounded flex-1"></div>
                <div className="h-10 bg-gray-200 rounded w-32"></div>
                <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
            </div>
            <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
            </div>
        </div>
    )
}

// Componente de error
function PaymentsError({ error, onRetry }: { error: Error; onRetry: () => void }) {
    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">Error al cargar pagos</h3>
            <p className="text-red-600 mb-4">{error.message}</p>
            <button
                onClick={onRetry}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
                Intentar nuevamente
            </button>
        </div>
    )
}

// Modal para crear/editar pago
function PaymentModal({ 
    isOpen, 
    onClose, 
    payment = null,
    onSave,
    accounts = []
}: { 
    isOpen: boolean
    onClose: () => void
    payment?: Payment | null
    onSave: (data: CreatePaymentForm) => void 
    accounts?: Account[]
}) {
    const [formData, setFormData] = useState<CreatePaymentForm>({
        type: payment?.type || 'expense',
        method: payment?.method || 'bank_transfer',
        amount: payment?.amount || 0,
        description: payment?.description || '',
        category: payment?.category || '',
        paymentDate: payment?.paymentDate ? new Date(payment.paymentDate).toISOString().split('T')[0] : '',
        account: payment?.account || '',
        notes: payment?.notes || '',
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(formData)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">
                    {payment ? 'Editar Pago' : 'Nuevo Pago'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                        >
                            <option value="income">Ingreso</option>
                            <option value="expense">Gasto</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Método de Pago
                        </label>
                        <select
                            value={formData.method}
                            onChange={(e) => setFormData({ 
                                ...formData, 
                                method: e.target.value as 'cash' | 'bank_transfer' | 'check' | 'credit_card' | 'debit_card' | 'transfer' | 'other'
                            })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                        >
                            <option value="cash">Efectivo</option>
                            <option value="bank_transfer">Transferencia Bancaria</option>
                            <option value="credit_card">Tarjeta de Crédito</option>
                            <option value="debit_card">Tarjeta de Débito</option>
                            <option value="check">Cheque</option>
                            <option value="transfer">Transferencia</option>
                            <option value="other">Otro</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cuenta
                        </label>
                        <select
                            value={formData.account}
                            onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                        >
                            <option value="">Seleccionar cuenta</option>
                            {accounts.map((account) => (
                                <option key={account._id} value={account._id}>
                                    {account.name} ({formatCurrency(account.balance)})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Monto
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            rows={3}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Categoría
                        </label>
                        <input
                            type="text"
                            value={formData.category || ''}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Ej: Marketing, Oficina, Servicios"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha de Pago
                        </label>
                        <input
                            type="date"
                            value={formData.paymentDate}
                            onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notas
                        </label>
                        <textarea
                            value={formData.notes || ''}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            rows={2}
                            placeholder="Notas adicionales..."
                        />
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            {payment ? 'Actualizar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function ProgressivePaymentManagement() {
    const [searchTerm, setSearchTerm] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null)

    // Hooks de React Query
    const { data: paymentsData, isLoading, error, refetch } = usePayments()
    const { data: accountsData } = useAccounts()
    const createPaymentMutation = useCreatePayment()
    const updatePaymentMutation = useUpdatePayment()
    const deletePaymentMutation = useDeletePayment()

    // Extraer arrays
    const payments = paymentsData?.payments || []
    const accounts = accountsData?.accounts || []

    // Filtrar pagos
    const filteredPayments = payments.filter((payment: Payment) => {
        const matchesSearch = payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             payment.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesType = !typeFilter || payment.type === typeFilter
        const matchesStatus = !statusFilter || payment.status === statusFilter
        return matchesSearch && matchesType && matchesStatus
    })

    // Calcular estadísticas
    const stats = {
        total: payments.length,
        income: payments.filter((p: Payment) => p.type === 'income').length,
        expense: payments.filter((p: Payment) => p.type === 'expense').length,
        completed: payments.filter((p: Payment) => p.status === 'completed').length,
        totalAmount: payments.reduce((sum: number, p: Payment) => sum + p.amount, 0),
        incomeAmount: payments.filter((p: Payment) => p.type === 'income').reduce((sum: number, p: Payment) => sum + p.amount, 0),
        expenseAmount: payments.filter((p: Payment) => p.type === 'expense').reduce((sum: number, p: Payment) => sum + p.amount, 0),
    }

    // Handlers
    const handleCreatePayment = (data: CreatePaymentForm) => {
        createPaymentMutation.mutate(data, {
            onSuccess: () => {
                refetch()
                setShowModal(false)
            }
        })
    }

    const handleUpdatePayment = (data: CreatePaymentForm) => {
        if (editingPayment) {
            updatePaymentMutation.mutate({ 
                id: editingPayment._id, 
                data 
            }, {
                onSuccess: () => {
                    refetch()
                    setEditingPayment(null)
                    setShowModal(false)
                }
            })
        }
    }

    const handleDeletePayment = (payment: Payment) => {
        if (confirm(`¿Estás seguro de eliminar el pago ${payment.paymentNumber}?`)) {
            deletePaymentMutation.mutate(payment._id, {
                onSuccess: () => {
                    refetch()
                }
            })
        }
    }

    const handleEditPayment = (payment: Payment) => {
        setEditingPayment(payment)
        setShowModal(true)
    }

    if (isLoading) {
        return <PaymentsSkeleton />
    }

    if (error) {
        return <PaymentsError error={error} onRetry={refetch} />
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold leading-6 text-gray-900">
                        Gestión de Pagos
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Administra todos los ingresos y gastos del sistema
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingPayment(null)
                        setShowModal(true)
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                    <PlusIcon className="h-5 w-5" />
                    Nuevo Pago
                </button>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Total de Pagos</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                    <div className="text-sm text-gray-600">{formatCurrency(stats.totalAmount)}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Ingresos</div>
                    <div className="text-2xl font-bold text-green-600">{stats.income}</div>
                    <div className="text-sm text-green-600">{formatCurrency(stats.incomeAmount)}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Gastos</div>
                    <div className="text-2xl font-bold text-red-600">{stats.expense}</div>
                    <div className="text-sm text-red-600">{formatCurrency(stats.expenseAmount)}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Balance</div>
                    <div className={`text-2xl font-bold ${stats.incomeAmount - stats.expenseAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(stats.incomeAmount - stats.expenseAmount)}
                    </div>
                    <div className="text-sm text-gray-600">{stats.completed} completados</div>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por descripción o número..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="relative">
                    <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Todos los tipos</option>
                        <option value="income">Ingresos</option>
                        <option value="expense">Gastos</option>
                    </select>
                </div>
                <div className="relative">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Todos los estados</option>
                        <option value="pending">Pendiente</option>
                        <option value="completed">Completado</option>
                        <option value="failed">Fallido</option>
                        <option value="cancelled">Cancelado</option>
                    </select>
                </div>
            </div>

            {/* Lista de pagos */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Pago
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Monto
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Método
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        <CurrencyDollarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                        {searchTerm || typeFilter || statusFilter ? 'No se encontraron pagos con los filtros aplicados' : 'No hay pagos registrados'}
                                    </td>
                                </tr>
                            ) : (
                                filteredPayments.map((payment: Payment) => {
                                    const MethodIcon = getMethodIcon(payment.method)
                                    return (
                                        <tr key={payment._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {payment.paymentNumber}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {payment.description?.substring(0, 50)}...
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className={`flex items-center ${getTypeColor(payment.type)}`}>
                                                    {payment.type === 'income' ? (
                                                        <ArrowUpIcon className="h-4 w-4 mr-1" />
                                                    ) : (
                                                        <ArrowDownIcon className="h-4 w-4 mr-1" />
                                                    )}
                                                    {payment.type === 'income' ? 'Ingreso' : 'Gasto'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <span className={getTypeColor(payment.type)}>
                                                    {formatCurrency(payment.amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <MethodIcon className="h-4 w-4 mr-2 text-gray-400" />
                                                    <span className="text-sm text-gray-900">
                                                        {getMethodLabel(payment.method)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                                                    {getStatusLabel(payment.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(payment.paymentDate)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEditPayment(payment)}
                                                        className="text-blue-600 hover:text-blue-900 p-1"
                                                        title="Editar"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePayment(payment)}
                                                        className="text-red-600 hover:text-red-900 p-1"
                                                        title="Eliminar"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal para crear/editar */}
            <PaymentModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false)
                    setEditingPayment(null)
                }}
                payment={editingPayment}
                onSave={editingPayment ? handleUpdatePayment : handleCreatePayment}
                accounts={accounts}
            />
        </div>
    )
}
