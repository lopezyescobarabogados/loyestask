import { isAxiosError } from "axios"
import api from "@/lib/axios"
import type { TaskFile, Project, Task } from "../types"

type FileAPI = {
    projectId: Project['_id']
    taskId: Task['_id']
    fileId: TaskFile['_id']
    files: FileList
    file: File
}

// Subir archivos a una tarea
export async function uploadFiles({ projectId, taskId, files }: Pick<FileAPI, 'projectId' | 'taskId' | 'files'>) {
    try {
        const formData = new FormData()
        Array.from(files).forEach(file => {
            formData.append('files', file)
        })
        
        const url = `/projects/${projectId}/tasks/${taskId}/files`
        const { data } = await api.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        return data
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            throw new Error(error.response.data.error || 'Error al subir archivos')
        }
        throw new Error('Error de conexión')
    }
}

// Obtener lista de archivos de una tarea
export async function getTaskFiles({ projectId, taskId }: Pick<FileAPI, 'projectId' | 'taskId'>) {
    try {
        const url = `/projects/${projectId}/tasks/${taskId}/files`
        const { data } = await api.get(url)
        return data
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            throw new Error(error.response.data.error || 'Error al obtener archivos')
        }
        throw new Error('Error de conexión')
    }
}

// Descargar un archivo específico
export async function downloadFile({ projectId, taskId, fileId }: Pick<FileAPI, 'projectId' | 'taskId' | 'fileId'>) {
    try {
        const url = `/projects/${projectId}/tasks/${taskId}/files/${fileId}/download`
        const response = await api.get(url, {
            responseType: 'blob'
        })
        return response
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            throw new Error(error.response.data.error || 'Error al descargar archivo')
        }
        throw new Error('Error de conexión')
    }
}

// Eliminar un archivo
export async function deleteFile({ projectId, taskId, fileId }: Pick<FileAPI, 'projectId' | 'taskId' | 'fileId'>) {
    try {
        const url = `/projects/${projectId}/tasks/${taskId}/files/${fileId}`
        const { data } = await api.delete(url)
        return data
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            throw new Error(error.response.data.error || 'Error al eliminar archivo')
        }
        throw new Error('Error de conexión')
    }
}

// Reemplazar un archivo
export async function replaceFile({ projectId, taskId, fileId, file }: Pick<FileAPI, 'projectId' | 'taskId' | 'fileId' | 'file'>) {
    try {
        const formData = new FormData()
        formData.append('file', file)
        
        const url = `/projects/${projectId}/tasks/${taskId}/files/${fileId}`
        const { data } = await api.put(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        return data
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            throw new Error(error.response.data.error || 'Error al reemplazar archivo')
        }
        throw new Error('Error de conexión')
    }
}

// Obtener estadísticas de archivos de una tarea
export async function getFileStats({ projectId, taskId }: Pick<FileAPI, 'projectId' | 'taskId'>) {
    try {
        const url = `/projects/${projectId}/tasks/${taskId}/files/stats`
        const { data } = await api.get(url)
        return data
    } catch (error) {
        if (isAxiosError(error) && error.response) {
            throw new Error(error.response.data.error || 'Error al obtener estadísticas')
        }
        throw new Error('Error de conexión')
    }
}
