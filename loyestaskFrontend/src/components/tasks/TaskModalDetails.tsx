import { Fragment } from 'react';
import { Dialog, Transition, DialogPanel, DialogTitle, TransitionChild } from '@headlessui/react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTaskById, updateStatus } from '@/api/TaskAPI';
import { toast } from 'react-toastify';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { statusTranslations } from '@/locales/es';
import type { TaskStatus } from '@/types/index';
import NotesPanel from '../notes/NotesPanel';

export default function TaskModalDetails() {
    const params = useParams()
    const projectId = params.projectId!
    const navigate = useNavigate()
    const location = useLocation()
    const queryParams = new URLSearchParams(location.search)
    const taskId = queryParams.get('viewTask')!
    const show = taskId ? true : false
    const { data, isError, error } = useQuery({
        queryKey: ['task', taskId],
        queryFn: () => getTaskById({ projectId, taskId }),
        enabled: !!taskId,
        retry: false
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
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        console.log(e.target.value)
        const status = e.target.value as TaskStatus
        const data = { projectId, taskId, status }
        mutate(data)
    }
    if (isError) {
        toast.error(error.message, { toastId: 'error' })
        return <Navigate to={`/projects/${projectId}`} />
    }
    if (data) return (
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
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    )
}