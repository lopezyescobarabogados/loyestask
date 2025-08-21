import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useCreateInvoice, useUpdateInvoice } from '../../hooks/useInvoices'
import type { Invoice, CreateInvoiceForm } from '../../types'
import { formatCurrency } from '../../utils/financialUtils'

const invoiceFormSchema = z.object({
    type: z.enum(['sent', 'received']),
    client: z.string().min(1, 'Cliente es requerido'),
    provider: z.string().optional(),
    total: z.number().min(0, 'Total debe ser mayor a 0'),
    subtotal: z.number().optional(),
    tax: z.number().optional(),
    description: z.string().optional(),
    dueDate: z.string().min(1, 'Fecha de vencimiento es requerida'),
    issueDate: z.string().optional(),
    project: z.string().optional(),
})

type InvoiceFormData = z.infer<typeof invoiceFormSchema>

interface InvoiceFormProps {
    invoice?: Invoice
    onClose: () => void
    onSuccess: () => void
}

const INVOICE_TYPES = [
    { value: 'sent' as const, label: 'Enviada' },
    { value: 'received' as const, label: 'Recibida' }
]

export default function InvoiceForm({ invoice, onClose, onSuccess }: InvoiceFormProps) {
    const createInvoice = useCreateInvoice()
    const updateInvoice = useUpdateInvoice()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors }
    } = useForm<InvoiceFormData>({
        resolver: zodResolver(invoiceFormSchema),
        defaultValues: invoice ? {
            type: invoice.type,
            client: invoice.client,
            provider: invoice.provider || '',
            total: invoice.total,
            subtotal: invoice.subtotal || 0,
            tax: invoice.tax || 0,
            description: invoice.description || '',
            dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
            issueDate: new Date(invoice.issueDate).toISOString().split('T')[0],
            project: invoice.project || ''
        } : {
            type: 'sent' as const,
            client: '',
            provider: '',
            total: 0,
            subtotal: 0,
            tax: 0,
            description: '',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
            issueDate: new Date().toISOString().split('T')[0],
            project: ''
        }
    })

    const watchedSubtotal = watch('subtotal')
    const watchedTax = watch('tax')

    // Calculate total when subtotal or tax changes
    const calculateTotal = () => {
        const subtotal = watchedSubtotal || 0
        const tax = watchedTax || 0
        const total = subtotal + tax
        setValue('total', total)
    }

    const onSubmit = async (data: InvoiceFormData) => {
        setIsSubmitting(true)
        try {
            const invoiceData: CreateInvoiceForm = {
                ...data,
                issueDate: data.issueDate || new Date().toISOString().split('T')[0]
            }

            if (invoice) {
                await updateInvoice.mutateAsync({
                    id: invoice._id,
                    data: invoiceData
                })
            } else {
                await createInvoice.mutateAsync(invoiceData)
            }

            onSuccess()
        } catch (error) {
            console.error('Error saving invoice:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                    {invoice ? 'Editar Factura' : 'Nueva Factura'}
                </h3>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    <span className="sr-only">Cerrar</span>
                    <XMarkIcon className="h-6 w-6" />
                </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Tipo *
                        </label>
                        <select
                            {...register('type')}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                            {INVOICE_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                        {errors.type && (
                            <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Cliente *
                        </label>
                        <input
                            type="text"
                            {...register('client')}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Nombre del cliente"
                        />
                        {errors.client && (
                            <p className="mt-1 text-sm text-red-600">{errors.client.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Proveedor
                        </label>
                        <input
                            type="text"
                            {...register('provider')}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Nombre del proveedor"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Proyecto
                        </label>
                        <input
                            type="text"
                            {...register('project')}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Nombre del proyecto"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Fecha de Emisión
                        </label>
                        <input
                            type="date"
                            {...register('issueDate')}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        {errors.issueDate && (
                            <p className="mt-1 text-sm text-red-600">{errors.issueDate.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Fecha de Vencimiento *
                        </label>
                        <input
                            type="date"
                            {...register('dueDate')}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        {errors.dueDate && (
                            <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
                        )}
                    </div>
                </div>

                {/* Financial Information */}
                <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Información Financiera</h4>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Subtotal
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                {...register('subtotal', { 
                                    valueAsNumber: true,
                                    onChange: calculateTotal
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Impuestos
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                {...register('tax', { 
                                    valueAsNumber: true,
                                    onChange: calculateTotal
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Total *
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                {...register('total', { valueAsNumber: true })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="0.00"
                            />
                            {errors.total && (
                                <p className="mt-1 text-sm text-red-600">{errors.total.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex justify-between items-center text-lg font-semibold">
                                <span>Total de la Factura:</span>
                                <span className="text-indigo-600">
                                    {formatCurrency(watch('total') || 0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="border-t border-gray-200 pt-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Descripción
                        </label>
                        <textarea
                            rows={4}
                            {...register('description')}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Descripción de la factura..."
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Guardando...' : invoice ? 'Actualizar' : 'Crear'} Factura
                    </button>
                </div>
            </form>
        </div>
    )
}
