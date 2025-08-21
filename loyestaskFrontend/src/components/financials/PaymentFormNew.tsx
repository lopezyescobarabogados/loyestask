import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { 
    DocumentArrowUpIcon, 
    XMarkIcon, 
    PaperClipIcon,
    PhotoIcon,
    DocumentTextIcon 
} from '@heroicons/react/24/outline'
import { PaymentAPI } from '../../api/FinancialAPI'
import { useAccounts } from '../../hooks/useAccounts'
import type { Payment, CreatePaymentForm } from '../../types/index'
import ErrorMessage from '../ErrorMessage'
import { toast } from 'react-toastify'

interface PaymentFormProps {
    payment?: Payment | null
    onSuccess: () => void
    onCancel: () => void
}

const PAYMENT_TYPES = [
    { value: 'income', label: 'Ingreso' },
    { value: 'expense', label: 'Gasto' }
]

const PAYMENT_METHODS = [
    { value: 'cash', label: 'Efectivo' },
    { value: 'bank_transfer', label: 'Transferencia Bancaria' },
    { value: 'check', label: 'Cheque' },
    { value: 'credit_card', label: 'Tarjeta de Crédito' },
    { value: 'debit_card', label: 'Tarjeta de Débito' },
    { value: 'transfer', label: 'Transferencia' },
    { value: 'other', label: 'Otro' }
]

const EXPENSE_CATEGORIES = [
    'Alquiler', 'Servicios Públicos', 'Internet', 'Teléfono', 'Combustible',
    'Mantenimiento', 'Suministros de Oficina', 'Software', 'Publicidad',
    'Capacitación', 'Viajes', 'Comidas', 'Seguros', 'Impuestos', 'Otros'
]

const INCOME_CATEGORIES = [
    'Honorarios Profesionales', 'Consultoría', 'Servicios Legales',
    'Retainer', 'Comisiones', 'Otros Ingresos'
]

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
        return <PhotoIcon className="h-5 w-5 text-green-500" />
    } else if (mimeType === 'application/pdf') {
        return <DocumentTextIcon className="h-5 w-5 text-red-500" />
    }
    return <DocumentTextIcon className="h-5 w-5 text-blue-500" />
}

export default function PaymentForm({ payment, onSuccess, onCancel }: PaymentFormProps) {
    const queryClient = useQueryClient()
    const { data: accountsData } = useAccounts({})
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch
    } = useForm<CreatePaymentForm>()

    const paymentType = watch('type')

    const createPaymentMutation = useMutation({
        mutationFn: PaymentAPI.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] })
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            toast.success('Pago registrado correctamente')
            onSuccess()
        },
        onError: () => {
            toast.error('Error al registrar el pago')
        }
    })

    const updatePaymentMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreatePaymentForm> }) => PaymentAPI.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] })
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            toast.success('Pago actualizado correctamente')
            onSuccess()
        }
    })

    useEffect(() => {
        if (payment) {
            setValue('type', payment.type)
            setValue('method', payment.method)
            setValue('amount', payment.amount)
            setValue('description', payment.description)
            setValue('category', payment.category || '')
            setValue('paymentDate', format(new Date(payment.paymentDate), 'yyyy-MM-dd'))
            setValue('account', payment.account)
            setValue('invoice', payment.invoice || '')
            setValue('notes', payment.notes || '')
        } else {
            setValue('paymentDate', format(new Date(), 'yyyy-MM-dd'))
            setValue('currency', 'COP')
        }
    }, [payment, setValue])

    const onSubmit = (data: CreatePaymentForm) => {
        const paymentData = {
            ...data,
            amount: Number(data.amount)
        }

        if (payment) {
            updatePaymentMutation.mutate({ id: payment._id, data: paymentData })
        } else {
            createPaymentMutation.mutate(paymentData)
        }
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || [])
        
        // Validar tipos de archivo
        const validTypes = ['image/', 'application/pdf']
        const invalidFiles = files.filter(file => 
            !validTypes.some(type => file.type.startsWith(type))
        )
        
        if (invalidFiles.length > 0) {
            toast.error('Solo se permiten archivos PDF e imágenes')
            return
        }
        
        // Validar tamaño (máximo 5MB por archivo)
        const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024)
        if (oversizedFiles.length > 0) {
            toast.error('Los archivos no pueden superar 5MB')
            return
        }
        
        setSelectedFiles([...selectedFiles, ...files])
    }

    const removeFile = (index: number) => {
        setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
    }

    const isLoading = createPaymentMutation.isPending || updatePaymentMutation.isPending

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Tipo de Pago */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Pago *
                </label>
                <select
                    {...register('type', { required: 'El tipo es requerido' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                    <option value="">Seleccionar tipo</option>
                    {PAYMENT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                            {type.label}
                        </option>
                    ))}
                </select>
                {errors.type && <ErrorMessage>{errors.type.message}</ErrorMessage>}
            </div>

            {/* Cuenta */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cuenta *
                </label>
                <select
                    {...register('account', { required: 'La cuenta es requerida' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                    <option value="">Seleccionar cuenta</option>
                    {accountsData?.accounts?.map(account => (
                        <option key={account._id} value={account._id}>
                            {account.name} - {account.type} ({new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: account.currency || 'COP'
                            }).format(account.balance)})
                        </option>
                    ))}
                </select>
                {errors.account && <ErrorMessage>{errors.account.message}</ErrorMessage>}
            </div>

            {/* Monto */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto *
                </label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('amount', { 
                        required: 'El monto es requerido',
                        min: { value: 0.01, message: 'El monto debe ser mayor a 0' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0.00"
                />
                {errors.amount && <ErrorMessage>{errors.amount.message}</ErrorMessage>}
            </div>

            {/* Descripción */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción *
                </label>
                <textarea
                    {...register('description', { required: 'La descripción es requerida' })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Descripción del pago..."
                />
                {errors.description && <ErrorMessage>{errors.description.message}</ErrorMessage>}
            </div>

            {/* Categoría */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                </label>
                <select
                    {...register('category')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                    <option value="">Seleccionar categoría</option>
                    {(paymentType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(category => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>
            </div>

            {/* Fecha de Pago */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Pago *
                </label>
                <input
                    type="date"
                    {...register('paymentDate', { required: 'La fecha es requerida' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {errors.paymentDate && <ErrorMessage>{errors.paymentDate.message}</ErrorMessage>}
            </div>

            {/* Método de Pago */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Método de Pago *
                </label>
                <select
                    {...register('method', { required: 'El método es requerido' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                    <option value="">Seleccionar método</option>
                    {PAYMENT_METHODS.map(method => (
                        <option key={method.value} value={method.value}>
                            {method.label}
                        </option>
                    ))}
                </select>
                {errors.method && <ErrorMessage>{errors.method.message}</ErrorMessage>}
            </div>

            {/* Archivos Adjuntos */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Archivos Adjuntos (Facturas/Recibos)
                </label>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-2">
                        Arrastra archivos aquí o haz clic para seleccionar
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                        Archivos permitidos: PDF, JPG, PNG (máx. 5MB cada uno)
                    </p>
                    <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                    />
                    <label
                        htmlFor="file-upload"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                    >
                        <PaperClipIcon className="h-4 w-4 mr-2" />
                        Seleccionar Archivos
                    </label>
                </div>

                {/* Archivos seleccionados */}
                {selectedFiles.length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Archivos Seleccionados:</h4>
                        <div className="space-y-2">
                            {selectedFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                                    <div className="flex items-center">
                                        {getFileIcon(file.type)}
                                        <div className="ml-2">
                                            <p className="text-sm font-medium text-gray-700">{file.name}</p>
                                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Notas */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas Adicionales
                </label>
                <textarea
                    {...register('notes')}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Notas adicionales (opcional)..."
                />
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    disabled={isLoading}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                >
                    {isLoading ? 'Guardando...' : payment ? 'Actualizar Pago' : 'Registrar Pago'}
                </button>
            </div>
        </form>
    )
}
