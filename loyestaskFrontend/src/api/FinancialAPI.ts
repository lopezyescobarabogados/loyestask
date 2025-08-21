import api from '@/lib/axios'
import { isAxiosError } from 'axios'
import { 
    availableReportSchema, 
    monthlyReportDataSchema,
    type AvailableReport, 
    type MonthlyReportData,
    // Invoice types
    type Invoice,
    type CreateInvoiceForm,
    type InvoiceSummary,
    // Payment types
    type Payment,
    type CreatePaymentForm,
    type PaymentSummary,
    // Account types
    type Account,
    type CreateAccountForm,
    type AccountMovement,
    type TransferForm,
    // Financial Period types
    type FinancialPeriod,
    type PeriodSummary,
    // Financial Reports types
    type FinancialDashboard,
    type CashFlow,
    type AccountsReceivable,
    type ClientProfitability,
    type IncomeProjection,
    type ExpenseAnalysis
} from '@/types/index'

// ===== EXISTING FINANCIAL EXPORTS =====
export class FinancialAPI {
    
    // Obtener reportes disponibles
    static async getAvailableReports(year?: number, signal?: AbortSignal): Promise<AvailableReport[]> {
        try {
            const url = year ? `/financial-exports/available?year=${year}` : '/financial-exports/available'
            const { data } = await api.get(url, { signal })
            
            return data.map((report: unknown) => availableReportSchema.parse(report))
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener reportes disponibles')
            }
            throw error
        }
    }

    // Obtener datos del reporte mensual
    static async getMonthlyReportData(year: number, month: number, signal?: AbortSignal): Promise<MonthlyReportData> {
        try {
            const { data } = await api.get(`/financial-exports/monthly/${year}/${month}/data`, { signal })
            return monthlyReportDataSchema.parse(data)
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener datos del reporte')
            }
            throw error
        }
    }

    // Descargar reporte en Excel
    static async downloadExcelReport(year: number, month: number, signal?: AbortSignal): Promise<Blob> {
        try {
            const { data } = await api.get(`/financial-exports/monthly/${year}/${month}/excel`, {
                responseType: 'blob',
                signal
            })
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error('Error al descargar el reporte en Excel')
            }
            throw error
        }
    }

    // Descargar reporte en PDF
    static async downloadPDFReport(year: number, month: number, signal?: AbortSignal): Promise<Blob> {
        try {
            const { data } = await api.get(`/financial-exports/monthly/${year}/${month}/pdf`, {
                responseType: 'blob',
                signal
            })
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error('Error al descargar el reporte en PDF')
            }
            throw error
        }
    }

    // Función auxiliar para descargar archivos
    static downloadFile(blob: Blob, filename: string): void {
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
    }
}

// ===== INVOICE MANAGEMENT API =====
export class InvoiceAPI {
    
    static async getAll(params?: {
        page?: number
        limit?: number
        type?: 'sent' | 'received'
        status?: string
        search?: string
        startDate?: string
        endDate?: string
    }) {
        try {
            const { data } = await api.get<{
                invoices: Invoice[]
                totalPages: number
                currentPage: number
                total: number
            }>('/invoices', { params })
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener facturas')
            }
            throw error
        }
    }

    static async getById(id: string) {
        try {
            const { data } = await api.get<Invoice>(`/invoices/${id}`)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener factura')
            }
            throw error
        }
    }

    static async create(invoiceData: CreateInvoiceForm) {
        try {
            const { data } = await api.post<Invoice>('/invoices', invoiceData)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al crear factura')
            }
            throw error
        }
    }

    static async update(id: string, invoiceData: Partial<CreateInvoiceForm>) {
        try {
            const { data } = await api.put<Invoice>(`/invoices/${id}`, invoiceData)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al actualizar factura')
            }
            throw error
        }
    }

    static async delete(id: string) {
        try {
            const { data } = await api.delete(`/invoices/${id}`)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al eliminar factura')
            }
            throw error
        }
    }

    static async updateStatus(id: string, status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled') {
        try {
            const { data } = await api.patch<Invoice>(`/invoices/${id}/status`, { status })
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al actualizar estado de factura')
            }
            throw error
        }
    }

    static async getSummary(params?: {
        year?: number
        month?: number
        type?: 'sent' | 'received'
    }) {
        try {
            const { data } = await api.get<InvoiceSummary>('/invoices/summary', { params })
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener resumen de facturas')
            }
            throw error
        }
    }
}

// ===== PAYMENT MANAGEMENT API =====
export class PaymentAPI {
    
    static async getAll(params?: {
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
    }) {
        try {
            const { data } = await api.get<{
                payments: Payment[]
                totalPages: number
                currentPage: number
                total: number
            }>('/payments', { params })
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener pagos')
            }
            throw error
        }
    }

    static async getById(id: string) {
        try {
            const { data } = await api.get<Payment>(`/payments/${id}`)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener pago')
            }
            throw error
        }
    }

    static async create(paymentData: CreatePaymentForm) {
        try {
            const { data } = await api.post<Payment>('/payments', paymentData)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al crear pago')
            }
            throw error
        }
    }

    static async update(id: string, paymentData: Partial<CreatePaymentForm>) {
        try {
            const { data } = await api.put<Payment>(`/payments/${id}`, paymentData)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al actualizar pago')
            }
            throw error
        }
    }

    static async delete(id: string) {
        try {
            const { data } = await api.delete(`/payments/${id}`)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al eliminar pago')
            }
            throw error
        }
    }

    static async updateStatus(id: string, status: 'pending' | 'completed' | 'failed' | 'cancelled') {
        try {
            const { data } = await api.patch<Payment>(`/payments/${id}/status`, { status })
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al actualizar estado de pago')
            }
            throw error
        }
    }

    static async getSummary(params?: {
        year?: number
        month?: number
        type?: 'income' | 'expense'
        account?: string
    }) {
        try {
            const { data } = await api.get<PaymentSummary>('/payments/summary', { params })
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener resumen de pagos')
            }
            throw error
        }
    }

    static async getCategories() {
        try {
            const { data } = await api.get<string[]>('/payments/categories')
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener categorías')
            }
            throw error
        }
    }
}

// ===== ACCOUNT MANAGEMENT API =====
export class AccountAPI {
    
    static async getAll(params?: {
        page?: number
        limit?: number
        type?: string
        status?: 'active' | 'inactive' | 'closed'
        search?: string
    }) {
        try {
            const { data } = await api.get<{
                accounts: Account[]
                totalPages: number
                currentPage: number
                total: number
            }>('/accounts', { params })
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener cuentas')
            }
            throw error
        }
    }

    static async getById(id: string) {
        try {
            const { data } = await api.get<Account>(`/accounts/${id}`)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener cuenta')
            }
            throw error
        }
    }

    static async create(accountData: CreateAccountForm) {
        try {
            const { data } = await api.post<Account>('/accounts', accountData)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al crear cuenta')
            }
            throw error
        }
    }

    static async update(id: string, accountData: Partial<CreateAccountForm>) {
        try {
            const { data } = await api.put<Account>(`/accounts/${id}`, accountData)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al actualizar cuenta')
            }
            throw error
        }
    }

    static async delete(id: string) {
        try {
            const { data } = await api.delete(`/accounts/${id}`)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al eliminar cuenta')
            }
            throw error
        }
    }

    static async updateStatus(id: string, status: 'active' | 'inactive' | 'closed') {
        try {
            const { data } = await api.patch<Account>(`/accounts/${id}/status`, { status })
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al actualizar estado de cuenta')
            }
            throw error
        }
    }

    static async getMovements(id: string, params?: {
        page?: number
        limit?: number
        startDate?: string
        endDate?: string
        type?: string
    }) {
        try {
            const { data } = await api.get<{
                movements: AccountMovement[]
                totalPages: number
                currentPage: number
                total: number
            }>(`/accounts/${id}/movements`, { params })
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener movimientos')
            }
            throw error
        }
    }

    static async transfer(transferData: TransferForm) {
        try {
            const { data } = await api.post('/accounts/transfer', transferData)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al realizar transferencia')
            }
            throw error
        }
    }

    static async getBalanceSummary() {
        try {
            const { data } = await api.get<{
                totalBalance: number
                activeAccounts: number
                accountsByType: { type: string; count: number; balance: number }[]
            }>('/accounts/balance-summary')
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener resumen de balances')
            }
            throw error
        }
    }
}

// ===== FINANCIAL PERIOD MANAGEMENT API =====
export class FinancialPeriodAPI {
    
    static async getAll(params?: {
        page?: number
        limit?: number
        year?: number
        status?: 'open' | 'closed'
    }) {
        try {
            const { data } = await api.get<{
                periods: FinancialPeriod[]
                totalPages: number
                currentPage: number
                total: number
            }>('/financial-periods', { params })
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener períodos financieros')
            }
            throw error
        }
    }

    static async getById(id: string) {
        try {
            const { data } = await api.get<FinancialPeriod>(`/financial-periods/${id}`)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener período financiero')
            }
            throw error
        }
    }

    static async getCurrent() {
        try {
            const { data } = await api.get<FinancialPeriod>('/financial-periods/current')
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener período actual')
            }
            throw error
        }
    }

    static async getSummary(id: string) {
        try {
            const { data } = await api.get<PeriodSummary>(`/financial-periods/${id}/summary`)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener resumen del período')
            }
            throw error
        }
    }

    static async close(id: string) {
        try {
            const { data } = await api.patch<FinancialPeriod>(`/financial-periods/${id}/close`)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al cerrar período')
            }
            throw error
        }
    }

    static async reopen(id: string) {
        try {
            const { data } = await api.patch<FinancialPeriod>(`/financial-periods/${id}/reopen`)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al reabrir período')
            }
            throw error
        }
    }

    static async create(periodData: { year: number; month: number }) {
        try {
            const { data } = await api.post<FinancialPeriod>('/financial-periods', periodData)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al crear período')
            }
            throw error
        }
    }
}

// ===== FINANCIAL REPORTS API =====
export class FinancialReportsAPI {
    
    static async getDashboard(params?: {
        year?: number
        month?: number
        period?: string
    }) {
        try {
            const { data } = await api.get<FinancialDashboard>('/financial-reports/dashboard', { params })
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener dashboard financiero')
            }
            throw error
        }
    }

    static async getCashFlow(params: {
        year: number
        month: number
    }) {
        try {
            const { data } = await api.get<CashFlow>('/financial-reports/cash-flow', { params })
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener flujo de caja')
            }
            throw error
        }
    }

    static async getAccountsReceivable(params?: {
        asOfDate?: string
    }) {
        try {
            const { data } = await api.get<AccountsReceivable>('/financial-reports/accounts-receivable', { params })
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener cuentas por cobrar')
            }
            throw error
        }
    }

    static async getClientProfitability(params?: {
        year?: number
        quarter?: number
        limit?: number
    }) {
        try {
            const { data } = await api.get<ClientProfitability>('/financial-reports/client-profitability', { params })
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener rentabilidad de clientes')
            }
            throw error
        }
    }

    static async getIncomeProjection(params?: {
        months?: number
    }) {
        try {
            const { data } = await api.get<IncomeProjection>('/financial-reports/income-projection', { params })
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener proyección de ingresos')
            }
            throw error
        }
    }

    static async getExpenseAnalysis(params?: {
        year?: number
        months?: number
    }) {
        try {
            const { data } = await api.get<ExpenseAnalysis>('/financial-reports/expense-analysis', { params })
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener análisis de gastos')
            }
            throw error
        }
    }

    static async exportReport(reportType: string, params: Record<string, unknown>, format: 'excel' | 'pdf') {
        try {
            const { data } = await api.get(
                `/financial-reports/export/${reportType}/${format}`,
                { 
                    params,
                    responseType: 'blob'
                }
            )
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error('Error al exportar reporte')
            }
            throw error
        }
    }
}
