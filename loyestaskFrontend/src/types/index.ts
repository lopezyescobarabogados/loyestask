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
