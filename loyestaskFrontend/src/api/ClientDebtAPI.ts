import api from '@/lib/axios'
import { isAxiosError } from 'axios'
import type {
    Client,
    CreateClientForm,
    ClientSummary,
    ClientStats,
    Debt,
    CreateDebtForm,
    DebtStats,
    DebtPayment,
    CreateDebtPaymentForm
} from '@/types/index'

// ===== CLIENT MANAGEMENT API =====
export class ClientAPI {
    
    static async getAll(params?: {
        page?: number
        limit?: number
        type?: 'individual' | 'company' | 'government'
        status?: 'active' | 'inactive' | 'blocked'
        search?: string
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
    }) {
        try {
            const { data } = await api.get<{
                clients: Client[]
                totalPages: number
                currentPage: number
                total: number
            }>('/clients', { params })
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener clientes')
            }
            throw error
        }
    }

    static async getById(id: string) {
        try {
            const { data } = await api.get<Client>(`/clients/${id}`)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener cliente')
            }
            throw error
        }
    }

    static async create(clientData: CreateClientForm) {
        try {
            const { data } = await api.post<Client>('/clients', clientData)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al crear cliente')
            }
            throw error
        }
    }

    static async update(id: string, clientData: Partial<CreateClientForm>) {
        try {
            const { data } = await api.put<Client>(`/clients/${id}`, clientData)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al actualizar cliente')
            }
            throw error
        }
    }

    static async delete(id: string) {
        try {
            const { data } = await api.delete(`/clients/${id}`)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al eliminar cliente')
            }
            throw error
        }
    }

    static async updateStatus(id: string, status: 'active' | 'inactive' | 'blocked') {
        try {
            const { data } = await api.patch<Client>(`/clients/${id}/status`, { status })
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al actualizar estado del cliente')
            }
            throw error
        }
    }

    static async getSummary(id: string) {
        try {
            const { data } = await api.get<ClientSummary>(`/clients/${id}/summary`)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener resumen del cliente')
            }
            throw error
        }
    }

    static async getStats() {
        try {
            const { data } = await api.get<ClientStats>('/clients/stats')
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener estadísticas de clientes')
            }
            throw error
        }
    }

    static async search(query: string) {
        try {
            const { data } = await api.get<Client[]>(`/clients/search?q=${encodeURIComponent(query)}`)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al buscar clientes')
            }
            throw error
        }
    }
}

// ===== DEBT MANAGEMENT API =====
export class DebtAPI {
    
    static async getAll(params?: {
        page?: number
        limit?: number
        status?: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled'
        priority?: 'low' | 'medium' | 'high' | 'urgent'
        client?: string
        search?: string
        startDate?: string
        endDate?: string
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
    }) {
        try {
            const { data } = await api.get<{
                debts: Debt[]
                totalPages: number
                currentPage: number
                total: number
            }>('/debts', { params })
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener deudas')
            }
            throw error
        }
    }

    static async getById(id: string) {
        try {
            const { data } = await api.get<Debt>(`/debts/${id}`)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener deuda')
            }
            throw error
        }
    }

    static async create(debtData: CreateDebtForm) {
        try {
            const { data } = await api.post<Debt>('/debts', debtData)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al crear deuda')
            }
            throw error
        }
    }

    static async update(id: string, debtData: Partial<CreateDebtForm>) {
        try {
            const { data } = await api.put<Debt>(`/debts/${id}`, debtData)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al actualizar deuda')
            }
            throw error
        }
    }

    static async delete(id: string) {
        try {
            const { data } = await api.delete(`/debts/${id}`)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al eliminar deuda')
            }
            throw error
        }
    }

    static async updateStatus(id: string, status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled') {
        try {
            const { data } = await api.patch<Debt>(`/debts/${id}/status`, { status })
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al actualizar estado de la deuda')
            }
            throw error
        }
    }

    static async updatePriority(id: string, priority: 'low' | 'medium' | 'high' | 'urgent') {
        try {
            const { data } = await api.patch<Debt>(`/debts/${id}/priority`, { priority })
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al actualizar prioridad de la deuda')
            }
            throw error
        }
    }

    static async getStats(params?: {
        startDate?: string
        endDate?: string
        client?: string
    }) {
        try {
            const { data } = await api.get<DebtStats>('/debts/stats', { params })
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener estadísticas de deudas')
            }
            throw error
        }
    }

    static async getOverdue() {
        try {
            const { data } = await api.get<Debt[]>('/debts/overdue')
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener deudas vencidas')
            }
            throw error
        }
    }

    static async sendNotification(id: string) {
        try {
            const { data } = await api.post(`/debts/${id}/notify`)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al enviar notificación')
            }
            throw error
        }
    }

    // Pagos de deudas
    static async getPayments(debtId: string, params?: {
        page?: number
        limit?: number
        status?: string
    }) {
        try {
            const { data } = await api.get<{
                payments: DebtPayment[]
                totalPages: number
                currentPage: number
                total: number
            }>(`/debts/${debtId}/payments`, { params })
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener pagos de la deuda')
            }
            throw error
        }
    }

    static async createPayment(debtId: string, paymentData: CreateDebtPaymentForm) {
        try {
            const { data } = await api.post<DebtPayment>(`/debts/${debtId}/payments`, paymentData)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al crear pago de deuda')
            }
            throw error
        }
    }

    static async getPaymentById(debtId: string, paymentId: string) {
        try {
            const { data } = await api.get<DebtPayment>(`/debts/${debtId}/payments/${paymentId}`)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al obtener pago de deuda')
            }
            throw error
        }
    }

    static async updatePayment(debtId: string, paymentId: string, paymentData: Partial<CreateDebtPaymentForm>) {
        try {
            const { data } = await api.put<DebtPayment>(`/debts/${debtId}/payments/${paymentId}`, paymentData)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al actualizar pago de deuda')
            }
            throw error
        }
    }

    static async deletePayment(debtId: string, paymentId: string) {
        try {
            const { data } = await api.delete(`/debts/${debtId}/payments/${paymentId}`)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al eliminar pago de deuda')
            }
            throw error
        }
    }

    // Upload files for debts
    static async uploadAttachment(debtId: string, file: File) {
        try {
            const formData = new FormData()
            formData.append('file', file)
            
            const { data } = await api.post(`/debts/${debtId}/attachments`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al subir archivo adjunto')
            }
            throw error
        }
    }

    static async deleteAttachment(debtId: string, attachmentId: string) {
        try {
            const { data } = await api.delete(`/debts/${debtId}/attachments/${attachmentId}`)
            return data
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                throw new Error(error.response.data.error || 'Error al eliminar archivo adjunto')
            }
            throw error
        }
    }
}

// Exportar por defecto un objeto con ambas APIs
export default {
    ClientAPI,
    DebtAPI
}
