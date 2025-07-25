import { useCallback } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { uploadFiles, deleteFile, replaceFile } from '@/api/FileAPI'
import type { Project, Task } from '@/types/index'

interface UseFileOperationsProps {
    projectId: Project['_id']
    taskId: Task['_id']
    onSuccess?: () => void
    onDeleteSuccess?: () => void
}

export const useFileOperations = ({ projectId, taskId, onSuccess, onDeleteSuccess }: UseFileOperationsProps) => {
    const queryClient = useQueryClient()

    // Invalidación optimizada y segura de queries
    const invalidateRelatedQueries = useCallback(async () => {
        try {
            // Priorizar invalidación de task (que incluye archivos) sobre taskFiles separados
            await queryClient.invalidateQueries({ 
                queryKey: ['task', taskId], 
                refetchType: 'none' // Solo marcar como stale para refetch manual
            })
            
            // Solo invalidar taskFiles si existe la query (para casos donde no se usan archivos del task)
            setTimeout(async () => {
                try {
                    const hasTaskFilesQuery = queryClient.getQueryData(['taskFiles', projectId, taskId])
                    if (hasTaskFilesQuery !== undefined) {
                        await queryClient.invalidateQueries({ 
                            queryKey: ['taskFiles', projectId, taskId],
                            refetchType: 'active' // Refetch inmediato solo para queries activas
                        })
                    }
                    
                    // Invalidar project solo si es necesario
                    await queryClient.invalidateQueries({ 
                        queryKey: ['project', projectId],
                        refetchType: 'none'
                    })
                } catch (error: unknown) {
                    console.warn('Background query invalidation failed:', error)
                }
            }, 300) // Reducir delay

            return true
        } catch (error: unknown) {
            console.error('Critical error in query invalidation:', error)
            return false
        }
    }, [queryClient, projectId, taskId])

    // Mutación de upload con manejo robusto
    const uploadMutation = useMutation({
        mutationFn: uploadFiles,
        retry: 1,
        retryDelay: 2000,
        onSuccess: async (data) => {
            const fileCount = data.files?.length || 0
            toast.success(`${fileCount} archivo(s) subido(s) correctamente`)
            
            // Invalidar queries sin esperar el resultado
            invalidateRelatedQueries().catch((error: unknown) => {
                console.warn('Query invalidation failed silently:', error)
            })
            
            onSuccess?.()
        },
        onError: (error: Error) => {
            console.error('Upload error:', error)
            const errorMessage = error.message || 'Error al subir archivos'
            toast.error(errorMessage)
        }
    })

    // Mutación de eliminación con confirmación
    const deleteMutation = useMutation({
        mutationFn: deleteFile,
        onSuccess: async () => {
            toast.success('Archivo eliminado correctamente')
            
            // Invalidar queries sin esperar el resultado
            invalidateRelatedQueries().catch((error: unknown) => {
                console.warn('Query invalidation failed silently:', error)
            })
            
            onDeleteSuccess?.()
        },
        onError: (error: Error) => {
            console.error('Delete error:', error)
            const errorMessage = error.message || 'Error al eliminar archivo'
            toast.error(errorMessage)
        }
    })

    // Mutación de reemplazo
    const replaceMutation = useMutation({
        mutationFn: replaceFile,
        onSuccess: async () => {
            toast.success('Archivo reemplazado correctamente')
            
            // Invalidar queries sin esperar el resultado
            invalidateRelatedQueries().catch((error: unknown) => {
                console.warn('Query invalidation failed silently:', error)
            })
            
            onSuccess?.()
        },
        onError: (error: Error) => {
            console.error('Replace error:', error)
            const errorMessage = error.message || 'Error al reemplazar archivo'
            toast.error(errorMessage)
        }
    })

    return {
        uploadMutation,
        deleteMutation,
        replaceMutation,
        invalidateRelatedQueries
    }
}
