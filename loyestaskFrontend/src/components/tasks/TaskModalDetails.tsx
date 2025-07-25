import { Fragment, useEffect } from 'react';
import { Dialog, Transition, DialogPanel, DialogTitle, TransitionChild } from '@headlessui/react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTaskById, updateStatus } from '@/api/TaskAPI';
import { toast } from 'react-toastify';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { statusTranslations } from '@/locales/es';
import type { TaskStatus } from '@/types/index';
import NotesPanel from '../notes/NotesPanel';
import FileManager from './FileManager';
import TaskDataDebug from '../debug/TaskDataDebug';

export default function TaskModalDetails() {
    const params = useParams()
    const projectId = params.projectId!
    const navigate = useNavigate()
    const location = useLocation()
    const queryParams = new URLSearchParams(location.search)
    const taskId = queryParams.get('viewTask')!
    const show = taskId ? true : false
    
    const { data, isError, error, isLoading } = useQuery({
        queryKey: ['task', taskId],
        queryFn: () => getTaskById({ projectId, taskId }),
        enabled: !!taskId,
        retry: 3,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        staleTime: 5 * 60 * 1000, // 5 minutos
        refetchOnWindowFocus: false, // Evitar refetch automático que puede causar errores
        refetchOnReconnect: true,
        retryOnMount: true,
    })
    
    const queryClient = useQueryClient()
    const { mutate } = useMutation({
        mutationFn: updateStatus,
        onError: (error) => {
            toast.error(error.message)
        },
        onSuccess: (data) => {
            toast.success(data)
            queryClient.invalidateQueries({ queryKey: ['project', projectId] })
            queryClient.invalidateQueries({ queryKey: ['task', taskId] })
        }
    })
    
    // Manejar errores con useEffect para evitar setState durante render
    // Solo mostrar error si no hay datos previos disponibles
    useEffect(() => {
        if (isError && error && !data) {
            // Solo mostrar error si no tenemos datos para mostrar
            const timeoutId = setTimeout(() => {
                toast.error(error.message, { toastId: 'task-error' })
            }, 1000) // Delay para evitar spam de errores durante invalidación
            
            return () => clearTimeout(timeoutId)
        }
    }, [isError, error, data])
    
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        console.log(e.target.value)
        const status = e.target.value as TaskStatus
        const data = { projectId, taskId, status }
        mutate(data)
    }
    
    // Loading state - solo mostrar loading si no hay datos
    if (isLoading && !data) {
        return (
            <Transition appear show={show} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={() => navigate(location.pathname, { replace: true })}>
                    <TransitionChild
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/60" />
                    </TransitionChild>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <DialogPanel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all p-10">
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                    <span className="text-lg text-gray-600">Cargando tarea...</span>
                                </div>
                            </DialogPanel>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        )
    }
    
    // Error state - solo navegar si no hay datos para mostrar
    if (isError && !data) {
        return <Navigate to={`/projects/${projectId}`} replace />
    }
    
    // Asegurar que data existe antes de renderizar
    if (!data) {
        return <Navigate to={`/projects/${projectId}`} replace />
    }
    
    return (
        <>
            <Transition appear show={show} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={() => navigate(location.pathname, { replace: true })}>
                    <TransitionChild
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/60" />
                    </TransitionChild>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <TransitionChild
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <DialogPanel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all p-10 space-y-8">
                                    {/* Indicador sutil de estado de conexión */}
                                    {isError && data && (
                                        <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                                <span className="text-sm text-yellow-700">
                                                    Mostrando datos guardados. Algunos cambios recientes podrían no aparecer.
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => window.location.reload()}
                                                className="text-xs text-yellow-600 hover:text-yellow-800 underline"
                                            >
                                                Recargar
                                            </button>
                                        </div>
                                    )}
                                    
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b pb-4">
                                        <div>
                                            <p className='text-sm text-slate-400'>Agregada el: {formatDateForDisplay(data.createdAt)}</p>
                                            <p className='text-sm text-slate-400'>Última actualización: {formatDateForDisplay(data.updatedAt)}</p>
                                        </div>
                                        <div>
                                            <p className='text-lg font-bold text-slate-500'>Fecha límite:
                                                <span className={`ml-2 px-2 py-1 rounded ${/* color según vencimiento */ ''}`}>
                                                    {formatDateForDisplay(data.dueDate)}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <DialogTitle as="h3" className="font-black text-4xl text-slate-700 my-5">
                                        {data.name}
                                    </DialogTitle>

                                    <p className='text-lg text-slate-700 mb-2'>Descripción:</p>
                                    <div className="bg-slate-50 p-4 rounded mb-4 border">{data.description}</div>
                                    <div>
                                    {data.completedBy.length ? (
                                           <>
                                           <p className='text-2xl font-bold text-slate-700 mb-2'>Historial de Cambios</p>
                                        <ul className='list-decimal pl-5 mb-5 space-y-2'>
                                            {data.completedBy.map((activityLog) => (
                                                <li key={activityLog._id} className='text-lg text-slate-700'>
                                                    <span className='font-bold text-slate-900'>
                                                        {statusTranslations[activityLog.status]}
                                                    </span>{' '}por: <span className="font-bold">{activityLog.user.name}</span>
                                                </li>
                                            ))}
                                        </ul>
                                           </>
                                        ) : (
                                            <p className='text-lg text-slate-700'>No hay cambios registrados</p>
                                        )}
                                    </div>

                                    <div className='my-5 space-y-3'>
                                        <label className='font-bold text-lg'>Estado Actual:</label>
                                        <select
                                            className='w-full p-3 bg-slate-50 border-2 border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-slate-400'
                                            defaultValue={data.status}
                                            onChange={handleChange}
                                        >
                                            {Object.entries(statusTranslations).map(([key, value]) => (
                                                <option key={key} value={key}>{value}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <NotesPanel 
                                        notes={data.notes}
                                    />
                                    
                                    {/* Gestión de archivos adjuntos */}
                                    <FileManager 
                                        projectId={projectId}
                                        taskId={taskId}
                                        canEdit={true}
                                        className="mt-6"
                                        taskFiles={data.archive} // Pasar archivos del task
                                    />
                                    
                                    {/* Debug temporal - eliminar en producción */}
                                    <TaskDataDebug task={data} visible={false} />
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    )
}