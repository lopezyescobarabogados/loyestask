import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { useCreateAccount, useUpdateAccount } from '../../hooks/useAccounts'
import type { Account } from '../../types'

interface AccountFormData {
    name: string
    type: 'bank' | 'cash' | 'credit_card' | 'savings' | 'other'
    initialBalance: number
    description?: string
    bankName?: string
    accountNumber?: string
}

interface AccountFormProps {
    account?: Account | null
    onSuccess: () => void
    onCancel: () => void
}

const ACCOUNT_TYPES = [
    { value: 'bank', label: 'Cuenta Bancaria' },
    { value: 'cash', label: 'Caja' },
    { value: 'credit_card', label: 'Tarjeta de Crédito' },
    { value: 'savings', label: 'Cuenta de Ahorros' },
    { value: 'other', label: 'Otra' }
]

export default function AccountForm({ account, onSuccess, onCancel }: AccountFormProps) {
    const [showBankFields, setShowBankFields] = useState(account?.type === 'bank' || account?.type === 'savings')
    
    const createMutation = useCreateAccount()
    const updateMutation = useUpdateAccount()

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue
    } = useForm<AccountFormData>({
        defaultValues: {
            name: account?.name || '',
            type: account?.type || 'bank',
            initialBalance: account?.initialBalance || 0,
            description: account?.description || '',
            bankName: account?.bankName || '',
            accountNumber: account?.accountNumber || ''
        }
    })

    // Show/hide bank fields based on account type
    const handleTypeChange = (type: string) => {
        setShowBankFields(type === 'bank' || type === 'savings')
        if (type !== 'bank' && type !== 'savings') {
            setValue('bankName', '')
            setValue('accountNumber', '')
        }
    }

    const onSubmit = async (data: AccountFormData) => {
        try {
            if (account?._id) {
                await updateMutation.mutateAsync({
                    id: account._id,
                    data
                })
            } else {
                await createMutation.mutateAsync(data)
            }
            
            onSuccess()
        } catch (error) {
            console.error('Error saving account:', error)
        }
    }

    const isLoading = createMutation.isPending || updateMutation.isPending

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Nombre de la Cuenta *
                    </label>
                    <input
                        type="text"
                        {...register('name', { 
                            required: 'El nombre es requerido',
                            minLength: { value: 2, message: 'Mínimo 2 caracteres' }
                        })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Ej. Cuenta Corriente Principal"
                    />
                    {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                </div>

                {/* Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Tipo de Cuenta *
                    </label>
                    <select
                        {...register('type', { required: 'El tipo es requerido' })}
                        onChange={(e) => {
                            const value = e.target.value as AccountFormData['type']
                            handleTypeChange(value)
                            setValue('type', value)
                        }}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                        {ACCOUNT_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                    {errors.type && (
                        <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                    )}
                </div>

                {/* Balance Inicial */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Balance Inicial
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        {...register('initialBalance', { 
                            valueAsNumber: true,
                            min: { value: 0, message: 'El balance no puede ser negativo' }
                        })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="0.00"
                    />
                    {errors.initialBalance && (
                        <p className="mt-1 text-sm text-red-600">{errors.initialBalance.message}</p>
                    )}
                </div>

                {/* Bank Fields - Only show for bank/savings accounts */}
                {showBankFields && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Nombre del Banco
                            </label>
                            <input
                                type="text"
                                {...register('bankName')}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Ej. Banco Nacional"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Número de Cuenta
                            </label>
                            <input
                                type="text"
                                {...register('accountNumber')}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Ej. 1234567890"
                            />
                        </div>
                    </>
                )}

                {/* Description */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Descripción
                    </label>
                    <textarea
                        rows={3}
                        {...register('description')}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Descripción adicional de la cuenta..."
                    />
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading 
                        ? (account ? 'Actualizando...' : 'Creando...') 
                        : (account ? 'Actualizar Cuenta' : 'Crear Cuenta')
                    }
                </button>
            </div>
        </form>
    )
}
