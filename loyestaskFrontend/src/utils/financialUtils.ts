/**
 * Utilidades financieras modernas con memoización y optimización
 */

// Memoización de formateadores para evitar recreación
const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
})

const percentageFormatter = new Intl.NumberFormat('es-CO', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
})

const compactCurrencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
})

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
})

const shortDateFormatter = new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
})

/**
 * Formatea un número como moneda colombiana
 */
export const formatCurrency = (amount: number): string => {
    return currencyFormatter.format(amount)
}

/**
 * Formatea un número como moneda compacta (ej: $1.2M)
 */
export const formatCompactCurrency = (amount: number): string => {
    return compactCurrencyFormatter.format(amount)
}

/**
 * Formatea un número como porcentaje
 */
export const formatPercentage = (decimal: number): string => {
    return percentageFormatter.format(decimal)
}

/**
 * Formatea un porcentaje simple (sin convertir decimal)
 */
export const formatSimplePercentage = (percentage: number, decimals = 1): string => {
    return `${percentage.toFixed(decimals)}%`
}

/**
 * Formatea una fecha para mostrar
 */
export const formatDate = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateFormatter.format(dateObj)
}

/**
 * Formatea una fecha corta
 */
export const formatShortDate = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return shortDateFormatter.format(dateObj)
}

/**
 * Obtiene el nombre del mes en español
 */
export const getMonthName = (month: number): string => {
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ] as const
    return months[month - 1] || ''
}

/**
 * Obtiene el color de estado para facturas con mejor contraste
 */
export const getInvoiceStatusColor = (status: string): string => {
    const statusColors = {
        paid: 'bg-green-100 text-green-800 border-green-200',
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        overdue: 'bg-red-100 text-red-800 border-red-200',
        cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
    } as const
    
    return statusColors[status as keyof typeof statusColors] || statusColors.cancelled
}

/**
 * Obtiene el texto de estado para facturas
 */
export const getInvoiceStatusText = (status: string): string => {
    const statusTexts = {
        paid: 'Pagada',
        pending: 'Pendiente',
        overdue: 'Vencida',
        cancelled: 'Cancelada',
    } as const
    
    return statusTexts[status as keyof typeof statusTexts] || status
}

/**
 * Obtiene el color para mostrar ganancias/pérdidas con gradiente
 */
export const getProfitColor = (amount: number): string => {
    if (amount > 0) return 'text-green-600 font-semibold'
    if (amount < 0) return 'text-red-600 font-semibold'
    return 'text-gray-600'
}

/**
 * Obtiene el color de fondo para métricas
 */
export const getProfitBgColor = (amount: number): string => {
    if (amount > 0) return 'bg-green-50 border-green-200'
    if (amount < 0) return 'bg-red-50 border-red-200'
    return 'bg-gray-50 border-gray-200'
}

/**
 * Calcula el margen de ganancia
 */
export const calculateProfitMargin = (netProfit: number, totalIncome: number): number => {
    if (totalIncome === 0) return 0
    return (netProfit / totalIncome) * 100
}

/**
 * Formatea un número grande con separadores de miles
 */
export const formatLargeNumber = (num: number): string => {
    return new Intl.NumberFormat('es-CO').format(num)
}

/**
 * Valida si una fecha está vencida
 */
export const isOverdue = (dueDate: string | Date): boolean => {
    const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
    return date.getTime() < Date.now()
}

/**
 * Calcula los días hasta vencimiento
 */
export const getDaysUntilDue = (dueDate: string | Date): number => {
    const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
    const diffTime = date.getTime() - Date.now()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Obtiene el color basado en los días hasta vencimiento
 */
export const getDueDateColor = (dueDate: string | Date): string => {
    const days = getDaysUntilDue(dueDate)
    if (days < 0) return 'text-red-600'
    if (days <= 7) return 'text-yellow-600'
    return 'text-green-600'
}

// ===== EXTENDED FINANCIAL UTILITIES =====

/**
 * Obtiene etiquetas localizadas para estados de facturas
 */
export const getInvoiceStatusBadge = (status: string) => {
    const statusMap = {
        draft: { color: 'gray', label: 'Borrador' },
        sent: { color: 'blue', label: 'Enviada' },
        paid: { color: 'green', label: 'Pagada' },
        overdue: { color: 'red', label: 'Vencida' },
        cancelled: { color: 'gray', label: 'Cancelada' },
    } as const

    return statusMap[status as keyof typeof statusMap] || { color: 'gray', label: status }
}

/**
 * Obtiene etiquetas localizadas para estados de pagos
 */
export const getPaymentStatusBadge = (status: string) => {
    const statusMap = {
        pending: { color: 'yellow', label: 'Pendiente' },
        completed: { color: 'green', label: 'Completado' },
        failed: { color: 'red', label: 'Fallido' },
        cancelled: { color: 'gray', label: 'Cancelado' },
    } as const

    return statusMap[status as keyof typeof statusMap] || { color: 'gray', label: status }
}

/**
 * Obtiene etiquetas localizadas para estados de cuentas
 */
export const getAccountStatusBadge = (status: string) => {
    const statusMap = {
        active: { color: 'green', label: 'Activa' },
        inactive: { color: 'yellow', label: 'Inactiva' },
        closed: { color: 'red', label: 'Cerrada' },
    } as const

    return statusMap[status as keyof typeof statusMap] || { color: 'gray', label: status }
}

/**
 * Obtiene etiquetas localizadas para estados de períodos
 */
export const getPeriodStatusBadge = (status: string) => {
    const statusMap = {
        open: { color: 'green', label: 'Abierto' },
        closed: { color: 'red', label: 'Cerrado' },
    } as const

    return statusMap[status as keyof typeof statusMap] || { color: 'gray', label: status }
}

/**
 * Obtiene etiquetas localizadas para tipos de facturas
 */
export const getInvoiceTypeLabel = (type: string) => {
    const typeMap = {
        sent: 'Enviada',
        received: 'Recibida',
    } as const

    return typeMap[type as keyof typeof typeMap] || type
}

/**
 * Obtiene etiquetas localizadas para tipos de pagos
 */
export const getPaymentTypeLabel = (type: string) => {
    const typeMap = {
        income: 'Ingreso',
        expense: 'Gasto',
    } as const

    return typeMap[type as keyof typeof typeMap] || type
}

/**
 * Obtiene etiquetas localizadas para métodos de pago
 */
export const getPaymentMethodLabel = (method: string) => {
    const methodMap = {
        cash: 'Efectivo',
        bank_transfer: 'Transferencia bancaria',
        check: 'Cheque',
        credit_card: 'Tarjeta de crédito',
        debit_card: 'Tarjeta de débito',
        other: 'Otro',
    } as const

    return methodMap[method as keyof typeof methodMap] || method
}

/**
 * Obtiene etiquetas localizadas para tipos de cuentas
 */
export const getAccountTypeLabel = (type: string) => {
    const typeMap = {
        bank: 'Bancaria',
        cash: 'Efectivo',
        credit_card: 'Tarjeta de crédito',
        savings: 'Ahorro',
        other: 'Otra',
    } as const

    return typeMap[type as keyof typeof typeMap] || type
}

/**
 * Calcula los días de atraso de una factura
 */
export const getDaysOverdue = (dueDate: string): number => {
    const due = new Date(dueDate)
    const today = new Date()
    if (due >= today) return 0
    
    const diffTime = today.getTime() - due.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Obtiene la categoría de antigüedad basada en días de atraso
 */
export const getAgingCategory = (daysOverdue: number): string => {
    if (daysOverdue <= 0) return 'current'
    if (daysOverdue <= 30) return 'days30'
    if (daysOverdue <= 60) return 'days60'
    if (daysOverdue <= 90) return 'days90'
    return 'over90'
}

/**
 * Obtiene etiquetas localizadas para categorías de antigüedad
 */
export const getAgingCategoryLabel = (category: string): string => {
    const categoryMap = {
        current: 'Al día',
        days30: '1-30 días',
        days60: '31-60 días',
        days90: '61-90 días',
        over90: 'Más de 90 días',
    } as const

    return categoryMap[category as keyof typeof categoryMap] || category
}

/**
 * Genera nombres de archivo para exportaciones
 */
export const generateFilename = (type: string, year?: number, month?: number, format = 'xlsx'): string => {
    const timestamp = new Date().toISOString().slice(0, 10)
    let filename = `${type}-${timestamp}`

    if (year && month) {
        filename = `${type}-${year}-${month.toString().padStart(2, '0')}`
    } else if (year) {
        filename = `${type}-${year}`
    }

    return `${filename}.${format}`
}

/**
 * Descarga un blob como archivo
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
}

/**
 * Genera colores para gráficos
 */
export const generateChartColors = (count: number): string[] => {
    const baseColors = [
        '#3B82F6', // blue
        '#10B981', // green
        '#F59E0B', // yellow
        '#EF4444', // red
        '#8B5CF6', // purple
        '#F97316', // orange
        '#06B6D4', // cyan
        '#84CC16', // lime
        '#EC4899', // pink
        '#6B7280', // gray
    ]

    const colors: string[] = []
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length])
    }

    return colors
}

/**
 * Calcula métricas de resumen de una colección de datos
 */
export const calculateSummaryMetrics = (data: { amount: number }[]) => {
    const amounts = data.map(item => item.amount)
    const total = amounts.reduce((sum, amount) => sum + amount, 0)
    const count = amounts.length
    const average = count > 0 ? total / count : 0
    const max = count > 0 ? Math.max(...amounts) : 0
    const min = count > 0 ? Math.min(...amounts) : 0

    return {
        total,
        count,
        average,
        max,
        min,
    }
}

/**
 * Agrupa datos por período temporal
 */
export const groupByPeriod = <T extends { date: string }>(
    data: T[],
    period: 'daily' | 'weekly' | 'monthly' | 'yearly'
): Record<string, T[]> => {
    const groups: Record<string, T[]> = {}

    data.forEach(item => {
        const date = new Date(item.date)
        let key: string

        switch (period) {
            case 'daily':
                key = date.toISOString().slice(0, 10)
                break
            case 'weekly': {
                const weekStart = new Date(date)
                weekStart.setDate(date.getDate() - date.getDay())
                key = weekStart.toISOString().slice(0, 10)
                break
            }
            case 'monthly':
                key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
                break
            case 'yearly':
                key = date.getFullYear().toString()
                break
            default:
                key = date.toISOString().slice(0, 10)
        }

        if (!groups[key]) {
            groups[key] = []
        }
        groups[key].push(item)
    })

    return groups
}

/**
 * Calcula el ROI (Return on Investment)
 */
export const calculateROI = (gain: number, cost: number): number => {
    if (cost === 0) return 0
    return ((gain - cost) / cost) * 100
}

/**
 * Calcula la tasa de crecimiento compuesto
 */
export const calculateCompoundGrowthRate = (initial: number, final: number, periods: number): number => {
    if (initial === 0 || periods === 0) return 0
    return (Math.pow(final / initial, 1 / periods) - 1) * 100
}
