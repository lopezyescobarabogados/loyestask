import { z } from "zod"
// Asegura que las declaraciones globales estén incluidas en el build
//import './global'

/** Auth & Users */
const authSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    current_password: z.string(),
    password: z.string(),
    password_confirmation: z.string(),
    token: z.string()
})

type Auth = z.infer<typeof authSchema>
export type UserLoginForm = Pick<Auth, 'email' | 'password'>
export type UserRegistrationForm = Pick<Auth, 'name' | 'email' | 'password' | 'password_confirmation'>
export type RequestConfirmationCodeForm = Pick<Auth, 'email'>
export type ConfirmToken = Pick<Auth, 'token'>
export type ForgotPasswordForm = Pick<Auth, 'email'>
export type NewPasswordForm = Pick<Auth, 'password' | 'password_confirmation'>
export type UpdateCurrentUserPasswordForm = Pick<Auth, 'current_password' | 'password' | 'password_confirmation'>
export type CheckPasswordForm = Pick<Auth, 'password'>

/** Users */
export const userSchema = authSchema.pick({
    name: true,
    email: true
}).extend({
    _id: z.string(),
    role: z.enum(['admin', 'user']).default('user'),
    confirmed: z.boolean().default(false)
})

export type User = z.infer<typeof userSchema>
export type UserProfileForm = Pick<User, 'name' | 'email'>
export type UserRegistrationAdminForm = Pick<User, 'name' | 'email' | 'role'> & Pick<Auth, 'password' | 'password_confirmation'>
export type UserUpdateForm = Pick<User, 'name' | 'email' | 'role'>

/** Notes */
const noteSchema = z.object({
    _id: z.string(),
    content: z.string(),
    createdBy: userSchema,
    task: z.string(),
    createdAt: z.string()
})
export type Note = z.infer<typeof noteSchema>
export type NoteFormData = Pick<Note, 'content'>

/** Tasks */
export const taskStatusShema = z.enum(["pending", "onHold", "inProgress", "underReview", "completed"])
export type TaskStatus = z.infer<typeof taskStatusShema>

// Schema para archivos adjuntos
export const taskFileSchema = z.object({
    _id: z.string(),
    fileName: z.string(), // Corregido: backend usa fileName
    originalName: z.string(),
    mimeType: z.string(),
    fileSize: z.number(),
    filePath: z.string(),
    uploadedAt: z.string(),
    uploadedBy: z.union([z.string(), userSchema]) // Puede ser string o objeto User poblado
})

export type TaskFile = z.infer<typeof taskFileSchema>

export const taskSchema = z.object({
    _id: z.string(),
    name: z.string(),
    description: z.string(),
    project: z.string(),
    status: taskStatusShema,
    completedBy: z.array(z.object({
        _id: z.string(),
        user: userSchema,
        status: taskStatusShema
    })),
    notes: z.array(noteSchema.extend({
        createdBy: userSchema
    })),
    archive: z.array(taskFileSchema).optional(),
    dueDate: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    collaborators: z.array(userSchema).optional(),
})

export const taskProjectSchema = taskSchema.pick({
    _id: true,
    name: true,
    description: true,
    status: true,
    dueDate: true,
})

export type Task = z.infer<typeof taskSchema>
export type Collaborator = z.infer<typeof userSchema>
export type TaskFormData = Pick<Task, 'name' | 'description' | 'dueDate'>
export type TaskProject = z.infer<typeof taskProjectSchema>

/** Projects */

export const projectSchema = z.object({
    _id: z.string(),
    projectName: z.string(),
    clientName: z.string(),
    description: z.string(),
    priority: z.string(),
    status: z.string(),
    manager: z.union([z.string(), userSchema.pick({_id: true, name: true, email: true})]), // Puede ser ID o objeto poblado
    tasks: z.array(taskProjectSchema),
    team: z.array(z.union([z.string(), userSchema.pick({_id: true, name: true, email: true})]))
})

export const dashboardProjectSchema = z.array(
    projectSchema.pick({
        _id: true,
        projectName: true,
        clientName: true,
        description: true,
        priority: true,
        status: true,
        manager: true,

    })
)

export const editProjectSchema = projectSchema.pick({
    projectName: true,
    clientName: true,
    description: true,
    priority: true,
})

export type Project = z.infer<typeof projectSchema>
export type ProjectFormData = Pick<Project, "projectName" | "clientName" | "description" | "priority">

/** Team */
const teamMemberSchema = userSchema.pick({
    name: true,
    email: true,
    _id: true
})
export const teamMembersSchema = z.array(teamMemberSchema)
export type teamMember = z.infer<typeof teamMemberSchema>
export type teamMemberForm = Pick<teamMember, 'email'>

/** Performance */
/** Performance */
export const performanceTaskSchema = z.object({
    _id: z.string(),
    name: z.string(),
    description: z.string().optional(),
})

export const performanceProjectSchema = z.object({
    _id: z.string(),
    projectName: z.string(),
    clientName: z.string().optional(),
})

export const statusChangeSchema = z.object({
    status: taskStatusShema,
    timestamp: z.string(),
    workingDaysFromStart: z.number(),
})

export const userPerformanceItemSchema = z.object({
    task: performanceTaskSchema,
    project: performanceProjectSchema,
    completionTime: z.number().optional(),
    isCompleted: z.boolean(),
    isOnTime: z.boolean().optional(),
    statusChanges: z.array(statusChangeSchema),
})

export const userPerformanceMetricsSchema = z.object({
    averageCompletionTime: z.number(),
    onTimePercentage: z.number(),
    productivityTrend: z.number(),
    estimatedCompletionTime: z.number(),
    totalTasks: z.number(),
    completedTasks: z.number(),
    tasksInProgress: z.number(),
})

export const latestEvaluationSchema = z.object({
    score: z.number(),
    date: z.string(),
}).nullable()

export const fullUserPerformanceMetricsSchema = z.object({
    user: userSchema.pick({
        _id: true,
        name: true,
        email: true,
    }),
    metrics: userPerformanceMetricsSchema,
    latestEvaluation: latestEvaluationSchema,
    performance: z.array(userPerformanceItemSchema),
})

export const evaluationMetricsSchema = z.object({
    taskCompletionRate: z.number(),
    averageCompletionTime: z.number(),
    productivity: z.number(),
    qualityScore: z.number(),
})

export const userEvaluationSchema = z.object({
    _id: z.string(),
    user: z.string(),
    evaluatedBy: z.object({
        _id: z.string(),
        name: z.string(),
    }),
    period: z.object({
        startDate: z.string(),
        endDate: z.string(),
    }),
    metrics: evaluationMetricsSchema,
    score: z.number(),
    comments: z.string(),
    recommendations: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
})

export const monthlyTrendSchema = z.object({
    tasks: z.array(z.record(z.string(), z.unknown())), // Para flexibilidad en datos históricos
    averageTime: z.number(),
    onTimeRate: z.number(),
})

export const predictionSchema = z.object({
    period: z.string(),
    estimatedCompletionTime: z.number(),
    expectedOnTimeRate: z.number(),
    recommendedTaskLoad: z.number(),
    confidenceLevel: z.number(),
})

export const recommendationsSchema = z.object({
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
    optimalTaskLoad: z.number(),
})

export const performancePredictionSchema = z.object({
    user: userSchema.pick({
        _id: true,
        name: true,
        email: true,
    }),
    currentMetrics: z.object({
        averageCompletionTime: z.number(),
        onTimePercentage: z.number(),
        productivityTrend: z.number(),
        estimatedCompletionTime: z.number(),
    }),
    monthlyTrends: z.record(z.string(), monthlyTrendSchema),
    predictions: z.array(predictionSchema),
    recommendations: recommendationsSchema,
})

export const recentTaskSchema = z.object({
    task: performanceTaskSchema,
    project: performanceProjectSchema,
    isCompleted: z.boolean(),
    isOnTime: z.boolean().optional(),
    completionTime: z.number().optional(),
})

export const userDashboardSchema = z.object({
    currentPeriodMetrics: z.object({
        totalTasks: z.number(),
        completedTasks: z.number(),
        onTimePercentage: z.number(),
        averageCompletionTime: z.number(),
    }),
    latestEvaluation: z.object({
        score: z.number(),
        comments: z.string(),
        date: z.string(),
        evaluatedBy: z.object({
            _id: z.string(),
            name: z.string(),
        }),
    }).nullable(),
    recentTasks: z.array(recentTaskSchema),
})

// Types
export type PerformanceTask = z.infer<typeof performanceTaskSchema>
export type PerformanceProject = z.infer<typeof performanceProjectSchema>
export type StatusChange = z.infer<typeof statusChangeSchema>
export type UserPerformanceItem = z.infer<typeof userPerformanceItemSchema>
export type UserPerformanceMetrics = z.infer<typeof userPerformanceMetricsSchema>
export type FullUserPerformanceMetrics = z.infer<typeof fullUserPerformanceMetricsSchema>
export type EvaluationMetrics = z.infer<typeof evaluationMetricsSchema>
export type UserEvaluation = z.infer<typeof userEvaluationSchema>
export type MonthlyTrend = z.infer<typeof monthlyTrendSchema>
export type Prediction = z.infer<typeof predictionSchema>
export type PerformanceRecommendations = z.infer<typeof recommendationsSchema>
export type PerformancePrediction = z.infer<typeof performancePredictionSchema>
export type RecentTask = z.infer<typeof recentTaskSchema>
export type UserDashboard = z.infer<typeof userDashboardSchema>

export type CreateEvaluationForm = {
    period: {
        startDate: string;
        endDate: string;
    };
    metrics: EvaluationMetrics;
    score: number;
    comments: string;
    recommendations?: string;
}

/** Automated Performance Evaluation */
export const automatedMetricsSchema = z.object({
    tasksAssigned: z.number(),
    tasksCompleted: z.number(),
    completionRate: z.number(),
    averageCompletionDays: z.number(),
    onTimeDeliveries: z.number(),
    onTimePercentage: z.number(),
    delayedDeliveries: z.number(),
    averageDelayDays: z.number(),
    maxDelayDays: z.number(),
    tasksCompletedThisMonth: z.number(),
    productivityTrend: z.enum(['improving', 'stable', 'declining']),
    earlyDeliveries: z.number(),
    qualityScore: z.number(),
});

export const automatedEvaluationResultSchema = z.object({
    score: z.number(),
    rating: z.enum(['excellent', 'good', 'average', 'needs_improvement', 'poor']),
    feedback: z.array(z.string()),
});

export const automatedEvaluationSchema = z.object({
    user: userSchema.pick({
        _id: true,
        name: true,
        email: true,
    }),
    evaluationPeriod: z.object({
        days: z.number(),
        startDate: z.string(),
        endDate: z.string(),
    }),
    automatedMetrics: automatedMetricsSchema,
    evaluation: automatedEvaluationResultSchema,
    monthlyReports: z.array(z.any()).optional(),
    isAutomated: z.boolean(),
});

export type AutomatedMetrics = z.infer<typeof automatedMetricsSchema>
export type AutomatedEvaluationResult = z.infer<typeof automatedEvaluationResultSchema>
export type AutomatedEvaluation = z.infer<typeof automatedEvaluationSchema>

/** Notifications */
export const notificationPreferenceSchema = z.object({
    _id: z.string(),
    user: z.string(),
    task: z.object({
        _id: z.string(),
        name: z.string(),
        description: z.string(),
        dueDate: z.string(),
        status: taskStatusShema,
        project: z.object({
            _id: z.string(),
            projectName: z.string(),
            clientName: z.string().optional(),
        }),
    }),
    reminderDays: z.number().min(0).max(30),
    isEnabled: z.boolean(),
    isDailyReminderEnabled: z.boolean(),
    lastSentAt: z.string().optional(),
    lastDailyReminderAt: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
})

export const notificationSummarySchema = z.object({
    total: z.number(),
    enabled: z.number(),
    disabled: z.number(),
    dailyEnabled: z.number(),
    recentlySent: z.number(),
    dailyRecentlySent: z.number(),
})

export const createNotificationPreferenceSchema = z.object({
    reminderDays: z.number().min(0).max(30),
    isEnabled: z.boolean().optional(),
    isDailyReminderEnabled: z.boolean().optional(),
})

export type NotificationPreference = z.infer<typeof notificationPreferenceSchema>
export type NotificationSummary = z.infer<typeof notificationSummarySchema>
export type CreateNotificationPreference = z.infer<typeof createNotificationPreferenceSchema>

/** Financial Module - Comprehensive Implementation */

// Financial Periods - Períodos Contables
export const financialPeriodSchema = z.object({
    _id: z.string(),
    year: z.number(),
    month: z.number(),
    startDate: z.string(),
    endDate: z.string(),
    status: z.enum(['open', 'closed']),
    isActive: z.boolean(),
    isClosed: z.boolean(),
    totalIncome: z.number().optional(),
    totalExpenses: z.number().optional(),
    netProfit: z.number().optional(),
    closedBy: z.string().optional(),
    closedAt: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
})

// Accounts - Cuentas
export const accountSchema = z.object({
    _id: z.string(),
    name: z.string(),
    type: z.enum(['bank', 'cash', 'credit_card', 'savings', 'other']),
    status: z.enum(['active', 'inactive', 'closed']),
    balance: z.number(),
    initialBalance: z.number(),
    currency: z.string().default('COP'),
    accountNumber: z.string().optional(),
    bankName: z.string().optional(),
    description: z.string().optional(),
    createdBy: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
})

export const createAccountSchema = z.object({
    name: z.string().min(1, 'Nombre es requerido'),
    type: z.enum(['bank', 'cash', 'credit_card', 'savings', 'other']),
    initialBalance: z.number().default(0),
    accountNumber: z.string().optional(),
    bankName: z.string().optional(),
    description: z.string().optional(),
})

export const accountMovementSchema = z.object({
    _id: z.string(),
    type: z.enum(['income', 'expense', 'transfer_in', 'transfer_out']),
    amount: z.number(),
    description: z.string(),
    date: z.string(),
    balance: z.number(),
    payment: z.string().optional(),
    relatedAccount: z.string().optional(),
})

export const transferSchema = z.object({
    fromAccount: z.string().min(1, 'Cuenta origen es requerida'),
    toAccount: z.string().min(1, 'Cuenta destino es requerida'),
    amount: z.number().min(0, 'Monto debe ser mayor a 0'),
    description: z.string().min(1, 'Descripción es requerida'),
})

// Invoices - Facturas
export const invoiceSchema = z.object({
    _id: z.string(),
    invoiceNumber: z.string(),
    type: z.enum(['sent', 'received']),
    status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
    client: z.string(),
    provider: z.string().optional(),
    total: z.number(),
    subtotal: z.number().optional(),
    tax: z.number().optional(),
    description: z.string().optional(),
    dueDate: z.string(),
    issueDate: z.string(),
    isLocked: z.boolean().default(false),
    project: z.string().optional(),
    createdBy: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
})

export const createInvoiceSchema = z.object({
    type: z.enum(['sent', 'received']),
    client: z.string().min(1, 'Cliente es requerido'),
    provider: z.string().optional(),
    total: z.number().min(0, 'Total debe ser mayor a 0'),
    subtotal: z.number().optional(),
    tax: z.number().optional(),
    description: z.string().optional(),
    dueDate: z.string(),
    issueDate: z.string().optional(),
    project: z.string().optional(),
})

export const invoiceSummarySchema = z.object({
    total: z.number(),
    sent: z.number(),
    received: z.number(),
    draft: z.number(),
    paid: z.number(),
    overdue: z.number(),
    cancelled: z.number(),
    totalAmount: z.number(),
    paidAmount: z.number(),
    pendingAmount: z.number(),
})

// Payments - Pagos
export const paymentSchema = z.object({
    _id: z.string(),
    paymentNumber: z.string(),
    type: z.enum(['income', 'expense']),
    status: z.enum(['pending', 'completed', 'failed', 'cancelled']),
    method: z.enum(['cash', 'bank_transfer', 'check', 'credit_card', 'debit_card', 'transfer', 'other']),
    amount: z.number(),
    description: z.string(),
    category: z.string().optional(),
    paymentDate: z.string(),
    account: z.string(),
    invoice: z.string().optional(),
    notes: z.string().optional(),
    attachments: z.array(z.string()).optional(),
    currency: z.string().optional(),
    isLocked: z.boolean().default(false),
    createdBy: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
})

export const createPaymentSchema = z.object({
    type: z.enum(['income', 'expense']),
    method: z.enum(['cash', 'bank_transfer', 'check', 'credit_card', 'debit_card', 'transfer', 'other']),
    amount: z.number().min(0, 'Monto debe ser mayor a 0'),
    description: z.string().min(1, 'Descripción es requerida'),
    category: z.string().optional(),
    paymentDate: z.string(),
    account: z.string().min(1, 'Cuenta es requerida'),
    invoice: z.string().optional(),
    notes: z.string().optional(),
    attachments: z.array(z.string()).optional(),
    currency: z.string().optional(),
})

export const paymentSummarySchema = z.object({
    total: z.number(),
    income: z.number(),
    expense: z.number(),
    pending: z.number(),
    completed: z.number(),
    failed: z.number(),
    cancelled: z.number(),
    totalAmount: z.number(),
    incomeAmount: z.number(),
    expenseAmount: z.number(),
})

// Financial Reports - Reportes Financieros
export const dashboardSchema = z.object({
    totalIncome: z.number(),
    totalExpenses: z.number(),
    netIncome: z.number(),
    totalInvoices: z.number(),
    pendingInvoices: z.number(),
    overdueInvoices: z.number(),
    totalPayments: z.number(),
    accountsBalance: z.number(),
    monthlyIncome: z.array(z.object({
        month: z.string(),
        income: z.number(),
        expenses: z.number(),
    })),
    topClients: z.array(z.object({
        name: z.string(),
        amount: z.number(),
        invoices: z.number(),
    })),
    expensesByCategory: z.array(z.object({
        category: z.string(),
        amount: z.number(),
        percentage: z.number(),
    })),
})

export const cashFlowSchema = z.object({
    period: z.object({
        year: z.number(),
        month: z.number(),
        startDate: z.string(),
        endDate: z.string(),
    }),
    inflows: z.array(z.object({
        date: z.string(),
        amount: z.number(),
        description: z.string(),
        type: z.string(),
    })),
    outflows: z.array(z.object({
        date: z.string(),
        amount: z.number(),
        description: z.string(),
        type: z.string(),
    })),
    summary: z.object({
        totalInflows: z.number(),
        totalOutflows: z.number(),
        netCashFlow: z.number(),
    }),
})

export const accountsReceivableSchema = z.object({
    aging: z.object({
        current: z.number(),
        days30: z.number(),
        days60: z.number(),
        days90: z.number(),
        over90: z.number(),
    }),
    invoices: z.array(z.object({
        _id: z.string(),
        invoiceNumber: z.string(),
        client: z.string(),
        amount: z.number(),
        dueDate: z.string(),
        daysOverdue: z.number(),
        aging: z.string(),
    })),
    totalReceivable: z.number(),
})

export const clientProfitabilitySchema = z.object({
    clients: z.array(z.object({
        name: z.string(),
        totalInvoiced: z.number(),
        totalPaid: z.number(),
        totalPending: z.number(),
        invoiceCount: z.number(),
        avgPaymentDays: z.number(),
        profitMargin: z.number(),
    })),
    summary: z.object({
        totalClients: z.number(),
        totalRevenue: z.number(),
        avgProfitMargin: z.number(),
    }),
})

export const incomeProjectionSchema = z.object({
    currentMonth: z.object({
        projected: z.number(),
        actual: z.number(),
        remaining: z.number(),
        percentComplete: z.number(),
    }),
    nextMonths: z.array(z.object({
        month: z.string(),
        year: z.number(),
        projected: z.number(),
        confirmedInvoices: z.number(),
        pendingInvoices: z.number(),
    })),
    summary: z.object({
        totalProjected: z.number(),
        confidence: z.number(),
    }),
})

export const expenseAnalysisSchema = z.object({
    byCategory: z.array(z.object({
        category: z.string(),
        amount: z.number(),
        percentage: z.number(),
        trend: z.number(),
    })),
    monthly: z.array(z.object({
        month: z.string(),
        year: z.number(),
        amount: z.number(),
    })),
    summary: z.object({
        totalExpenses: z.number(),
        avgMonthly: z.number(),
        trend: z.number(),
    }),
})

export const periodSummarySchema = z.object({
    period: financialPeriodSchema,
    invoicesCount: z.number(),
    paymentsCount: z.number(),
    totalIncome: z.number(),
    totalExpenses: z.number(),
    netIncome: z.number(),
    pendingInvoices: z.number(),
    overdueInvoices: z.number(),
})

// Monthly Report Schema for existing exports functionality
export const monthlyReportDataSchema = z.object({
    period: financialPeriodSchema,
    summary: z.object({
        totalIncome: z.number(),
        totalExpenses: z.number(),
        netProfit: z.number(),
        profitMargin: z.number(),
    }),
    incomeByCategory: z.array(z.object({
        category: z.string(),
        amount: z.number(),
        percentage: z.number(),
    })),
    expensesByCategory: z.array(z.object({
        category: z.string(),
        amount: z.number(),
        percentage: z.number(),
    })),
    invoices: z.object({
        total: z.number(),
        paid: z.number(),
        pending: z.number(),
        overdue: z.number(),
        details: z.array(invoiceSchema),
    }),
    payments: z.array(paymentSchema),
    accounts: z.array(accountSchema),
})

export const availableReportSchema = z.object({
    year: z.number(),
    month: z.number(),
    monthName: z.string(),
    periodId: z.string(),
    hasData: z.boolean(),
    totalIncome: z.number(),
    totalExpenses: z.number(),
    netProfit: z.number(),
})

// Exported Types
export type FinancialPeriod = z.infer<typeof financialPeriodSchema>
export type PeriodSummary = z.infer<typeof periodSummarySchema>

export type Account = z.infer<typeof accountSchema>
export type CreateAccountForm = z.infer<typeof createAccountSchema>
export type AccountMovement = z.infer<typeof accountMovementSchema>
export type TransferForm = z.infer<typeof transferSchema>

export type Invoice = z.infer<typeof invoiceSchema>
export type CreateInvoiceForm = z.infer<typeof createInvoiceSchema>
export type InvoiceSummary = z.infer<typeof invoiceSummarySchema>

export type Payment = z.infer<typeof paymentSchema>
export type CreatePaymentForm = z.infer<typeof createPaymentSchema>
export type PaymentSummary = z.infer<typeof paymentSummarySchema>

export type FinancialDashboard = z.infer<typeof dashboardSchema>
export type CashFlow = z.infer<typeof cashFlowSchema>
export type AccountsReceivable = z.infer<typeof accountsReceivableSchema>
export type ClientProfitability = z.infer<typeof clientProfitabilitySchema>
export type IncomeProjection = z.infer<typeof incomeProjectionSchema>
export type ExpenseAnalysis = z.infer<typeof expenseAnalysisSchema>

export type MonthlyReportData = z.infer<typeof monthlyReportDataSchema>
export type AvailableReport = z.infer<typeof availableReportSchema>

/** Client Management - Sistema de Clientes */

// Client Types
export const clientSchema = z.object({
    _id: z.string(),
    name: z.string(),
    type: z.enum(['individual', 'company', 'government']),
    status: z.enum(['active', 'inactive', 'blocked']),
    email: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    taxId: z.string().optional(),
    contactPerson: z.string().optional(),
    notes: z.string().optional(),
    totalDebt: z.number(),
    totalPaid: z.number(),
    creditLimit: z.number().optional(),
    paymentTerms: z.number(),
    createdBy: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
})

export const createClientSchema = z.object({
    name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(100, 'Nombre no puede exceder 100 caracteres'),
    type: z.enum(['individual', 'company', 'government']),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string().min(7, 'Teléfono debe tener al menos 7 caracteres').max(20, 'Teléfono no puede exceder 20 caracteres').optional().or(z.literal('')),
    address: z.string().optional(),
    taxId: z.string().min(5, 'Documento fiscal debe tener al menos 5 caracteres').max(20, 'Documento fiscal no puede exceder 20 caracteres').optional().or(z.literal('')),
    contactPerson: z.string().optional(),
    notes: z.string().optional(),
    creditLimit: z.number().min(0, 'Límite de crédito debe ser mayor o igual a 0').optional(),
    paymentTerms: z.number().min(1, 'Términos de pago deben ser al menos 1 día').max(365, 'Términos de pago no pueden exceder 365 días'),
})

export const clientSummarySchema = z.object({
    client: clientSchema,
    debts: z.object({
        total: z.number(),
        pending: z.number(),
        partial: z.number(),
        overdue: z.number(),
        paid: z.number(),
        totalAmount: z.number(),
        paidAmount: z.number(),
        remainingAmount: z.number(),
    }),
    recentPayments: z.array(z.any()),
    creditUtilization: z.number(),
})

export const clientStatsSchema = z.object({
    totalClients: z.number(),
    activeClients: z.number(),
    inactiveClients: z.number(),
    clientsByType: z.array(z.object({
        _id: z.string(),
        count: z.number(),
    })),
    totalDebt: z.number(),
    totalPaid: z.number(),
    averagePaymentTerms: z.number(),
})

/** Debt Management - Sistema de Deudas */

// Debt Types
// Esquema para información de interés mensual
export const interestInfoSchema = z.object({
    monthsOverdue: z.number(),
    monthlyInterestRate: z.number(),
    interestAmount: z.number(),
    totalWithInterest: z.number(),
    isOverdue: z.boolean()
})

export const debtSchema = z.object({
    _id: z.string(),
    debtNumber: z.string(),
    client: z.union([z.string(), clientSchema.pick({ _id: true, name: true, email: true, type: true })]),
    description: z.string(),
    totalAmount: z.number(),
    paidAmount: z.number(),
    remainingAmount: z.number(),
    status: z.enum(['pending', 'partial', 'paid', 'overdue', 'cancelled']),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    dueDate: z.string(),
    issueDate: z.string(),
    notificationDate: z.string().optional(),
    paymentTerms: z.number(),
    interestRate: z.number().optional(),
    notes: z.string().optional(),
    attachments: z.array(z.string()),
    emailNotifications: z.boolean(),
    createdBy: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    interestInfo: interestInfoSchema.optional(), // Nueva información de interés mensual
})

export const createDebtSchema = z.object({
    client: z.string().min(1, 'Cliente es requerido'),
    description: z.string().min(5, 'Descripción debe tener al menos 5 caracteres').max(500, 'Descripción no puede exceder 500 caracteres'),
    totalAmount: z.number().min(0.01, 'Monto debe ser mayor a 0'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    dueDate: z.string().min(1, 'Fecha de vencimiento es requerida'),
    paymentTerms: z.number().min(1, 'Términos de pago deben ser al menos 1 día').max(365, 'Términos de pago no pueden exceder 365 días'),
    interestRate: z.number().min(0, 'Tasa de interés debe ser mayor o igual a 0').max(100, 'Tasa de interés no puede exceder 100%'),
    notes: z.string().optional(),
    emailNotifications: z.boolean(),
})

export const debtStatsSchema = z.object({
    totalDebts: z.number(),
    overdueCount: z.number(),
    debtsByStatus: z.array(z.object({
        _id: z.string(),
        count: z.number(),
        amount: z.number(),
    })),
    totalAmount: z.object({
        total: z.number(),
        remaining: z.number(),
        paid: z.number(),
    }),
    averageAmount: z.number(),
    collectionRate: z.string(),
})

/** Debt Payment - Sistema de Pagos de Deudas */

export const debtPaymentSchema = z.object({
    _id: z.string(),
    paymentNumber: z.string(),
    debt: z.union([z.string(), debtSchema.pick({ _id: true, debtNumber: true, description: true })]),
    client: z.union([z.string(), clientSchema.pick({ _id: true, name: true, email: true })]),
    amount: z.number(),
    status: z.enum(['pending', 'completed', 'failed', 'cancelled']),
    method: z.enum(['cash', 'bank_transfer', 'check', 'credit_card', 'debit_card', 'other']),
    paymentDate: z.string(),
    account: z.string(),
    description: z.string().optional(),
    attachments: z.array(z.string()),
    notes: z.string().optional(),
    createdBy: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
})

export const createDebtPaymentSchema = z.object({
    debt: z.string().min(1, 'Deuda es requerida'),
    amount: z.number().min(0.01, 'Monto debe ser mayor a 0'),
    method: z.enum(['cash', 'bank_transfer', 'check', 'credit_card', 'debit_card', 'other']),
    account: z.string().min(1, 'Cuenta es requerida'),
    paymentDate: z.string().optional(),
    description: z.string().optional(),
    notes: z.string().optional(),
})

// Exported Types
export type Client = z.infer<typeof clientSchema>
export type CreateClientForm = z.infer<typeof createClientSchema>
export type ClientSummary = z.infer<typeof clientSummarySchema>
export type ClientStats = z.infer<typeof clientStatsSchema>

export type InterestInfo = z.infer<typeof interestInfoSchema>
export type Debt = z.infer<typeof debtSchema>
export type CreateDebtForm = z.infer<typeof createDebtSchema>
export type DebtStats = z.infer<typeof debtStatsSchema>

export type DebtPayment = z.infer<typeof debtPaymentSchema>
export type CreateDebtPaymentForm = z.infer<typeof createDebtPaymentSchema>


