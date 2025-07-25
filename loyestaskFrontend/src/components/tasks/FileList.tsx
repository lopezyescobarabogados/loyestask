import { useState, useCallback, useEffect } from 'react'
import { 
    DocumentIcon, 
    ArrowDownTrayIcon, 
    TrashIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteFile, downloadFile, replaceFile } from '@/api/FileAPI'
import { toast } from 'react-toastify'
import type { TaskFile, Project, Task } from '@/types/index'

interface FileListProps {
    files: TaskFile[]
    projectId: Project['_id']
    taskId: Task['_id']
    canEdit?: boolean
    className?: string
}

interface FileItemProps {
    file: TaskFile
    projectId: Project['_id']
    taskId: Task['_id']
    canEdit?: boolean
    onFileUpdated: () => void
}

// Componente para un archivo individual con gestión mejorada de errores
function FileItem({ file, projectId, taskId, canEdit = true, onFileUpdated }: FileItemProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [isReplacing, setIsReplacing] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [operationError, setOperationError] = useState<string>('')
    const queryClient = useQueryClient()

    // Limpiar errores automáticamente después de 5 segundos
    useEffect(() => {
        if (operationError) {
            const timer = setTimeout(() => {
                setOperationError('')
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [operationError])

    // Función de invalidación optimizada con mejor manejo de errores
    const invalidateRelatedQueries = useCallback(async () => {
        const queries = [
            queryClient.invalidateQueries({ queryKey: ['taskFiles', projectId, taskId] }),
            queryClient.invalidateQueries({ queryKey: ['task', taskId] })
        ]

        const results = await Promise.allSettled(queries)
        const failures = results.filter(result => result.status === 'rejected')
        
        if (failures.length > 0) {
            console.error('Some queries failed to invalidate:', failures)
            throw new Error('Error al actualizar la vista')
        }
    }, [queryClient, projectId, taskId])

    // Mutación para eliminar archivo con mejor gestión de errores
    const deleteMutation = useMutation({
        mutationFn: deleteFile,
        onMutate: () => {
            setIsDeleting(true)
            setOperationError('')
        },
        onSuccess: async () => {
            try {
                toast.success('Archivo eliminado correctamente')
                await invalidateRelatedQueries()
                onFileUpdated()
            } catch (error) {
                console.error('Error in delete success handler:', error)
                const errorMsg = 'Error al actualizar la vista después de eliminar'
                setOperationError(errorMsg)
                toast.error(errorMsg)
            }
        },
        onError: (error: Error) => {
            const errorMessage = error.message || 'Error al eliminar archivo'
            setOperationError(errorMessage)
            toast.error(errorMessage)
        },
        onSettled: () => {
            setIsDeleting(false)
            setShowDeleteConfirm(false)
        }
    })

    // Mutación para reemplazar archivo con validación mejorada
    const replaceMutation = useMutation({
        mutationFn: replaceFile,
        onMutate: () => {
            setIsReplacing(true)
            setOperationError('')
        },
        onSuccess: async () => {
            try {
                toast.success('Archivo reemplazado correctamente')
                await invalidateRelatedQueries()
                onFileUpdated()
            } catch (error) {
                console.error('Error in replace success handler:', error)
                const errorMsg = 'Error al actualizar la vista después de reemplazar'
                setOperationError(errorMsg)
                toast.error(errorMsg)
            }
        },
        onError: (error: Error) => {
            const errorMessage = error.message || 'Error al reemplazar archivo'
            setOperationError(errorMessage)
            toast.error(errorMessage)
        },
        onSettled: () => setIsReplacing(false)
    })

    // Función para formatear el tamaño de archivos con validación
    const formatFileSize = (bytes: number): string => {
        if (!bytes || bytes === 0) return '0 Bytes'
        if (typeof bytes !== 'number' || isNaN(bytes)) return 'Tamaño desconocido'
        
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // Función para obtener icono con fallback seguro
    const getFileIcon = (mimeType: string) => {
        if (!mimeType || typeof mimeType !== 'string') return '📄'
        
        const iconMap: Record<string, string> = {
            'application/pdf': '📄',
            'application/msword': '📝',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
            'application/vnd.ms-excel': '📊',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
            'image/jpeg': '🖼️',
            'image/png': '🖼️',
            'image/gif': '🖼️',
            'image/webp': '🖼️',
            'text/plain': '📄',
            'application/zip': '🗜️',
            'application/x-zip-compressed': '🗜️',
        }
        return iconMap[mimeType.toLowerCase()] || '📄'
    }

    // Función para formatear fecha con validación
    const formatDate = (dateString: string | Date): string => {
        if (!dateString) return 'Fecha desconocida'
        
        try {
            const date = new Date(dateString)
            if (isNaN(date.getTime())) return 'Fecha inválida'
            return date.toLocaleDateString('es-ES')
        } catch {
            return 'Fecha inválida'
        }
    }

    // Función de descarga mejorada con validación y cleanup
    const handleDownload = async () => {
        try {
            setOperationError('')
            const response = await downloadFile({ projectId, taskId, fileId: file._id })
            
            if (!response?.data) {
                throw new Error('No se recibieron datos del archivo')
            }
            
            // Crear URL del blob y descargar con cleanup automático
            const blob = new Blob([response.data])
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            
            link.href = url
            link.download = file.originalName || `archivo_${file._id}`
            link.style.display = 'none'
            
            document.body.appendChild(link)
            link.click()
            
            // Cleanup inmediato
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
            
            toast.success('Archivo descargado correctamente')
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al descargar el archivo'
            setOperationError(errorMessage)
            toast.error(errorMessage)
        }
    }

    const handleDelete = () => {
        if (!file?._id) {
            setOperationError('ID de archivo inválido')
            return
        }
        deleteMutation.mutate({ projectId, taskId, fileId: file._id })
    }

    const handleReplace = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newFile = event.target.files?.[0]
        if (!newFile) return
        
        if (!file?._id) {
            setOperationError('ID de archivo inválido')
            return
        }

        // Validar tamaño del archivo (50MB máximo)
        const maxSize = 50 * 1024 * 1024
        if (newFile.size > maxSize) {
            const errorMsg = 'El archivo es demasiado grande (máximo 50MB)'
            setOperationError(errorMsg)
            toast.error(errorMsg)
            return
        }

        replaceMutation.mutate({ 
            projectId, 
            taskId, 
            fileId: file._id, 
            file: newFile 
        })
    }

    return (
        <div className="space-y-2">
            {/* Mensaje de error si existe */}
            {operationError && (
                <div className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center space-x-2">
                        <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-700">{operationError}</span>
                    </div>
                    <button
                        onClick={() => setOperationError('')}
                        className="text-red-400 hover:text-red-600"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Elemento de archivo */}
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {file.originalName || 'Archivo sin nombre'}
                        </p>
                        <p className="text-xs text-gray-500">
                            {formatFileSize(file.fileSize)} • {formatDate(file.uploadedAt)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                    {/* Botón de descarga */}
                    <button
                        onClick={handleDownload}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Descargar archivo"
                        disabled={isDeleting || isReplacing}
                    >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>

                    {canEdit && (
                        <>
                            {/* Botón de reemplazo mejorado */}
                            <label className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors cursor-pointer">
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleReplace}
                                    disabled={isReplacing || isDeleting}
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.txt,.zip"
                                />
                                {isReplacing ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full" />
                                ) : (
                                    <ArrowPathIcon className="h-4 w-4" title="Reemplazar archivo" />
                                )}
                            </label>

                            {/* Botón de eliminación mejorado */}
                            {showDeleteConfirm ? (
                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="p-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Confirmar eliminación"
                                    >
                                        {isDeleting ? '...' : '✓'}
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        disabled={isDeleting}
                                        className="p-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                                        title="Cancelar"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={isDeleting || isReplacing}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Eliminar archivo"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

// Componente principal de lista de archivos
export default function FileList({ files, projectId, taskId, canEdit = true, className = '' }: FileListProps) {
    const [refreshKey, setRefreshKey] = useState(0)

    const handleFileUpdated = () => {
        setRefreshKey(prev => prev + 1)
    }

    if (!files || files.length === 0) {
        return (
            <div className={`text-center py-8 ${className}`}>
                <DocumentIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-sm text-gray-500">No hay archivos adjuntos</p>
            </div>
        )
    }

    const totalSize = files.reduce((sum, file) => sum + file.fileSize, 0)
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Encabezado con estadísticas */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">
                    Archivos adjuntos ({files.length})
                </h3>
                <span className="text-xs text-gray-500">
                    Total: {formatFileSize(totalSize)}
                </span>
            </div>

            {/* Lista de archivos */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
                {files.map((file) => (
                    <FileItem
                        key={`${file._id}-${refreshKey}`}
                        file={file}
                        projectId={projectId}
                        taskId={taskId}
                        canEdit={canEdit}
                        onFileUpdated={handleFileUpdated}
                    />
                ))}
            </div>

            {/* Advertencia si hay muchos archivos */}
            {files.length > 15 && (
                <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                    <p className="text-sm text-yellow-700">
                        Muchos archivos pueden afectar el rendimiento. Considera organizar en carpetas.
                    </p>
                </div>
            )}
        </div>
    )
}
