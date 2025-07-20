import { Fragment } from 'react'
import { Dialog, Transition, DialogPanel, DialogTitle, TransitionChild } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createUser } from '@/api/UserAPI'
import { toast } from 'react-toastify'
import type { UserRegistrationAdminForm } from '@/types/index'
import ErrorMessage from '../ErrorMessage'

type CreateUserModalProps = {
    isOpen: boolean
    onClose: () => void
}

export default function CreateUserModal({ isOpen, onClose }: CreateUserModalProps) {
    const queryClient = useQueryClient()
    
    const initialValues: UserRegistrationAdminForm = {
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'user'
    }
    
    const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<UserRegistrationAdminForm>({
        defaultValues: initialValues
    })
    
    const { mutate, isPending } = useMutation({
        mutationFn: createUser,
        onError: (error) => {
            toast.error(error.message)
        },
        onSuccess: (data) => {
            toast.success(data)
            queryClient.invalidateQueries({ queryKey: ['users'] })
            reset()
            onClose()
        }
    })
    
    const password = watch('password')
    
    const handleCreateUser = (formData: UserRegistrationAdminForm) => {
        mutate(formData)
    }
    
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={onClose}>
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
                                <DialogTitle
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900 mb-4"
                                >
                                    Crear Usuario
                                </DialogTitle>
                                
                                <form onSubmit={handleSubmit(handleCreateUser)} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nombre
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                                            {...register('name', {
                                                required: 'El nombre es obligatorio'
                                            })}
                                        />
                                        {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                                            {...register('email', {
                                                required: 'El email es obligatorio',
                                                pattern: {
                                                    value: /\S+@\S+\.\S+/,
                                                    message: 'Email no válido'
                                                }
                                            })}
                                        />
                                        {errors.email && <ErrorMessage>{errors.email.message}</ErrorMessage>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Contraseña
                                        </label>
                                        <input
                                            type="password"
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                                            {...register('password', {
                                                required: 'La contraseña es obligatoria',
                                                minLength: {
                                                    value: 8,
                                                    message: 'La contraseña debe tener al menos 8 caracteres'
                                                }
                                            })}
                                        />
                                        {errors.password && <ErrorMessage>{errors.password.message}</ErrorMessage>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Confirmar Contraseña
                                        </label>
                                        <input
                                            type="password"
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                                            {...register('password_confirmation', {
                                                required: 'Confirma la contraseña',
                                                validate: value => value === password || 'Las contraseñas no coinciden'
                                            })}
                                        />
                                        {errors.password_confirmation && <ErrorMessage>{errors.password_confirmation.message}</ErrorMessage>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Rol
                                        </label>
                                        <select
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                                            {...register('role', {
                                                required: 'El rol es obligatorio'
                                            })}
                                        >
                                            <option value="user">Usuario</option>
                                            <option value="admin">Administrador</option>
                                        </select>
                                        {errors.role && <ErrorMessage>{errors.role.message}</ErrorMessage>}
                                    </div>
                                    
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isPending}
                                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-slate-600 border border-transparent rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50"
                                        >
                                            {isPending ? 'Creando...' : 'Crear Usuario'}
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
