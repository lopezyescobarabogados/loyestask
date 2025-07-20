import { isAxiosError } from 'axios'
import api from '@/lib/axios'
import type { User, UserRegistrationAdminForm, UserUpdateForm } from '../types'

export async function createUser(formData: UserRegistrationAdminForm) {
    try {
        const { data } = await api.post<string>('/users', formData)
        return data
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            throw new Error(error.response.data.error)
        }
    }
}

export async function getAllUsers() {
    try {
        const { data } = await api.get<User[]>('/users')
        return data
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            throw new Error(error.response.data.error)
        }
    }
}

export async function getUserById(userId: User['_id']) {
    try {
        const { data } = await api.get<User>(`/users/${userId}`)
        return data
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            throw new Error(error.response.data.error)
        }
    }
}

export async function updateUser({ userId, formData }: { userId: User['_id'], formData: UserUpdateForm }) {
    try {
        const { data } = await api.put<string>(`/users/${userId}`, formData)
        return data
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            throw new Error(error.response.data.error)
        }
    }
}

export async function deleteUser(userId: User['_id']) {
    try {
        const { data } = await api.delete<string>(`/users/${userId}`)
        return data
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            throw new Error(error.response.data.error)
        }
    }
}

export async function changeUserPassword({ userId, password }: { userId: User['_id'], password: string }) {
    try {
        const { data } = await api.put<string>(`/users/${userId}/password`, { password })
        return data
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            throw new Error(error.response.data.error)
        }
    }
}
