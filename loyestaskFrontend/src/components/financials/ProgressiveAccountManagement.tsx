import { useState } from 'react'
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount, useAccountMovements } from '@/hooks/useAccounts'
import {
    BanknotesIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    ExclamationTriangleIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    CreditCardIcon,
    BuildingLibraryIcon,
    EyeIcon,
} from '@heroicons/react/24/outline'
import type { Account, CreateAccountForm, AccountMovement } from '@/types/index'

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
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date))
}

// Función utilitaria para obtener color del estado
const getStatusColor = (status: string) => {
    const colors = {
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-gray-100 text-gray-800',
        suspended: 'bg-red-100 text-red-800',
        closed: 'bg-yellow-100 text-yellow-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

// Función utilitaria para obtener color del tipo
const getTypeColor = (type: string) => {
    const colors = {
        bank: 'text-blue-600',
        cash: 'text-green-600',
        credit_card: 'text-purple-600',
        savings: 'text-teal-600',
        other: 'text-gray-600',
    }
    return colors[type as keyof typeof colors] || 'text-gray-600'
}

// Función utilitaria para obtener icono del tipo
const getTypeIcon = (type: string) => {
    const icons = {
        bank: BuildingLibraryIcon,
        cash: BanknotesIcon,
        credit_card: CreditCardIcon,
        savings: ArrowDownIcon,
        other: BanknotesIcon,
    }
    return icons[type as keyof typeof icons] || BanknotesIcon
}

// Función utilitaria para traducir estados
const getStatusLabel = (status: string) => {
    const labels = {
        active: 'Activa',
        inactive: 'Inactiva',
        closed: 'Cerrada',
    }
    return labels[status as keyof typeof labels] || status
}

// Función utilitaria para traducir tipos
const getTypeLabel = (type: string) => {
    const labels = {
        bank: 'Bancaria',
        cash: 'Efectivo',
        credit_card: 'Tarjeta de Crédito',
        savings: 'Ahorro',
        other: 'Otro',
    }
    return labels[type as keyof typeof labels] || type
}

// Esqueleto de carga para las cuentas
function AccountsSkeleton() {
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
function AccountsError({ error, onRetry }: { error: Error; onRetry: () => void }) {
    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">Error al cargar cuentas</h3>
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

// Modal para crear/editar cuenta
function AccountModal({ 
    isOpen, 
    onClose, 
    account = null,
    onSave
}: { 
    isOpen: boolean
    onClose: () => void
    account?: Account | null
    onSave: (data: CreateAccountForm) => void 
}) {
    const [formData, setFormData] = useState<CreateAccountForm>({
        name: account?.name || '',
        type: account?.type || 'bank',
        accountNumber: account?.accountNumber || '',
        bankName: account?.bankName || '',
        initialBalance: account?.balance || 0,
        description: account?.description || '',
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
                    {account ? 'Editar Cuenta' : 'Nueva Cuenta'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre de la Cuenta
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Cuenta
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ 
                                ...formData, 
                                type: e.target.value as 'bank' | 'cash' | 'credit_card' | 'savings' | 'other'
                            })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                        >
                            <option value="bank">Bancaria</option>
                            <option value="cash">Efectivo</option>
                            <option value="credit_card">Tarjeta de Crédito</option>
                            <option value="savings">Ahorro</option>
                            <option value="other">Otro</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Número de Cuenta
                        </label>
                        <input
                            type="text"
                            value={formData.accountNumber || ''}
                            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Opcional"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Banco/Institución
                        </label>
                        <input
                            type="text"
                            value={formData.bankName || ''}
                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Opcional"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Saldo Inicial
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.initialBalance}
                            onChange={(e) => setFormData({ ...formData, initialBalance: parseFloat(e.target.value) || 0 })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                        </label>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            rows={3}
                            placeholder="Descripción opcional de la cuenta"
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
                            {account ? 'Actualizar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Modal para ver movimientos de cuenta
function MovementsModal({ 
    isOpen, 
    onClose, 
    account,
    movements = []
}: { 
    isOpen: boolean
    onClose: () => void
    account?: Account | null
    movements?: AccountMovement[]
}) {
    if (!isOpen || !account) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                        Movimientos de {account.name}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                </div>
                
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-sm text-gray-500">Saldo Actual</div>
                            <div className={`text-xl font-bold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(account.balance)}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Tipo de Cuenta</div>
                            <div className="text-lg font-medium">
                                {getTypeLabel(account.type)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Descripción
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Monto
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Saldo
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {movements.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <BanknotesIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                        No hay movimientos registrados
                                    </td>
                                </tr>
                            ) : (
                                movements.map((movement: AccountMovement, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(movement.date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {movement.description}
                                            </div>
                                            {movement.relatedAccount && (
                                                <div className="text-sm text-gray-500">
                                                    Ref: {movement.relatedAccount}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`flex items-center ${movement.type === 'income' || movement.type === 'transfer_in' ? 'text-green-600' : 'text-red-600'}`}>
                                                {movement.type === 'income' || movement.type === 'transfer_in' ? (
                                                    <ArrowUpIcon className="h-4 w-4 mr-1" />
                                                ) : (
                                                    <ArrowDownIcon className="h-4 w-4 mr-1" />
                                                )}
                                                {movement.type === 'income' ? 'Ingreso' : 
                                                 movement.type === 'expense' ? 'Gasto' :
                                                 movement.type === 'transfer_in' ? 'Transferencia Entrante' :
                                                 'Transferencia Saliente'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={movement.type === 'income' || movement.type === 'transfer_in' ? 'text-green-600' : 'text-red-600'}>
                                                {movement.type === 'income' || movement.type === 'transfer_in' ? '+' : '-'}{formatCurrency(movement.amount)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatCurrency(movement.balance)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default function ProgressiveAccountManagement() {
    const [searchTerm, setSearchTerm] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [showMovementsModal, setShowMovementsModal] = useState(false)
    const [editingAccount, setEditingAccount] = useState<Account | null>(null)
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)

    // Hooks de React Query
    const { data: accountsData, isLoading, error, refetch } = useAccounts()
    const { data: movementsData } = useAccountMovements(selectedAccount?._id || '')
    const createAccountMutation = useCreateAccount()
    const updateAccountMutation = useUpdateAccount()
    const deleteAccountMutation = useDeleteAccount()

    // Extraer arrays
    const accounts = accountsData?.accounts || []
    const movements = movementsData?.movements || []

    // Filtrar cuentas
    const filteredAccounts = accounts.filter((account: Account) => {
        const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (account.accountNumber && account.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchesType = !typeFilter || account.type === typeFilter
        const matchesStatus = !statusFilter || account.status === statusFilter
        return matchesSearch && matchesType && matchesStatus
    })

    // Calcular estadísticas
    const stats = {
        total: accounts.length,
        active: accounts.filter((a: Account) => a.status === 'active').length,
        totalBalance: accounts.reduce((sum: number, a: Account) => sum + a.balance, 0),
        positiveBalance: accounts.filter((a: Account) => a.balance > 0).reduce((sum: number, a: Account) => sum + a.balance, 0),
        negativeBalance: accounts.filter((a: Account) => a.balance < 0).reduce((sum: number, a: Account) => sum + Math.abs(a.balance), 0),
        bankAccounts: accounts.filter((a: Account) => a.type === 'bank').length,
        creditCardAccounts: accounts.filter((a: Account) => a.type === 'credit_card').length,
    }

    // Handlers
    const handleCreateAccount = (data: CreateAccountForm) => {
        createAccountMutation.mutate(data, {
            onSuccess: () => {
                setShowModal(false)
            }
        })
    }

    const handleUpdateAccount = (data: CreateAccountForm) => {
        if (editingAccount) {
            updateAccountMutation.mutate({ 
                id: editingAccount._id, 
                data 
            }, {
                onSuccess: () => {
                    refetch()
                    setEditingAccount(null)
                    setShowModal(false)
                }
            })
        }
    }

    const handleDeleteAccount = (account: Account) => {
        if (confirm(`¿Estás seguro de eliminar la cuenta ${account.name}?`)) {
            deleteAccountMutation.mutate(account._id, {
                onSuccess: () => {
                    refetch()
                }
            })
        }
    }

    const handleEditAccount = (account: Account) => {
        setEditingAccount(account)
        setShowModal(true)
    }

    const handleViewMovements = (account: Account) => {
        setSelectedAccount(account)
        setShowMovementsModal(true)
    }

    if (isLoading) {
        return <AccountsSkeleton />
    }

    if (error) {
        return <AccountsError error={error} onRetry={refetch} />
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold leading-6 text-gray-900">
                        Gestión de Cuentas
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Administra las cuentas financieras del sistema
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingAccount(null)
                        setShowModal(true)
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                    <PlusIcon className="h-5 w-5" />
                    Nueva Cuenta
                </button>
                {/* Botón de debug para refetch manual - solo en desarrollo */}
                {import.meta.env.MODE === 'development' && (
                    <button
                        onClick={() => refetch()}
                        className="flex items-center gap-2 bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm"
                        title="Refrescar manualmente (solo desarrollo)"
                    >
                        🔄 Refrescar
                    </button>
                )}
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Total de Cuentas</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                    <div className="text-sm text-gray-600">{stats.active} activas</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Balance Total</div>
                    <div className={`text-2xl font-bold ${stats.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(stats.totalBalance)}
                    </div>
                    <div className="text-sm text-gray-600">Balance general</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Saldos Positivos</div>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.positiveBalance)}</div>
                    <div className="text-sm text-green-600">Activos disponibles</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Saldos Negativos</div>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.negativeBalance)}</div>
                    <div className="text-sm text-red-600">Pasivos pendientes</div>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o número de cuenta..."
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
                        <option value="bank">Bancaria</option>
                        <option value="cash">Efectivo</option>
                        <option value="credit_card">Tarjeta de Crédito</option>
                        <option value="savings">Ahorro</option>
                        <option value="other">Otro</option>
                    </select>
                </div>
                <div className="relative">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Todos los estados</option>
                        <option value="active">Activa</option>
                        <option value="inactive">Inactiva</option>
                        <option value="closed">Cerrada</option>
                    </select>
                </div>
            </div>

            {/* Lista de cuentas */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cuenta
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Balance
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Banco
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAccounts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <BanknotesIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                        {searchTerm || typeFilter || statusFilter ? 'No se encontraron cuentas con los filtros aplicados' : 'No hay cuentas registradas'}
                                    </td>
                                </tr>
                            ) : (
                                filteredAccounts.map((account: Account) => {
                                    const TypeIcon = getTypeIcon(account.type)
                                    return (
                                        <tr key={account._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <TypeIcon className={`h-5 w-5 mr-3 ${getTypeColor(account.type)}`} />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {account.name}
                                                        </div>
                                                        {account.accountNumber && (
                                                            <div className="text-sm text-gray-500">
                                                                {account.accountNumber}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-sm font-medium ${getTypeColor(account.type)}`}>
                                                    {getTypeLabel(account.type)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`font-medium ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {formatCurrency(account.balance)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(account.status)}`}>
                                                    {getStatusLabel(account.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {account.bankName || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleViewMovements(account)}
                                                        className="text-purple-600 hover:text-purple-900 p-1"
                                                        title="Ver movimientos"
                                                    >
                                                        <EyeIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditAccount(account)}
                                                        className="text-blue-600 hover:text-blue-900 p-1"
                                                        title="Editar"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteAccount(account)}
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
            <AccountModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false)
                    setEditingAccount(null)
                }}
                account={editingAccount}
                onSave={editingAccount ? handleUpdateAccount : handleCreateAccount}
            />

            {/* Modal para movimientos */}
            <MovementsModal
                isOpen={showMovementsModal}
                onClose={() => {
                    setShowMovementsModal(false)
                    setSelectedAccount(null)
                }}
                account={selectedAccount}
                movements={movements}
            />
        </div>
    )
}
