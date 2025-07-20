import { DndContext } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import type { Project, TaskProject, TaskStatus } from "@/types/index"
import TaskCard from "./TaskCard"
import { statusTranslations } from "@/locales/es"
import DropTask from "./DropTask"
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateStatus } from '@/api/TaskAPI'
import { toast } from 'react-toastify'
import { useParams } from 'react-router-dom'

type TaskListProps = {
    tasks: TaskProject[]
    canEdit: boolean
}

type GroupedTask = {
    [key: string]: TaskProject[]
}

const initialStatusGroups: GroupedTask = {
    pending: [],
    onHold: [],
    inProgress: [],
    underReview: [],
    completed: []
}

const statusStyles: { [key: string]: string } = {
    pending: 'border-t-slate-500',
    onHold: 'border-t-red-500',
    inProgress: 'border-t-blue-500',
    underReview: 'border-t-amber-500',
    completed: 'border-t-emerald-500'
}

export default function TaskList({ tasks, canEdit }: TaskListProps) {
    const params = useParams()
    const projectId = params.projectId!
    const queryClient = useQueryClient()
    const { mutate } = useMutation({
        mutationFn: updateStatus,
        onError: (error) => {
            toast.error(error.message)
        },
        onSuccess: (data) => {
            toast.success(data)
            queryClient.invalidateQueries({ queryKey: ['project', projectId] })
            //queryClient.invalidateQueries({ queryKey: ['task', taskId] })
        }
    })
    const groupedTasks = tasks.reduce((acc, task) => {
        let currentGroup = acc[task.status] ? [...acc[task.status]] : [];
        currentGroup = [...currentGroup, task]
        return { ...acc, [task.status]: currentGroup };
    }, initialStatusGroups);
    const handleDragEnd = (e: DragEndEvent) => {
        const { over, active } = e
        if (over && over.id) {
            const taskId = active.id.toString()
            const status = over.id as TaskStatus
            mutate({ projectId, taskId, status })
            queryClient.setQueryData(['project', projectId], (prevData: Project) => {
                const updateTasks = prevData.tasks.map((task) => {
                    if (task._id === taskId) {
                        return { ...task, status }
                    }
                    return task
                })
                return { ...prevData, tasks: updateTasks }
            })
        }
    }
    return (
        <>
            <h2 className="text-5xl font-black my-10">Tareas</h2>
            <div className='flex gap-8 overflow-x-scroll 2xl:overflow-auto pb-32'>
                <DndContext onDragEnd={handleDragEnd}>
                    {Object.entries(groupedTasks).map(([status, tasks]) => (
                        <div
                            key={status}
                            className={`min-w-[320px] 2xl:min-w-0 2xl:w-1/5 rounded-xl shadow-lg bg-gradient-to-b from-white to-slate-50 border border-slate-200 border-t-8 ${statusStyles[status]} p-4`}
                        >
                            <h3 className="capitalize text-xl font-bold flex items-center gap-2 mb-4">
                                {statusTranslations[status]}
                            </h3>
                            <DropTask status={status} />
                            <ul className='mt-5 space-y-5'>
                                {tasks.length === 0 ? (
                                    <li className="text-slate-400 text-center pt-3 italic">No hay tareas</li>
                                ) : (
                                    tasks.map(task => (
                                        <li
                                            key={task._id}
                                            className="bg-white rounded-lg shadow hover:shadow-xl transition-shadow p-5 border border-slate-200"
                                        >
                                            <TaskCard task={task} canEdit={canEdit} />
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    ))}
                </DndContext>
            </div>
        </>
    )
}
