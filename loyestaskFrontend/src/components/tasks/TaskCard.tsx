import { Fragment, useState } from 'react'
import { Menu, Transition, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { EllipsisVerticalIcon, BellIcon } from '@heroicons/react/20/solid'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { TaskProject } from "@/types/index"
import { deleteTask } from '@/api/TaskAPI'
import { toast } from 'react-toastify'
import { formatDateForDisplay } from '@/utils/dateUtils'
import { useDraggable } from '@dnd-kit/core'
import TaskNotificationModal from '../notifications/TaskNotificationModal'

type TaskCardProps = {
    task: TaskProject
    canEdit: boolean
}

export default function TaskCard({ task, canEdit }: TaskCardProps) {
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: task._id
    })
    const navigate = useNavigate()
    const params = useParams()
    const projectId = params.projectId!
    const queryClient = useQueryClient()
    const { mutate } = useMutation({
        mutationFn: deleteTask,
        onError: (error) => {
            toast.error(error.message)
        },
        onSuccess: (data) => {
            toast.success(data)
            queryClient.invalidateQueries({ queryKey: ['project', projectId] })
        }
    })
    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        padding: "1.25rem ",
        backgroundColor: "#FFF",
        width: '300px',
        display: 'flex',
        borderWidth: '1px',
        borderColor: 'rgb(203 213 225 / var(--tw-border-opacity))',
    } : undefined
    return (
        <>
            <div className="p-3 bg-white border border-slate-50 flex justify-between gap-6 rounded-xl ">
                <div 
                {...listeners}
                {...attributes}
                ref={setNodeRef}
                style={style}
                className="min-w-0 flex flex-col gap-y-2">
                    <p
                        className="text-2xl font-bold text-slate-700 text-left hover:text-slate-400 transition-colors"
                    >
                        {task.name}
                    </p>
                    {/* <p className="text-slate-500">{task.description}</p> */}
                    <p className="text-sm text-slate-400">
                        Fecha límite: <span className="font-semibold">{formatDateForDisplay(task.dueDate)}</span>
                    </p>
                </div>
                <div className="flex shrink-0 gap-x-6 items-center">
                    <Menu as="div" className="relative flex-none">
                        <MenuButton className="-m-2.5 block p-2.5 text-slate-500 hover:text-slate-900">
                            <span className="sr-only">opciones</span>
                            <EllipsisVerticalIcon className="h-7 w-7" aria-hidden="true" />
                        </MenuButton>
                        <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                            <MenuItems
                                className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-slate-900/5 focus:outline-none">
                                <MenuItem>
                                    <button
                                        type='button'
                                        className='block px-3 py-2 text-sm leading-6 text-black-600 hover:bg-blue-50 rounded transition-colors'
                                        onClick={() => navigate(location.pathname + `?viewTask=${task._id}`)}
                                    >
                                        Ver Tarea
                                    </button>
                                </MenuItem>
                                <MenuItem>
                                    <button
                                        type='button'
                                        className='flex items-center px-3 py-2 text-sm leading-6 text-black-600 hover:bg-blue-50 rounded transition-colors'
                                        onClick={() => setShowNotificationModal(true)}
                                    >
                                        <BellIcon className="h-4 w-4 mr-2" />
                                        Configurar Recordatorio
                                    </button>
                                </MenuItem>
                                {canEdit && (
                                    <>
                                        <MenuItem>
                                            <button
                                                type='button'
                                                className='block px-3 py-2 text-sm leading-6 text-black-600 hover:bg-amber-50 rounded transition-colors'
                                                onClick={() => navigate(location.pathname + `?editTask=${task._id}`)}
                                            >
                                                Editar Tarea
                                            </button>
                                        </MenuItem>
                                        <MenuItem>
                                            <button
                                                type='button'
                                                className='block px-3 py-2 text-sm leading-6 text-red-600 hover:bg-red-50 rounded transition-colors'
                                                onClick={() => mutate({ projectId, taskId: task._id })}
                                            >
                                                Eliminar Tarea
                                            </button>
                                        </MenuItem>
                                    </>
                                )}
                            </MenuItems>
                        </Transition>
                    </Menu>
                </div>
            </div>

            {/* Modal de configuración de notificaciones */}
            <TaskNotificationModal
                task={task}
                show={showNotificationModal}
                onClose={() => setShowNotificationModal(false)}
            />
        </>
    )
}
