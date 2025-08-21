import { useQuery, useMutation } from '@tanstack/react-query'
import { FinancialReportsAPI, FinancialAPI } from '@/api/FinancialAPI'
import { toast } from 'react-toastify'
import { useCallback } from 'react'

// ===== QUERY KEYS =====
export const financialReportKeys = {
    all: ['financial-reports'] as const,
    dashboard: (params?: Record<string, unknown>) => [...financialReportKeys.all, 'dashboard', params] as const,
    cashFlow: (params: Record<string, unknown>) => [...financialReportKeys.all, 'cash-flow', params] as const,
    accountsReceivable: (params?: Record<string, unknown>) => [...financialReportKeys.all, 'accounts-receivable', params] as const,
    clientProfitability: (params?: Record<string, unknown>) => [...financialReportKeys.all, 'client-profitability', params] as const,
    incomeProjection: (params?: Record<string, unknown>) => [...financialReportKeys.all, 'income-projection', params] as const,
    expenseAnalysis: (params?: Record<string, unknown>) => [...financialReportKeys.all, 'expense-analysis', params] as const,
    // Legacy exports keys
    available: (year?: number) => ['financial-reports', 'available', year] as const,
    monthly: (year: number, month: number) => ['financial-reports', 'monthly', year, month] as const,
}

// ===== LEGACY FINANCIAL EXPORTS (keeping existing functionality) =====
export function useFinancialReports() {
    
    // Hook para obtener reportes disponibles
    const useAvailableReports = (year?: number) => {
        return useQuery({
            queryKey: financialReportKeys.available(year),
            queryFn: ({ signal }) => FinancialAPI.getAvailableReports(year, signal),
            staleTime: 5 * 60 * 1000, // 5 minutos
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        })
    }

    // Hook para obtener datos de un reporte específico
    const useMonthlyReport = (year: number, month: number, enabled = true) => {
        return useQuery({
            queryKey: ['financial-reports', 'monthly', year, month],
            queryFn: ({ signal }) => FinancialAPI.getMonthlyReportData(year, month, signal),
            enabled: enabled && year > 0 && month > 0,
            staleTime: 10 * 60 * 1000, // 10 minutos
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        })
    }

    // Función para descargar Excel con feedback mejorado
    const downloadExcel = useCallback(async (year: number, month: number) => {
        toast.loading('Generando reporte Excel...')
        try {
            const blob = await FinancialAPI.downloadExcelReport(year, month)
            const filename = `reporte-financiero-${year}-${month.toString().padStart(2, '0')}.xlsx`
            FinancialAPI.downloadFile(blob, filename)
            toast.success('Reporte Excel descargado exitosamente')
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al descargar el reporte Excel'
            toast.error(message)
            throw error
        }
    }, [])

    // Función para descargar PDF con feedback mejorado
    const downloadPDF = useCallback(async (year: number, month: number) => {
        toast.loading('Generando reporte PDF...')
        try {
            const blob = await FinancialAPI.downloadPDFReport(year, month)
            const filename = `reporte-financiero-${year}-${month.toString().padStart(2, '0')}.pdf`
            FinancialAPI.downloadFile(blob, filename)
            toast.success('Reporte PDF descargado exitosamente')
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al descargar el reporte PDF'
            toast.error(message)
            throw error
        }
    }, [])

    return {
        useAvailableReports,
        useMonthlyReport,
        downloadExcel,
        downloadPDF,
    }
}

// ===== NEW FINANCIAL REPORTS HOOKS =====

// ===== DASHBOARD =====
export const useFinancialDashboard = (params?: {
    year?: number
    month?: number
    period?: string
}) => {
    return useQuery({
        queryKey: financialReportKeys.dashboard(params),
        queryFn: () => FinancialReportsAPI.getDashboard(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    })
}

// ===== CASH FLOW REPORT =====
export const useCashFlowReport = (params: {
    year: number
    month: number
}, enabled = true) => {
    return useQuery({
        queryKey: financialReportKeys.cashFlow(params),
        queryFn: () => FinancialReportsAPI.getCashFlow(params),
        enabled: enabled && !!params.year && !!params.month,
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 15 * 60 * 1000,
    })
}

// ===== ACCOUNTS RECEIVABLE REPORT =====
export const useAccountsReceivableReport = (params?: {
    asOfDate?: string
}) => {
    return useQuery({
        queryKey: financialReportKeys.accountsReceivable(params),
        queryFn: () => FinancialReportsAPI.getAccountsReceivable(params),
        staleTime: 5 * 60 * 1000, // 5 minutes - this can change frequently
        gcTime: 10 * 60 * 1000,
    })
}

// ===== CLIENT PROFITABILITY REPORT =====
export const useClientProfitabilityReport = (params?: {
    year?: number
    quarter?: number
    limit?: number
}) => {
    return useQuery({
        queryKey: financialReportKeys.clientProfitability(params),
        queryFn: () => FinancialReportsAPI.getClientProfitability(params),
        staleTime: 15 * 60 * 1000, // 15 minutes - less frequent changes
        gcTime: 30 * 60 * 1000,
    })
}

// ===== INCOME PROJECTION REPORT =====
export const useIncomeProjectionReport = (params?: {
    months?: number
}) => {
    return useQuery({
        queryKey: financialReportKeys.incomeProjection(params),
        queryFn: () => FinancialReportsAPI.getIncomeProjection(params),
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 20 * 60 * 1000,
    })
}

// ===== EXPENSE ANALYSIS REPORT =====
export const useExpenseAnalysisReport = (params?: {
    year?: number
    months?: number
}) => {
    return useQuery({
        queryKey: financialReportKeys.expenseAnalysis(params),
        queryFn: () => FinancialReportsAPI.getExpenseAnalysis(params),
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 20 * 60 * 1000,
    })
}

// ===== EXPORT MUTATIONS =====
export const useExportFinancialReport = () => {
    return useMutation({
        mutationFn: ({ 
            reportType, 
            params, 
            format 
        }: { 
            reportType: string
            params: Record<string, unknown>
            format: 'excel' | 'pdf' 
        }) => FinancialReportsAPI.exportReport(reportType, params, format),
        onSuccess: (blob, variables) => {
            // Download the file
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${variables.reportType}-report.${variables.format}`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
            
            toast.success(`Reporte exportado exitosamente en formato ${variables.format.toUpperCase()}`)
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al exportar el reporte')
        },
    })
}

// ===== UTILITY HOOKS =====

// Combined financial overview hook
export const useFinancialOverview = (params?: {
    year?: number
    month?: number
    period?: string
}) => {
    const dashboard = useFinancialDashboard(params)
    const accountsReceivable = useAccountsReceivableReport()
    const incomeProjection = useIncomeProjectionReport({ months: 6 })
    
    return {
        dashboard,
        accountsReceivable,
        incomeProjection,
        isLoading: dashboard.isLoading || accountsReceivable.isLoading || incomeProjection.isLoading,
        error: dashboard.error || accountsReceivable.error || incomeProjection.error,
    }
}

// Monthly reports bundle hook
export const useMonthlyReports = (year: number, month: number, enabled = true) => {
    const cashFlow = useCashFlowReport({ year, month }, enabled)
    const dashboard = useFinancialDashboard({ year, month })
    const expenseAnalysis = useExpenseAnalysisReport({ year, months: 1 })
    
    return {
        cashFlow,
        dashboard,
        expenseAnalysis,
        isLoading: cashFlow.isLoading || dashboard.isLoading || expenseAnalysis.isLoading,
        error: cashFlow.error || dashboard.error || expenseAnalysis.error,
        data: {
            cashFlow: cashFlow.data,
            dashboard: dashboard.data,
            expenseAnalysis: expenseAnalysis.data,
        }
    }
}

// Year-over-year comparison hook
export const useYearOverYearComparison = (currentYear: number) => {
    const currentYearDashboard = useFinancialDashboard({ year: currentYear })
    const previousYearDashboard = useFinancialDashboard({ year: currentYear - 1 })
    
    const comparison = {
        current: currentYearDashboard.data,
        previous: previousYearDashboard.data,
        changes: currentYearDashboard.data && previousYearDashboard.data ? {
            incomeChange: currentYearDashboard.data.totalIncome - previousYearDashboard.data.totalIncome,
            expenseChange: currentYearDashboard.data.totalExpenses - previousYearDashboard.data.totalExpenses,
            netIncomeChange: currentYearDashboard.data.netIncome - previousYearDashboard.data.netIncome,
            incomeChangePercent: previousYearDashboard.data.totalIncome > 0 
                ? ((currentYearDashboard.data.totalIncome - previousYearDashboard.data.totalIncome) / previousYearDashboard.data.totalIncome) * 100
                : 0,
        } : null
    }
    
    return {
        ...comparison,
        isLoading: currentYearDashboard.isLoading || previousYearDashboard.isLoading,
        error: currentYearDashboard.error || previousYearDashboard.error,
    }
}

// Performance metrics hook
export const usePerformanceMetrics = (params?: {
    year?: number
    quarter?: number
}) => {
    const clientProfitability = useClientProfitabilityReport(params)
    const incomeProjection = useIncomeProjectionReport()
    const expenseAnalysis = useExpenseAnalysisReport(params)
    
    const metrics = {
        topClients: clientProfitability.data?.clients.slice(0, 5) || [],
        projectedGrowth: incomeProjection.data?.summary.confidence || 0,
        expenseTrend: expenseAnalysis.data?.summary.trend || 0,
        profitabilityTrend: clientProfitability.data?.summary.avgProfitMargin || 0,
    }
    
    return {
        ...metrics,
        isLoading: clientProfitability.isLoading || incomeProjection.isLoading || expenseAnalysis.isLoading,
        error: clientProfitability.error || incomeProjection.error || expenseAnalysis.error,
    }
}
