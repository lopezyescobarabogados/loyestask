import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AccountAPI } from '@/api/FinancialAPI'
import type { CreateAccountForm, TransferForm } from '@/types/index'
import { toast } from 'react-toastify'

// ===== QUERY KEYS =====
export const accountKeys = {
    all: ['accounts'] as const,
    lists: () => [...accountKeys.all, 'list'] as const,
    list: (params?: Record<string, unknown>) => [...accountKeys.lists(), params] as const,
    details: () => [...accountKeys.all, 'detail'] as const,
    detail: (id: string) => [...accountKeys.details(), id] as const,
    movements: (id: string, params?: Record<string, unknown>) => 
        [...accountKeys.detail(id), 'movements', params] as const,
    balanceSummary: () => [...accountKeys.all, 'balance-summary'] as const,
}

// ===== MUTATION KEYS =====
export const accountMutationKeys = {
    create: ['accounts', 'create'] as const,
    update: ['accounts', 'update'] as const,
    delete: ['accounts', 'delete'] as const,
    updateStatus: ['accounts', 'updateStatus'] as const,
    transfer: ['accounts', 'transfer'] as const,
}

// ===== QUERIES =====
export const useAccounts = (params?: {
    page?: number
    limit?: number
    type?: string
    status?: 'active' | 'inactive' | 'closed'
    search?: string
}) => {
    return useQuery({
        queryKey: accountKeys.list(params),
        queryFn: () => AccountAPI.getAll(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes - tiempo de garbage collection
    })
}

export const useAccount = (id: string, enabled = true) => {
    return useQuery({
        queryKey: accountKeys.detail(id),
        queryFn: () => AccountAPI.getById(id),
        enabled: enabled && !!id,
        staleTime: 10 * 60 * 1000, // 10 minutes
    })
}

export const useAccountMovements = (id: string, params?: {
    page?: number
    limit?: number
    startDate?: string
    endDate?: string
    type?: string
}, enabled = true) => {
    return useQuery({
        queryKey: accountKeys.movements(id, params),
        queryFn: () => AccountAPI.getMovements(id, params),
        enabled: enabled && !!id,
        staleTime: 2 * 60 * 1000, // 2 minutes - movements change frequently
    })
}

export const useAccountBalanceSummary = () => {
    return useQuery({
        queryKey: accountKeys.balanceSummary(),
        queryFn: () => AccountAPI.getBalanceSummary(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

// Helper hook to get only active accounts for selectors
export const useActiveAccounts = () => {
    return useQuery({
        queryKey: accountKeys.list({ status: 'active', limit: 100 }),
        queryFn: () => AccountAPI.getAll({ status: 'active', limit: 100 }),
        staleTime: 10 * 60 * 1000, // 10 minutes
        select: (data) => data.accounts, // Only return the accounts array
    })
}

// ===== MUTATIONS =====
export const useCreateAccount = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: accountMutationKeys.create,
        mutationFn: (data: CreateAccountForm) => AccountAPI.create(data),
        onSuccess: (newAccount) => {
            // 1. Invalidar específicamente todas las variaciones de la lista de cuentas
            queryClient.invalidateQueries({ 
                queryKey: accountKeys.all,
                exact: false 
            })
            
            // 2. También invalidar el balance summary
            queryClient.invalidateQueries({ queryKey: accountKeys.balanceSummary() })
            
            // 3. Establecer la cuenta individual en cache
            queryClient.setQueryData(accountKeys.detail(newAccount._id), newAccount)
            
            // 4. Forzar re-fetch de la lista principal (sin parámetros)
            queryClient.refetchQueries({ 
                queryKey: accountKeys.list(undefined),
                exact: true 
            })
            
            toast.success('Cuenta creada exitosamente')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al crear la cuenta')
        },
    })
}

export const useUpdateAccount = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: accountMutationKeys.update,
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateAccountForm> }) => 
            AccountAPI.update(id, data),
        onSuccess: (data, variables) => {
            // Update the specific account in cache
            queryClient.setQueryData(accountKeys.detail(variables.id), data)
            
            // Invalidate lists and summary
            queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
            queryClient.invalidateQueries({ queryKey: accountKeys.balanceSummary() })
            
            toast.success('Cuenta actualizada exitosamente')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al actualizar la cuenta')
        },
    })
}

export const useDeleteAccount = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: accountMutationKeys.delete,
        mutationFn: (id: string) => AccountAPI.delete(id),
        onSuccess: (_, id) => {
            // Remove from cache
            queryClient.removeQueries({ queryKey: accountKeys.detail(id) })
            
            // Invalidate lists and summary
            queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
            queryClient.invalidateQueries({ queryKey: accountKeys.balanceSummary() })
            
            toast.success('Cuenta eliminada exitosamente')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al eliminar la cuenta')
        },
    })
}

export const useUpdateAccountStatus = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: accountMutationKeys.updateStatus,
        mutationFn: ({ id, status }: { 
            id: string; 
            status: 'active' | 'inactive' | 'closed' 
        }) => AccountAPI.updateStatus(id, status),
        onSuccess: (data, variables) => {
            // Update the specific account in cache
            queryClient.setQueryData(accountKeys.detail(variables.id), data)
            
            // Invalidate lists and summary
            queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
            queryClient.invalidateQueries({ queryKey: accountKeys.balanceSummary() })
            
            toast.success('Estado de cuenta actualizado exitosamente')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al actualizar el estado de la cuenta')
        },
    })
}

export const useTransferFunds = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: accountMutationKeys.transfer,
        mutationFn: (data: TransferForm) => AccountAPI.transfer(data),
        onSuccess: (_, variables) => {
            // Invalidate account details for both accounts involved
            queryClient.invalidateQueries({ queryKey: accountKeys.detail(variables.fromAccount) })
            queryClient.invalidateQueries({ queryKey: accountKeys.detail(variables.toAccount) })
            
            // Invalidate movements for both accounts
            queryClient.invalidateQueries({ 
                queryKey: [...accountKeys.detail(variables.fromAccount), 'movements'] 
            })
            queryClient.invalidateQueries({ 
                queryKey: [...accountKeys.detail(variables.toAccount), 'movements'] 
            })
            
            // Invalidate lists and summary
            queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
            queryClient.invalidateQueries({ queryKey: accountKeys.balanceSummary() })
            
            // Also invalidate payment queries as transfers may affect them
            queryClient.invalidateQueries({ queryKey: ['payments'] })
            
            toast.success('Transferencia realizada exitosamente')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al realizar la transferencia')
        },
    })
}

// ===== BULK OPERATIONS =====
export const useBulkUpdateAccounts = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ ids, updates }: { 
            ids: string[]; 
            updates: Partial<CreateAccountForm> 
        }) => {
            const promises = ids.map(id => AccountAPI.update(id, updates))
            return Promise.all(promises)
        },
        onSuccess: () => {
            // Invalidate all account queries
            queryClient.invalidateQueries({ queryKey: accountKeys.all })
            toast.success('Cuentas actualizadas exitosamente')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al actualizar las cuentas')
        },
    })
}

// ===== UTILITY HOOKS =====
export const useAccountOptions = () => {
    const { data: accounts, isLoading } = useActiveAccounts()
    
    return {
        accountOptions: accounts?.map(account => ({
            value: account._id,
            label: `${account.name} (${account.type})`,
            balance: account.balance,
        })) || [],
        isLoading,
    }
}
