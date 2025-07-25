import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PaperClipIcon, PlusIcon } from '@heroicons/react/24/outline'
import { getTaskFiles } from '@/api/FileAPI'
import { useFileOperations } from '@/hooks/useFileOperations'
import FileUpload from './FileUpload'
import FileList from './FileList'
import type { Project, Task, TaskFile } from '@/types/index'

interface FileManagerProps {
    projectId: Project['_id']
    taskId: Task['_id']
    canEdit?: boolean
    className?: string
    taskFiles?: TaskFile[] // Archivos del task si están disponibles
}

// Estados de carga mejorados
type UploadState = 'idle' | 'uploading' | 'success' | 'error'

export default function FileManager({ projectId, taskId, canEdit = true, className = '', taskFiles }: FileManagerProps) {
    const [isUploadMode, setIsUploadMode] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
    const [uploadState, setUploadState] = useState<UploadState>('idle')
    const [uploadError, setUploadError] = useState<string>('')

    // Hook personalizado para operaciones de archivos
    const { uploadMutation } = useFileOperations({
        projectId,
        taskId,
        onSuccess: () => {
            // Resetear estado después de operación exitosa
            setTimeout(() => {
                setIsUploadMode(false)
                setSelectedFiles(null)
                setUploadState('idle')
                setUploadError('')
            }, 500)
        }
    })

    // Query para obtener archivos de la tarea con manejo de errores mejorado
    // Solo hacer la query si no tenemos archivos del task ya disponibles
    const { 
        data: filesData, 
        isLoading, 
        error,
        refetch,
        isRefetching
    } = useQuery({
        queryKey: ['taskFiles', projectId, taskId],
        queryFn: () => getTaskFiles({ projectId, taskId }),
        retry: 3,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        staleTime: 5 * 60 * 1000, // 5 minutos
        gcTime: 10 * 60 * 1000, // 10 minutos
        enabled: !taskFiles, // Solo hacer query si no tenemos archivos del task
    })

    // Determinar qué archivos usar: del task o de la query separada
    const files = taskFiles || filesData?.files || []
    const isLoadingState = !taskFiles && (isLoading || isRefetching)

    // Manejo de estados de upload sincronizados con la mutación
    const handleUploadMutation = useCallback(() => {
        if (!selectedFiles || selectedFiles.length === 0) return

        setUploadState('uploading')
        setUploadError('')

        uploadMutation.mutate(
            {
                projectId,
                taskId,
                files: selectedFiles
            },
            {
                onSuccess: () => {
                    setUploadState('success')
                },
                onError: (error) => {
                    setUploadState('error')
                    setUploadError(error.message || 'Error al subir archivos')
                }
            }
        )
    }, [selectedFiles, uploadMutation, projectId, taskId])

    const handleFilesSelected = useCallback((files: FileList) => {
        setSelectedFiles(files)
        setUploadError('')
        setUploadState('idle')
    }, [])

    const handleCancelUpload = useCallback(() => {
        if (uploadState !== 'uploading') {
            setIsUploadMode(false)
            setSelectedFiles(null)
            setUploadState('idle')
            setUploadError('')
        }
    }, [uploadState])

    const handleRetryUpload = useCallback(() => {
        setUploadError('')
        setUploadState('idle')
        handleUploadMutation()
    }, [handleUploadMutation])

    if (error && !taskFiles) {
        return (
            <div className={`p-4 border border-red-200 rounded-lg bg-red-50 ${className}`}>
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-red-600 font-medium">
                            Error al cargar archivos
                        </p>
                        <p className="text-xs text-red-500 mt-1">
                            {error.message}
                        </p>
                    </div>
                    <button
                        onClick={() => refetch()}
                        disabled={isRefetching}
                        className="ml-3 text-sm text-red-700 hover:text-red-800 underline disabled:opacity-50"
                    >
                        {isRefetching ? 'Reintentando...' : 'Reintentar'}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Encabezado mejorado */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <PaperClipIcon className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-medium text-gray-900">
                        Archivos Adjuntos
                    </h3>
                    {isLoadingState && (
                        <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
                    )}
                    {uploadState === 'success' && (
                        <div className="flex items-center text-green-600">
                            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs">Actualizado</span>
                        </div>
                    )}
                </div>

                {canEdit && !isUploadMode && (
                    <button
                        onClick={() => setIsUploadMode(true)}
                        disabled={uploadState === 'uploading'}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Adjuntar archivos
                    </button>
                )}
            </div>

            {/* Modo de subida mejorado */}
            {isUploadMode && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="space-y-4">
                        {/* Componente de upload */}
                        <FileUpload
                            onFilesSelected={handleFilesSelected}
                            isUploading={uploadState === 'uploading'}
                            maxFiles={20}
                            maxFileSize={50 * 1024 * 1024} // 50MB
                        />
                        
                        {/* Mensaje de error en upload */}
                        {uploadState === 'error' && uploadError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{uploadError}</p>
                                        <div className="mt-2">
                                            <button
                                                onClick={handleRetryUpload}
                                                className="text-xs text-red-600 hover:text-red-800 underline"
                                            >
                                                Reintentar subida
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Botones de acción mejorados */}
                        {selectedFiles && selectedFiles.length > 0 && (
                            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                                <button
                                    onClick={handleCancelUpload}
                                    disabled={uploadState === 'uploading'}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploadState === 'uploading' ? 'Subiendo...' : 'Cancelar'}
                                </button>
                                <button
                                    onClick={handleUploadMutation}
                                    disabled={uploadState === 'uploading'}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploadState === 'uploading' ? (
                                        <div className="flex items-center">
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                                            Subiendo archivos...
                                        </div>
                                    ) : uploadState === 'error' ? (
                                        `Reintentar subida de ${selectedFiles.length} archivo(s)`
                                    ) : (
                                        `Subir ${selectedFiles.length} archivo(s)`
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Lista de archivos mejorada */}
            {!isLoadingState && (
                <div className="border border-gray-200 rounded-lg">
                    <div className="p-4">
                        <FileList
                            files={files}
                            projectId={projectId}
                            taskId={taskId}
                            canEdit={canEdit && uploadState !== 'uploading'}
                        />
                    </div>
                </div>
            )}

            {/* Estado de carga mejorado */}
            {isLoadingState && (
                <div className="border border-gray-200 rounded-lg p-8">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full mr-3" />
                        <span className="text-gray-600">
                            {isRefetching ? 'Actualizando archivos...' : 'Cargando archivos...'}
                        </span>
                    </div>
                </div>
            )}

            {/* Información adicional */}
            {files.length > 0 && !isUploadMode && (
                <div className="text-xs text-gray-500 space-y-1">
                    <p>• Máximo 20 archivos por tarea, 50MB por archivo</p>
                    <p>• Formatos soportados: PDF, Word, Excel, imágenes, archivos comprimidos y más</p>
                    <p>• Los archivos se almacenan de forma segura y solo son accesibles por miembros del proyecto</p>
                </div>
            )}
        </div>
    )
}
