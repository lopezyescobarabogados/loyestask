import { isAxiosError } from "axios"
import api from "@/lib/axios"
import { taskSchema } from "@/types/index";
import type { TaskFormData, Project, Task, Collaborator } from "@/types/index";

type TaskAPI = {
    formData: TaskFormData
    projectId: Project['_id']
    taskId: Task['_id']
    status: Task['status']
}

export async function createTask({formData, projectId} :  Pick<TaskAPI, 'formData' | 'projectId'>) {
    try {
        const url = `/projects/${projectId}/tasks`
        const { data } = await api.post<string>(url, formData)
        return data
    } catch (error) {
        if(isAxiosError(error) && error.response){
            throw new Error(error.response.data.error)
        }
    }
}

export async function getTaskById({projectId, taskId} : Pick<TaskAPI, 'projectId' | 'taskId'>) {
    try {
        const url = `/projects/${projectId}/tasks/${taskId}`
        const { data } = await api(url)
        const response = taskSchema.safeParse(data)
        if(response.success) {
            return response.data
        } else {
            throw new Error("Error al obtener la tarea")
        }
    } catch (error) {
        if(isAxiosError(error) && error.response){
            throw new Error(error.response.data.error)
        }
        throw new Error("Error de conexión al obtener la tarea")
    }
}

export async function updateTask({projectId, taskId, formData} : Pick<TaskAPI, 'projectId' | 'taskId'| 'formData' >) {
    try {
        const url = `/projects/${projectId}/tasks/${taskId}`
        const { data } = await api.put<string>(url, formData)
        return data
    } catch (error) {
        if(isAxiosError(error) && error.response){
            throw new Error(error.response.data.error)
        }
    }
}

export async function deleteTask({projectId, taskId} : Pick<TaskAPI, 'projectId' | 'taskId'>) {
    try {
        const url = `/projects/${projectId}/tasks/${taskId}`
        const { data } = await api.delete<string>(url)
        return data
    } catch (error) {
        if(isAxiosError(error) && error.response){
            throw new Error(error.response.data.error)
        }
    }
}

// Colaboradores: asignar
export async function addCollaborator({ projectId, taskId, userId }: { projectId: string, taskId: string, userId: string }) {
    try {
        const url = `/projects/${projectId}/tasks/${taskId}/collaborators`;
        const { data } = await api.post(url, { userId });
        return data;
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            const errorData = error.response.data;
            
            // Manejar diferentes formatos de error del backend
            let errorMessage = 'Error al asignar colaborador';
            
            if (errorData.error) {
                // Formato: { error: "mensaje" }
                errorMessage = errorData.error;
            } else if (errorData.errors && Array.isArray(errorData.errors)) {
                // Formato: { errors: [{ msg: "mensaje" }] }
                errorMessage = errorData.errors.map((err: { msg?: string; message?: string } | string) => {
                    if (typeof err === 'string') return err;
                    return err.msg || err.message || 'Error de validación';
                }).join(', ');
            } else if (errorData.message) {
                // Formato: { message: "mensaje" }
                errorMessage = errorData.message;
            }
            
            throw new Error(errorMessage);
        }
        throw new Error('Error de conexión al asignar colaborador');
    }
}

// Colaboradores: eliminar
export async function removeCollaborator({ projectId, taskId, userId }: { projectId: string, taskId: string, userId: string }) {
    try {
        const url = `/projects/${projectId}/tasks/${taskId}/collaborators/${userId}`;
        const { data } = await api.delete(url);
        return data;
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            throw new Error(error.response.data.error);
        }
        throw new Error('Error al eliminar colaborador');
    }
}

// Colaboradores: listar disponibles
export async function getAvailableCollaborators({ projectId, taskId }: { projectId: string, taskId: string }) {
    try {
        const url = `/projects/${projectId}/tasks/${taskId}/collaborators/available`;
        const { data } = await api.get<Collaborator[]>(url);
        return data;
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            throw new Error(error.response.data.error);
        }
        throw new Error('Error al obtener colaboradores disponibles');
    }
}

export async function updateStatus({projectId, taskId, status} : Pick<TaskAPI, 'projectId' | 'taskId' | 'status'>) {
    try {
        const url = `/projects/${projectId}/tasks/${taskId}/status`
        const { data } = await api.post<string>(url, {status})
        return data
    } catch (error) {
        if(isAxiosError(error) && error.response){
            throw new Error(error.response.data.error)
        }
    }
} 