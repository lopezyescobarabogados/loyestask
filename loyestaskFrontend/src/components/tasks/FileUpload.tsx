import { useState, useRef, useCallback } from 'react'
import { CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'

interface FileUploadProps {
    onFilesSelected: (files: FileList) => void
    isUploading?: boolean
    maxFiles?: number
    maxFileSize?: number
    allowedTypes?: string[]
    className?: string
}

// Tipos de archivo permitidos con iconos
const FILE_TYPES = {
    'application/pdf': { icon: '📄', color: 'text-red-500' },
    'application/msword': { icon: '📝', color: 'text-blue-500' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: '📝', color: 'text-blue-500' },
    'application/vnd.ms-excel': { icon: '📊', color: 'text-green-500' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: '📊', color: 'text-green-500' },
    'image/jpeg': { icon: '🖼️', color: 'text-purple-500' },
    'image/png': { icon: '🖼️', color: 'text-purple-500' },
    'image/gif': { icon: '🖼️', color: 'text-purple-500' },
    'text/plain': { icon: '📄', color: 'text-gray-500' },
    'application/zip': { icon: '🗜️', color: 'text-yellow-500' },
    'default': { icon: '📄', color: 'text-gray-500' }
}

export default function FileUpload({
    onFilesSelected,
    isUploading = false,
    maxFiles = 20,
    maxFileSize = 50 * 1024 * 1024, // 50MB
    allowedTypes = [],
    className = ''
}: FileUploadProps) {
    const [isDragOver, setIsDragOver] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const validateFiles = useCallback((files: FileList): File[] => {
        const validFiles: File[] = []
        const errors: string[] = []

        Array.from(files).forEach(file => {
            // Validar tamaño
            if (file.size > maxFileSize) {
                errors.push(`${file.name}: Tamaño excede ${formatFileSize(maxFileSize)}`)
                return
            }

            // Validar tipo (si se especificaron tipos permitidos)
            if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
                errors.push(`${file.name}: Tipo de archivo no permitido`)
                return
            }

            validFiles.push(file)
        })

        // Validar cantidad total
        if (selectedFiles.length + validFiles.length > maxFiles) {
            errors.push(`Máximo ${maxFiles} archivos permitidos`)
            return []
        }

        if (errors.length > 0) {
            toast.error(errors.join('\n'))
        }

        return validFiles
    }, [maxFileSize, allowedTypes, selectedFiles.length, maxFiles])

    const handleFileSelection = useCallback((files: FileList) => {
        const validFiles = validateFiles(files)
        if (validFiles.length > 0) {
            const newFiles = [...selectedFiles, ...validFiles]
            setSelectedFiles(newFiles)
            
            // Crear FileList a partir del array
            const dataTransfer = new DataTransfer()
            newFiles.forEach(file => dataTransfer.items.add(file))
            onFilesSelected(dataTransfer.files)
        }
    }, [selectedFiles, validateFiles, onFilesSelected])

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
        const files = e.dataTransfer.files
        if (files.length > 0) {
            handleFileSelection(files)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) {
            handleFileSelection(files)
        }
    }

    const removeFile = (index: number) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index)
        setSelectedFiles(newFiles)
        
        if (newFiles.length === 0) {
            // Limpiar el input si no hay archivos
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        } else {
            // Actualizar FileList
            const dataTransfer = new DataTransfer()
            newFiles.forEach(file => dataTransfer.items.add(file))
            onFilesSelected(dataTransfer.files)
        }
    }

    const getFileIcon = (mimeType: string) => {
        return FILE_TYPES[mimeType as keyof typeof FILE_TYPES] || FILE_TYPES.default
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Drop Zone */}
            <div
                className={`
                    relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
                    ${isDragOver 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }
                    ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleInputChange}
                    disabled={isUploading}
                    accept={allowedTypes.join(',')}
                />
                
                <CloudArrowUpIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                
                <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium text-indigo-600">Haz clic para seleccionar</span> o arrastra archivos aquí
                </p>
                
                <p className="text-xs text-gray-500">
                    Máximo {maxFiles} archivos, {formatFileSize(maxFileSize)} por archivo
                </p>
                
                {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
                        <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                            <span className="text-sm text-gray-600">Subiendo archivos...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Lista de archivos seleccionados */}
            {selectedFiles.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">
                        Archivos seleccionados ({selectedFiles.length})
                    </h4>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                        {selectedFiles.map((file, index) => {
                            const fileInfo = getFileIcon(file.type)
                            return (
                                <div
                                    key={`${file.name}-${index}`}
                                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                                >
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                        <span className="text-lg">{fileInfo.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatFileSize(file.size)}
                                            </p>
                                        </div>
                                    </div>
                                    {!isUploading && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                removeFile(index)
                                            }}
                                            className="p-1 text-gray-400 hover:text-gray-600"
                                        >
                                            <XMarkIcon className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
