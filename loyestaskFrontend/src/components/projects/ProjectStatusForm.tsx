import { Fragment } from 'react'
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from '@headlessui/react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { updateProjectStatus } from '@/api/ProjectAPI'
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline'

type ProjectStatusFormProps = {
    show: boolean
    currentStatus: string
}

const statusOptions = [
    { value: 'active', label: 'Activo', description: 'Proyecto en desarrollo', icon: ClockIcon, color: 'text-blue-600' },
    { value: 'completed', label: 'Completado', description: 'Proyecto finalizado', icon: CheckCircleIcon, color: 'text-green-600' }
]

export default function ProjectStatusForm({ show, currentStatus }: ProjectStatusFormProps) {
    const navigate = useNavigate()
    const params = useParams()
    const projectId = params.projectId!

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            status: currentStatus
        }
    })

    const queryClient = useQueryClient()

    const { mutate, isPending } = useMutation({
        mutationFn: updateProjectStatus,
        onError: (error) => {
            toast.error(error.message)
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['projects'] })
            queryClient.invalidateQueries({ queryKey: ['project', projectId] })
            toast.success(data)
            navigate(location.pathname, { replace: true })
        }
    })

    const handleForm = (formData: { status: string }) => {
        mutate({ formData, projectId })
    }

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
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <DialogTitle as="h3" className="text-lg font-medium leading-6 text-slate-700 mb-4">
                                    Cambiar Estado del Proyecto
                                </DialogTitle>

                                <form onSubmit={handleSubmit(handleForm)} className="space-y-4">
                                    <div className="space-y-3">
                                        {statusOptions.map((option) => {
                                            const IconComponent = option.icon
                                            return (
                                                <label
                                                    key={option.value}
                                                    className={`relative flex cursor-pointer rounded-lg px-4 py-3 border-2 transition-colors hover:bg-slate-50 ${
                                                        currentStatus === option.value 
                                                            ? 'border-slate-600 bg-slate-50' 
                                                            : 'border-slate-200'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        value={option.value}
                                                        {...register('status', {
                                                            required: 'El estado es obligatorio'
                                                        })}
                                                        className="sr-only"
                                                    />
                                                    <div className="flex items-center space-x-3">
                                                        <IconComponent className={`h-6 w-6 ${option.color}`} />
                                                        <div>
                                                            <p className="font-medium text-slate-900">
                                                                {option.label}
                                                            </p>
                                                            <p className="text-sm text-slate-500">
                                                                {option.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </label>
                                            )
                                        })}
                                    </div>

                                    {errors.status && (
                                        <p className="text-red-600 text-sm">{errors.status.message}</p>
                                    )}

                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => navigate(location.pathname, { replace: true })}
                                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors"
                                            disabled={isPending}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isPending}
                                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                                                isPending 
                                                    ? 'bg-slate-400 cursor-not-allowed' 
                                                    : 'bg-slate-600 hover:bg-slate-700'
                                            }`}
                                        >
                                            {isPending ? 'Actualizando...' : 'Actualizar Estado'}
                                        </button>
                                    </div>
                                </form>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}
