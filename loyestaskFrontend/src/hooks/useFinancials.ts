import { useQuery } from '@tanstack/react-query'
import { FinancialReportsAPI, FinancialPeriodAPI } from '@/api/FinancialAPI'

// Hook para obtener reportes financieros
export const useFinancialReports = ({ period, type }: { period?: string; type?: string } = {}) => {
    return useQuery({
        queryKey: ['financial-reports', period, type],
        queryFn: () => FinancialReportsAPI.getDashboard({ period }),
        staleTime: 5 * 60 * 1000, // 5 minutos
    })
}

// Hook para obtener periodos financieros
export const useFinancialPeriods = () => {
    return useQuery({
        queryKey: ['financial-periods'],
        queryFn: () => FinancialPeriodAPI.getAll(),
        staleTime: 30 * 60 * 1000, // 30 minutos
    })
}

// Hook para obtener el dashboard financiero
export const useFinancialDashboard = ({ period }: { period?: string } = {}) => {
    const currentDate = new Date()
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1
    
    return useQuery({
        queryKey: ['financial-dashboard', period, year, month],
        queryFn: () => FinancialReportsAPI.getDashboard({ 
            year, 
            month, 
            period 
        }),
        staleTime: 2 * 60 * 1000, // 2 minutos
    })
}

// Hook para obtener flujo de caja
export const useFinancialCashFlow = ({ year, month }: { year?: number; month?: number } = {}) => {
    const currentDate = new Date()
    const defaultYear = year || currentDate.getFullYear()
    const defaultMonth = month || currentDate.getMonth() + 1
    
    return useQuery({
        queryKey: ['financial-cash-flow', defaultYear, defaultMonth],
        queryFn: () => FinancialReportsAPI.getCashFlow({
            year: defaultYear,
            month: defaultMonth
        }),
        staleTime: 5 * 60 * 1000, // 5 minutos
    })
}

// Hook para obtener cuentas por cobrar
export const useAccountsReceivable = ({ asOfDate }: { asOfDate?: string } = {}) => {
    return useQuery({
        queryKey: ['accounts-receivable', asOfDate],
        queryFn: () => FinancialReportsAPI.getAccountsReceivable({ asOfDate }),
        staleTime: 10 * 60 * 1000, // 10 minutos
    })
}

// Hook para obtener resumen financiero (combinando múltiples fuentes)
export const useFinancialSummary = ({ startDate, endDate }: { startDate?: string; endDate?: string } = {}) => {
    const currentDate = new Date()
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1
    
    return useQuery({
        queryKey: ['financial-summary', startDate, endDate, year, month],
        queryFn: async () => {
            const [dashboard, cashFlow] = await Promise.all([
                FinancialReportsAPI.getDashboard({ year, month }),
                FinancialReportsAPI.getCashFlow({ year, month })
            ])
            return { dashboard, cashFlow }
        },
        staleTime: 5 * 60 * 1000, // 5 minutos
    })
}
