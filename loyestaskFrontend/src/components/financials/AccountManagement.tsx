import { useState, Fragment } from 'react'
import { Dialog, Transition, Menu, DialogPanel, TransitionChild, MenuButton, MenuItems, MenuItem } from '@headlessui/react'
import {
    PlusIcon,
    MagnifyingGlassIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    TrashIcon,
    FunnelIcon,
    XMarkIcon,
    BuildingOffice2Icon
} from '@heroicons/react/24/outline'
import { useAccounts, useDeleteAccount } from '../../hooks/useAccounts'
import { formatCurrency } from '../../utils/financialUtils'
import type { Account } from '../../types'
import AccountForm from './AccountForm'

const ACCOUNT_TYPES = [
    { value: 'bank', label: 'Cuenta Bancaria' },
    { value: 'cash', label: 'Caja' },
    { value: 'credit_card', label: 'Tarjeta de Crédito' },
    { value: 'savings', label: 'Cuenta de Ahorros' },
    { value: 'other', label: 'Otra' }
]

const ACCOUNT_STATUSES = [
    { value: 'active', label: 'Activa' },
    { value: 'inactive', label: 'Inactiva' },
    { value: 'closed', label: 'Cerrada' }
]

const getStatusBadge = (status: string) => {
    const statusConfig = {
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-yellow-100 text-yellow-800',
        closed: 'bg-red-100 text-red-800'
    }
    
    const statusLabels = {
        active: 'Activa',
        inactive: 'Inactiva',
        closed: 'Cerrada'
    }
    
    return (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusConfig[status as keyof typeof statusConfig] || statusConfig.active}`}>
            {statusLabels[status as keyof typeof statusLabels] || status}
        </span>
    )
}

const getTypeBadge = (type: string) => {
    const typeConfig = {
        bank: 'bg-blue-100 text-blue-800',
        cash: 'bg-green-100 text-green-800',
        credit_card: 'bg-purple-100 text-purple-800',
        savings: 'bg-indigo-100 text-indigo-800',
        other: 'bg-gray-100 text-gray-800'
    }
    
    const typeLabels = {
        bank: 'Bancaria',
        cash: 'Caja',
        credit_card: 'Crédito',
        savings: 'Ahorros',
        other: 'Otra'
    }
    
    return (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${typeConfig[type as keyof typeof typeConfig] || typeConfig.other}`}>
            {typeLabels[type as keyof typeof typeLabels] || type}
        </span>
    )
}

export default function AccountManagement() {
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingAccount, setEditingAccount] = useState<Account | null>(null)
    const [showFilters, setShowFilters] = useState(false)
    
    // Filters
    const [filters, setFilters] = useState({
        search: '',
        type: '',
        status: ''
    })

    const { data: accountsData, isLoading } = useAccounts({
        ...filters,
        status: filters.status === '' ? undefined : filters.status as 'active' | 'inactive' | 'closed'
    })
    const deleteAccountMutation = useDeleteAccount()

    const handleEdit = (account: Account) => {
        setEditingAccount(account)
        setIsFormOpen(true)
    }

    const handleDelete = (accountId: string) => {
        if (confirm('¿Estás seguro de que quieres eliminar esta cuenta?')) {
            deleteAccountMutation.mutate(accountId)
        }
    }

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }))
    }

    const clearFilters = () => {
        setFilters({
            search: '',
            type: '',
            status: ''
        })
    }

    const closeForm = () => {
        setIsFormOpen(false)
        setEditingAccount(null)
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-6">
                {/* Actions Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                    <div className="flex-1 max-w-lg">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Buscar cuentas..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <FunnelIcon className="-ml-1 mr-2 h-5 w-5" />
                            Filtros
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                            Nueva Cuenta
                        </button>
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                <select
                                    value={filters.type}
                                    onChange={(e) => handleFilterChange('type', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="">Todos</option>
                                    {ACCOUNT_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="">Todos</option>
                                    {ACCOUNT_STATUSES.map(status => (
                                        <option key={status.value} value={status.value}>
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Limpiar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Summary Cards */}
                {accountsData?.accounts && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <BuildingOffice2Icon className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Total Cuentas
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {accountsData.accounts.length}
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
                                        <BuildingOffice2Icon className="h-6 w-6 text-green-400" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Cuentas Activas
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {accountsData.accounts.filter(acc => acc.status === 'active').length}
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
                                        <BuildingOffice2Icon className="h-6 w-6 text-blue-400" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Balance Total
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {formatCurrency(
                                                    accountsData.accounts
                                                        .filter(acc => acc.status === 'active')
                                                        .reduce((sum, acc) => sum + acc.balance, 0)
                                                )}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Accounts Table */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nombre
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
                                    <th className="relative px-6 py-3">
                                        <span className="sr-only">Acciones</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {accountsData?.accounts.map((account) => (
                                    <tr key={account._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
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
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getTypeBadge(account.type)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <span className={account.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {formatCurrency(account.balance)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(account.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {account.bankName || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Menu as="div" className="relative inline-block text-left">
                                                <MenuButton className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-2 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                                    <EllipsisVerticalIcon className="h-5 w-5" />
                                                </MenuButton>
                                                <Transition
                                                    as={Fragment}
                                                    enter="transition ease-out duration-100"
                                                    enterFrom="transform opacity-0 scale-95"
                                                    enterTo="transform opacity-100 scale-100"
                                                    leave="transition ease-in duration-75"
                                                    leaveFrom="transform opacity-100 scale-100"
                                                    leaveTo="transform opacity-0 scale-95"
                                                >
                                                    <MenuItems className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                                        <div className="py-1">
                                                            <MenuItem>
                                                                {({ active }) => (
                                                                    <button
                                                                        onClick={() => handleEdit(account)}
                                                                        className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} group flex items-center px-4 py-2 text-sm w-full text-left`}
                                                                    >
                                                                        <PencilIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                                                        Editar
                                                                    </button>
                                                                )}
                                                            </MenuItem>
                                                            <MenuItem>
                                                                {({ active }) => (
                                                                    <button
                                                                        onClick={() => handleDelete(account._id)}
                                                                        className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} group flex items-center px-4 py-2 text-sm w-full text-left`}
                                                                    >
                                                                        <TrashIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                                                        Eliminar
                                                                    </button>
                                                                )}
                                                            </MenuItem>
                                                        </div>
                                                    </MenuItems>
                                                </Transition>
                                            </Menu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Empty State */}
                    {accountsData?.accounts.length === 0 && (
                        <div className="text-center py-12">
                            <BuildingOffice2Icon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay cuentas</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Comienza creando tu primera cuenta.
                            </p>
                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                                    Nueva Cuenta
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Account Form Modal */}
            <Transition appear show={isFormOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={closeForm}>
                    <TransitionChild
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </TransitionChild>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <TransitionChild
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                                            {editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={closeForm}
                                            className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <span className="sr-only">Cerrar</span>
                                            <XMarkIcon className="h-6 w-6" />
                                        </button>
                                    </div>
                                    <AccountForm
                                        account={editingAccount}
                                        onSuccess={closeForm}
                                        onCancel={closeForm}
                                    />
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    )
}
