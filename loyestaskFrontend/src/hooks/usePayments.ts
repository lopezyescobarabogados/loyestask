import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PaymentAPI } from '@/api/FinancialAPI'
import type { CreatePaymentForm } from '@/types/index'
import { toast } from 'react-toastify'

// ===== QUERY KEYS =====
export const paymentKeys = {
    all: ['payments'] as const,
    lists: () => [...paymentKeys.all, 'list'] as const,
    list: (params?: Record<string, unknown>) => [...paymentKeys.lists(), params] as const,
    details: () => [...paymentKeys.all, 'detail'] as const,
    detail: (id: string) => [...paymentKeys.details(), id] as const,
    summary: (params?: Record<string, unknown>) => [...paymentKeys.all, 'summary', params] as const,
    categories: () => [...paymentKeys.all, 'categories'] as const,
}

// ===== MUTATION KEYS =====
export const paymentMutationKeys = {
    create: ['payments', 'create'] as const,
    update: ['payments', 'update'] as const,
    delete: ['payments', 'delete'] as const,
    updateStatus: ['payments', 'updateStatus'] as const,
}

// ===== QUERIES =====
export const usePayments = (params?: {
    page?: number
    limit?: number
    type?: 'income' | 'expense'
    status?: string
    method?: string
    account?: string
    category?: string
    startDate?: string
    endDate?: string
    search?: string
}) => {
    return useQuery({
        queryKey: paymentKeys.list(params),
        queryFn: () => PaymentAPI.getAll(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

export const usePayment = (id: string, enabled = true) => {
    return useQuery({
        queryKey: paymentKeys.detail(id),
        queryFn: () => PaymentAPI.getById(id),
        enabled: enabled && !!id,
        staleTime: 10 * 60 * 1000, // 10 minutes
    })
}

export const usePaymentSummary = (params?: {
    year?: number
    month?: number
    type?: 'income' | 'expense'
    account?: string
}) => {
    return useQuery({
        queryKey: paymentKeys.summary(params),
        queryFn: () => PaymentAPI.getSummary(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

export const usePaymentCategories = () => {
    return useQuery({
        queryKey: paymentKeys.categories(),
        queryFn: () => PaymentAPI.getCategories(),
        staleTime: 30 * 60 * 1000, // 30 minutes - categories don't change often
    })
}

// ===== MUTATIONS =====
export const useCreatePayment = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: paymentMutationKeys.create,
        mutationFn: (data: CreatePaymentForm) => PaymentAPI.create(data),
        onSuccess: (data) => {
            // Invalidate and refetch relevant queries
            queryClient.invalidateQueries({ queryKey: paymentKeys.lists() })
            queryClient.invalidateQueries({ queryKey: paymentKeys.summary() })
            
            // Update account-related queries if needed
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            
            // Set the created payment in cache
            queryClient.setQueryData(paymentKeys.detail(data._id), data)
            
            toast.success('Pago creado exitosamente')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al crear el pago')
        },
    })
}

export const useUpdatePayment = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: paymentMutationKeys.update,
        mutationFn: ({ id, data }: { id: string; data: Partial<CreatePaymentForm> }) => 
            PaymentAPI.update(id, data),
        onSuccess: (data, variables) => {
            // Update the specific payment in cache
            queryClient.setQueryData(paymentKeys.detail(variables.id), data)
            
            // Invalidate lists and summary
            queryClient.invalidateQueries({ queryKey: paymentKeys.lists() })
            queryClient.invalidateQueries({ queryKey: paymentKeys.summary() })
            
            // Update account-related queries if account changed
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            
            toast.success('Pago actualizado exitosamente')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al actualizar el pago')
        },
    })
}

export const useDeletePayment = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: paymentMutationKeys.delete,
        mutationFn: (id: string) => PaymentAPI.delete(id),
        onSuccess: (_, id) => {
            // Remove from cache
            queryClient.removeQueries({ queryKey: paymentKeys.detail(id) })
            
            // Invalidate lists and summary
            queryClient.invalidateQueries({ queryKey: paymentKeys.lists() })
            queryClient.invalidateQueries({ queryKey: paymentKeys.summary() })
            
            // Update account-related queries
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            
            toast.success('Pago eliminado exitosamente')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al eliminar el pago')
        },
    })
}

export const useUpdatePaymentStatus = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: paymentMutationKeys.updateStatus,
        mutationFn: ({ id, status }: { 
            id: string; 
            status: 'pending' | 'completed' | 'failed' | 'cancelled' 
        }) => PaymentAPI.updateStatus(id, status),
        onSuccess: (data, variables) => {
            // Update the specific payment in cache
            queryClient.setQueryData(paymentKeys.detail(variables.id), data)
            
            // Invalidate lists and summary
            queryClient.invalidateQueries({ queryKey: paymentKeys.lists() })
            queryClient.invalidateQueries({ queryKey: paymentKeys.summary() })
            
            // Update account-related queries if status affects balance
            if (variables.status === 'completed' || variables.status === 'cancelled') {
                queryClient.invalidateQueries({ queryKey: ['accounts'] })
            }
            
            toast.success('Estado del pago actualizado exitosamente')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al actualizar el estado del pago')
        },
    })
}

// ===== BULK OPERATIONS =====
export const useBulkUpdatePayments = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ ids, updates }: { 
            ids: string[]; 
            updates: Partial<CreatePaymentForm> 
        }) => {
            const promises = ids.map(id => PaymentAPI.update(id, updates))
            return Promise.all(promises)
        },
        onSuccess: () => {
            // Invalidate all payment queries
            queryClient.invalidateQueries({ queryKey: paymentKeys.all })
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            toast.success('Pagos actualizados exitosamente')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al actualizar los pagos')
        },
    })
}

export const useBulkDeletePayments = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (ids: string[]) => {
            const promises = ids.map(id => PaymentAPI.delete(id))
            return Promise.all(promises)
        },
        onSuccess: () => {
            // Invalidate all payment queries
            queryClient.invalidateQueries({ queryKey: paymentKeys.all })
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            toast.success('Pagos eliminados exitosamente')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al eliminar los pagos')
        },
    })
}
