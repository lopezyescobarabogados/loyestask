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
import { useState } from 'react';
import { addCollaborator, removeCollaborator, getAvailableCollaborators } from '@/api/TaskAPI';
import { getFullProject } from '@/api/ProjectAPI';
import type { Collaborator } from '@/types/index';
import { useAuth } from '@/hooks/useAuth';

export default function TaskModalDetails() {
    const params = useParams()
    const projectId = params.projectId!
    const navigate = useNavigate()
    const location = useLocation()
    const queryParams = new URLSearchParams(location.search)
    const taskId = queryParams.get('viewTask')!
    const show = taskId ? true : false

    // Gestión de colaboradores
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [availableCollaborators, setAvailableCollaborators] = useState<Collaborator[]>([]);
    const [loadingCollaborators, setLoadingCollaborators] = useState(false);
    const [assignError, setAssignError] = useState<string | null>(null);
    
    // Obtener usuario actual de manera confiable
    const { data: currentUser } = useAuth();
    
    // Hooks - deben declararse antes de los handlers
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

    // Obtener datos del proyecto para identificar manager
    const { data: projectData } = useQuery({
        queryKey: ['project', projectId, 'manager'],
        queryFn: () => getFullProject(projectId),
        enabled: !!projectId,
        staleTime: 10 * 60 * 1000,
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

    // Determinar si el usuario actual es manager del proyecto (seguro después de queries)
    const currentUserId = currentUser?._id || '';
    
    // Extraer el ID del manager (puede ser string o objeto poblado)
    const managerId = typeof projectData?.manager === 'string' 
        ? projectData.manager 
        : projectData?.manager?._id;
    
    const isManager = managerId === currentUserId && currentUserId !== '';
    
    // Obtener colaboradores disponibles al abrir modal
    const handleOpenAssignModal = async () => {
        setLoadingCollaborators(true);
        setShowAssignModal(true);
        setAssignError(null);
        try {
            const result = await getAvailableCollaborators({ projectId, taskId });
            setAvailableCollaborators(result);
        } catch (err) {
            setAssignError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoadingCollaborators(false);
        }
    };

    // Asignar colaborador
    const handleAssignCollaborator = async (userId: string) => {
        setAssignError(null);
        try {
            await addCollaborator({ projectId, taskId, userId });
            toast.success('Colaborador asignado exitosamente');
            setShowAssignModal(false);
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido al asignar colaborador';
            if (import.meta.env.MODE === 'development') {
                console.error('❌ Error assigning collaborator:', err);
            }
            setAssignError(errorMessage);
            toast.error(errorMessage, {
                position: 'top-right',
                autoClose: 5000,
            });
        }
    };

    // Eliminar colaborador
    const handleRemoveCollaborator = async (userId: string) => {
        if (typeof window !== 'undefined' && window.confirm('¿Seguro que deseas eliminar este colaborador?')) {
            try {
                await removeCollaborator({ projectId, taskId, userId });
                toast.success('Colaborador eliminado');
                queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Error desconocido');
            }
        }
    };
    
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
        const status = e.target.value as TaskStatus
        const data = { projectId, taskId, status }
        mutate(data)
    }
    
    // Loading state - solo mostrar loading si no hay datos
    if (isLoading || !data) {
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
                                    
                                    {/* Gestión de colaboradores */}
                                    <div className="my-8">
                                        <h3 className="text-xl font-bold text-slate-700 mb-2">Colaboradores asignados</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {data.collaborators && data.collaborators.length > 0 ? (
                                                (data.collaborators as Collaborator[]).map((colab) => (
                                                    <div key={colab._id} className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded shadow">
                                                        <span className="font-semibold text-slate-700">{colab.name}</span>
                                                        <span className="text-xs text-slate-500">{colab.email}</span>
                                                        {isManager && (
                                                            <button
                                                                className="ml-2 text-red-500 hover:text-red-700 text-xs font-bold"
                                                                onClick={() => handleRemoveCollaborator(colab._id)}
                                                            >
                                                                Eliminar
                                                            </button>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="text-slate-400">No hay colaboradores asignados</span>
                                            )}
                                        </div>
                                        
                                        {/* Mostrar botón incluso si hay dudas sobre permisos */}
                                        {(isManager || (!currentUser && !projectData)) && (
                                            <button
                                                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenAssignModal();
                                                }}
                                                disabled={!currentUser || !projectData}
                                                title={!currentUser || !projectData ? 'Cargando permisos...' : 'Asignar colaborador'}
                                            >
                                                {!currentUser || !projectData ? 'Cargando...' : 'Asignar colaborador'}
                                            </button>
                                        )}
                                    </div>

                                    {/* Modal para asignar colaborador */}
                                                                    </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Modal para asignar colaborador - FUERA del modal principal */}
            {showAssignModal && (
                <Transition appear show={showAssignModal} as={Fragment}>
                    <Dialog as="div" className="fixed z-50 inset-0 flex items-center justify-center" onClose={() => setShowAssignModal(false)}>
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
                        
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <DialogPanel className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-auto relative z-50">
                                <DialogTitle as="h4" className="text-lg font-bold mb-4">Selecciona colaborador para asignar</DialogTitle>
                                {loadingCollaborators ? (
                                    <div className="text-center py-6">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                                        <span className="mt-2 text-gray-600">Cargando...</span>
                                    </div>
                                ) : assignError ? (
                                    <div className="text-red-500 mb-4 p-3 bg-red-50 rounded">{assignError}</div>
                                ) : availableCollaborators.length === 0 ? (
                                    <div className="text-slate-500 text-center py-4">No hay usuarios disponibles para asignar</div>
                                ) : (
                                    <ul className="space-y-3 max-h-60 overflow-y-auto">
                                        {availableCollaborators.map((user) => (
                                            <li key={user._id} className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2 rounded hover:bg-slate-100 transition-colors">
                                                <div className="flex-1">
                                                    <span className="font-semibold text-slate-700 block">{user.name}</span>
                                                    <span className="text-xs text-slate-500">{user.email}</span>
                                                </div>
                                                <button
                                                    className="ml-2 px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-700 text-xs font-medium transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAssignCollaborator(user._id);
                                                    }}
                                                >
                                                    Asignar
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <div className="mt-6 flex gap-2 justify-end">
                                    <button 
                                        className="px-4 py-2 bg-slate-300 text-slate-700 rounded hover:bg-slate-400 transition-colors" 
                                        onClick={() => setShowAssignModal(false)}
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </Dialog>
                </Transition>
            )}
        </>
    )
}