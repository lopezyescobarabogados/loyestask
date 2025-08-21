import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { InvoiceAPI } from '@/api/FinancialAPI'
import type { CreateInvoiceForm } from '@/types/index'
import { toast } from 'react-toastify'

// ===== QUERY KEYS =====
export const invoiceKeys = {
    all: ['invoices'] as const,
    lists: () => [...invoiceKeys.all, 'list'] as const,
    list: (params?: Record<string, unknown>) => [...invoiceKeys.lists(), params] as const,
    details: () => [...invoiceKeys.all, 'detail'] as const,
    detail: (id: string) => [...invoiceKeys.details(), id] as const,
    summary: (params?: Record<string, unknown>) => [...invoiceKeys.all, 'summary', params] as const,
}

// ===== QUERIES =====
export const useInvoices = (params?: {
    page?: number
    limit?: number
    type?: 'sent' | 'received'
    status?: string
    search?: string
    startDate?: string
    endDate?: string
}) => {
    return useQuery({
        queryKey: invoiceKeys.list(params),
        queryFn: () => InvoiceAPI.getAll(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

export const useInvoice = (id: string, enabled = true) => {
    return useQuery({
        queryKey: invoiceKeys.detail(id),
        queryFn: () => InvoiceAPI.getById(id),
        enabled: enabled && !!id,
        staleTime: 10 * 60 * 1000, // 10 minutes
    })
}

export const useInvoiceSummary = (params?: {
    year?: number
    month?: number
    type?: 'sent' | 'received'
}) => {
    return useQuery({
        queryKey: invoiceKeys.summary(params),
        queryFn: () => InvoiceAPI.getSummary(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

// ===== MUTATIONS =====
export const useCreateInvoice = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateInvoiceForm) => InvoiceAPI.create(data),
        onSuccess: (data) => {
            // Invalidate and refetch relevant queries
            queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
            queryClient.invalidateQueries({ queryKey: invoiceKeys.summary() })
            
            // Set the created invoice in cache
            queryClient.setQueryData(invoiceKeys.detail(data._id), data)
            
            toast.success('Factura creada exitosamente')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al crear la factura')
        },
    })
}

export const useUpdateInvoice = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateInvoiceForm> }) => 
            InvoiceAPI.update(id, data),
        onSuccess: (data, variables) => {
            // Update the specific invoice in cache
            queryClient.setQueryData(invoiceKeys.detail(variables.id), data)
            
            // Invalidate lists and summary
            queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
            queryClient.invalidateQueries({ queryKey: invoiceKeys.summary() })
            
            toast.success('Factura actualizada exitosamente')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al actualizar la factura')
        },
    })
}

export const useDeleteInvoice = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => InvoiceAPI.delete(id),
        onSuccess: (_, id) => {
            // Remove from cache
            queryClient.removeQueries({ queryKey: invoiceKeys.detail(id) })
            
            // Invalidate lists and summary
            queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
            queryClient.invalidateQueries({ queryKey: invoiceKeys.summary() })
            
            toast.success('Factura eliminada exitosamente')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al eliminar la factura')
        },
    })
}

export const useUpdateInvoiceStatus = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, status }: { 
            id: string; 
            status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' 
        }) => InvoiceAPI.updateStatus(id, status),
        onSuccess: (data, variables) => {
            // Update the specific invoice in cache
            queryClient.setQueryData(invoiceKeys.detail(variables.id), data)
            
            // Invalidate lists and summary
            queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
            queryClient.invalidateQueries({ queryKey: invoiceKeys.summary() })
            
            toast.success('Estado de factura actualizado exitosamente')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al actualizar el estado de la factura')
        },
    })
}

// ===== BULK OPERATIONS =====
export const useBulkUpdateInvoices = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ ids, updates }: { 
            ids: string[]; 
            updates: Partial<CreateInvoiceForm> 
        }) => {
            const promises = ids.map(id => InvoiceAPI.update(id, updates))
            return Promise.all(promises)
        },
        onSuccess: () => {
            // Invalidate all invoice queries
            queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
            toast.success('Facturas actualizadas exitosamente')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al actualizar las facturas')
        },
    })
}

export const useBulkDeleteInvoices = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (ids: string[]) => {
            const promises = ids.map(id => InvoiceAPI.delete(id))
            return Promise.all(promises)
        },
        onSuccess: () => {
            // Invalidate all invoice queries
            queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
            toast.success('Facturas eliminadas exitosamente')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al eliminar las facturas')
        },
    })
}
