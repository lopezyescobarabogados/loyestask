import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FinancialPeriodAPI } from '@/api/FinancialAPI'
import { toast } from 'react-toastify'

// ===== QUERY KEYS =====
export const financialPeriodKeys = {
    all: ['financial-periods'] as const,
    lists: () => [...financialPeriodKeys.all, 'list'] as const,
    list: (params?: Record<string, unknown>) => [...financialPeriodKeys.lists(), params] as const,
    details: () => [...financialPeriodKeys.all, 'detail'] as const,
    detail: (id: string) => [...financialPeriodKeys.details(), id] as const,
    current: () => [...financialPeriodKeys.all, 'current'] as const,
    summary: (id: string) => [...financialPeriodKeys.detail(id), 'summary'] as const,
}

// ===== QUERIES =====
export const useFinancialPeriods = (params?: {
    page?: number
    limit?: number
    year?: number
    status?: 'open' | 'closed'
}) => {
    return useQuery({
        queryKey: financialPeriodKeys.list(params),
        queryFn: () => FinancialPeriodAPI.getAll(params),
        staleTime: 10 * 60 * 1000, // 10 minutes - periods don't change frequently
    })
}

export const useFinancialPeriod = (id: string, enabled = true) => {
    return useQuery({
        queryKey: financialPeriodKeys.detail(id),
        queryFn: () => FinancialPeriodAPI.getById(id),
        enabled: enabled && !!id,
        staleTime: 15 * 60 * 1000, // 15 minutes
    })
}

export const useCurrentFinancialPeriod = () => {
    return useQuery({
        queryKey: financialPeriodKeys.current(),
        queryFn: () => FinancialPeriodAPI.getCurrent(),
        staleTime: 10 * 60 * 1000, // 10 minutes
        retry: false, // Don't retry if no current period exists
    })
}

export const useFinancialPeriodSummary = (id: string, enabled = true) => {
    return useQuery({
        queryKey: financialPeriodKeys.summary(id),
        queryFn: () => FinancialPeriodAPI.getSummary(id),
        enabled: enabled && !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes - summary can change with new transactions
    })
}

// Helper hook to get open periods for selectors
export const useOpenFinancialPeriods = () => {
    return useQuery({
        queryKey: financialPeriodKeys.list({ status: 'open', limit: 50 }),
        queryFn: () => FinancialPeriodAPI.getAll({ status: 'open', limit: 50 }),
        staleTime: 15 * 60 * 1000, // 15 minutes
        select: (data) => data.periods, // Only return the periods array
    })
}

// ===== MUTATIONS =====
export const useCreateFinancialPeriod = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: { year: number; month: number }) => FinancialPeriodAPI.create(data),
        onSuccess: (data) => {
            // Invalidate and refetch relevant queries
            queryClient.invalidateQueries({ queryKey: financialPeriodKeys.lists() })
            
            // Set the created period in cache
            queryClient.setQueryData(financialPeriodKeys.detail(data._id), data)
            
            // If this is now the current period, invalidate current query
            queryClient.invalidateQueries({ queryKey: financialPeriodKeys.current() })
            
            toast.success('Período financiero creado exitosamente')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al crear el período financiero')
        },
    })
}

export const useCloseFinancialPeriod = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => FinancialPeriodAPI.close(id),
        onSuccess: (data, id) => {
            // Update the specific period in cache
            queryClient.setQueryData(financialPeriodKeys.detail(id), data)
            
            // Invalidate lists to update status
            queryClient.invalidateQueries({ queryKey: financialPeriodKeys.lists() })
            
            // Invalidate current period as it may have changed
            queryClient.invalidateQueries({ queryKey: financialPeriodKeys.current() })
            
            // Invalidate summary to reflect closed status
            queryClient.invalidateQueries({ queryKey: financialPeriodKeys.summary(id) })
            
            // Invalidate financial reports as they may be affected
            queryClient.invalidateQueries({ queryKey: ['financial-reports'] })
            
            toast.success('Período financiero cerrado exitosamente')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al cerrar el período financiero')
        },
    })
}

export const useReopenFinancialPeriod = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => FinancialPeriodAPI.reopen(id),
        onSuccess: (data, id) => {
            // Update the specific period in cache
            queryClient.setQueryData(financialPeriodKeys.detail(id), data)
            
            // Invalidate lists to update status
            queryClient.invalidateQueries({ queryKey: financialPeriodKeys.lists() })
            
            // Invalidate current period as it may have changed
            queryClient.invalidateQueries({ queryKey: financialPeriodKeys.current() })
            
            // Invalidate summary to reflect reopened status
            queryClient.invalidateQueries({ queryKey: financialPeriodKeys.summary(id) })
            
            // Invalidate financial reports as they may be affected
            queryClient.invalidateQueries({ queryKey: ['financial-reports'] })
            
            toast.success('Período financiero reabierto exitosamente')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al reabrir el período financiero')
        },
    })
}

// ===== UTILITY HOOKS =====
export const usePeriodOptions = () => {
    const { data: periods, isLoading } = useOpenFinancialPeriods()
    
    const periodOptions = periods?.map(period => ({
        value: period._id,
        label: `${period.month}/${period.year}`,
        year: period.year,
        month: period.month,
        isActive: period.isActive,
    })) || []
    
    return {
        periodOptions,
        isLoading,
    }
}

// Hook to get years for year selectors
export const useAvailableYears = () => {
    const { data: periods } = useFinancialPeriods({ limit: 1000 })
    
    const years = periods?.periods
        ? [...new Set(periods.periods.map(p => p.year))]
            .sort((a, b) => b - a) // Sort descending (newest first)
        : []
    
    return years
}

// Hook to check if a period can be closed (admin only and business rules)
export const useCanClosePeriod = (periodId: string) => {
    const { data: period } = useFinancialPeriod(periodId)
    const { data: summary } = useFinancialPeriodSummary(periodId, !!period && !period.isClosed)
    
    const canClose = period && !period.isClosed && summary && (
        // Add business rules here, e.g.:
        // - All invoices are reconciled
        // - All payments are processed
        // - Required reports are generated
        true // For now, allow closing if period exists and is open
    )
    
    return {
        canClose: !!canClose,
        period,
        summary,
        reasons: [] // Array of reasons why it can't be closed
    }
}
