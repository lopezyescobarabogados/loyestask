import { Fragment, useState } from 'react'
import { Menu, Transition, MenuButton, MenuItem, MenuItems, Dialog, DialogPanel, DialogTitle, TransitionChild } from '@headlessui/react'
import { EllipsisVerticalIcon, PlusIcon, XMarkIcon, UserIcon, EnvelopeIcon, LockClosedIcon, ShieldCheckIcon } from '@heroicons/react/20/solid'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllUsers, deleteUser, createUser, updateUser } from '@/api/UserAPI'
import { toast } from 'react-toastify'
import { useForm } from 'react-hook-form'
import type { User, UserRegistrationAdminForm, UserUpdateForm } from '@/types/index'
import ErrorMessage from '../ErrorMessage'

export default function UserManagement() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    
    const queryClient = useQueryClient()
    
    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: getAllUsers
    })
    
    const { mutate: deleteUserMutation } = useMutation({
        mutationFn: deleteUser,
        onError: (error) => {
            toast.error(error.message)
        },
        onSuccess: (data) => {
            toast.success(data)
            queryClient.invalidateQueries({ queryKey: ['users'] })
        }
    })
    
    const { mutate: createUserMutation, isPending: isCreating } = useMutation({
        mutationFn: createUser,
        onError: (error) => {
            toast.error(error.message)
        },
        onSuccess: (data) => {
            toast.success(data)
            queryClient.invalidateQueries({ queryKey: ['users'] })
            setIsCreateModalOpen(false)
            resetCreateForm()
        }
    })
    
    const { mutate: updateUserMutation, isPending: isUpdating } = useMutation({
        mutationFn: updateUser,
        onError: (error) => {
            toast.error(error.message)
        },
        onSuccess: (data) => {
            toast.success(data)
            queryClient.invalidateQueries({ queryKey: ['users'] })
            setSelectedUser(null)
            resetEditForm()
        }
    })
    
    // Formulario para crear usuario
    const initialCreateValues: UserRegistrationAdminForm = {
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'user'
    }
    
    const { register: registerCreate, handleSubmit: handleSubmitCreate, watch: watchCreate, reset: resetCreateForm, formState: { errors: createErrors } } = useForm<UserRegistrationAdminForm>({
        defaultValues: initialCreateValues
    })
    
    // Formulario para editar usuario
    const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEditForm, formState: { errors: editErrors } } = useForm<UserUpdateForm>()
    
    const passwordCreate = watchCreate('password')
    
    const handleDeleteUser = (userId: User['_id']) => {
        if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
            deleteUserMutation(userId)
        }
    }
    
    const handleCreateUser = (formData: UserRegistrationAdminForm) => {
        createUserMutation(formData)
    }
    
    const handleUpdateUser = (formData: UserUpdateForm) => {
        if (selectedUser) {
            updateUserMutation({
                userId: selectedUser._id,
                formData
            })
        }
    }
    
    const openEditModal = (user: User) => {
        setSelectedUser(user)
        resetEditForm({
            name: user.name,
            email: user.email,
            role: user.role
        })
    }
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-64" role="status" aria-label="Cargando usuarios">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
                <span className="sr-only">Cargando usuarios...</span>
            </div>
        )
    }
    
    return (
        <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900">
                            Gestión de Usuarios
                        </h1>
                        <p className="text-lg sm:text-xl lg:text-2xl font-light text-gray-500 mt-2 sm:mt-5">
                            Administra los usuarios del sistema
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 px-4 sm:px-6 py-3 text-white font-bold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                        aria-label="Crear nuevo usuario"
                    >
                        <PlusIcon className="w-5 h-5" aria-hidden="true" />
                        <span className="hidden sm:inline">Crear Usuario</span>
                        <span className="sm:hidden">Crear</span>
                    </button>
                </div>
                
                {users && users.length > 0 ? (
                    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                        {/* Vista móvil */}
                        <div className="block sm:hidden">
                            <div className="divide-y divide-gray-200">
                                {users.map((user) => (
                                    <div key={user._id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                                            <UserIcon className="w-5 h-5 text-slate-600" aria-hidden="true" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {user.name}
                                                        </p>
                                                        <p className="text-sm text-gray-500 truncate">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        user.role === 'admin' 
                                                            ? 'bg-purple-100 text-purple-800' 
                                                            : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {user.role === 'admin' ? 'Admin' : 'Usuario'}
                                                    </span>
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        user.confirmed 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {user.confirmed ? 'Confirmado' : 'Pendiente'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0 ml-4">
                                                <Menu as="div" className="relative inline-block text-left">
                                                    <MenuButton className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-slate-500 rounded-md p-1">
                                                        <span className="sr-only">Abrir menú de opciones para {user.name}</span>
                                                        <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                                                    </MenuButton>
                                                    <Transition
                                                        as={Fragment}
                                                        enter="transition ease-out duration-100"
                                                        enterFrom="transform opacity-0 scale-95"
                                                        enterTo="transform opacity-100 scale-100"
                                                        leave="transition ease-in duration-75"
                                                        leaveFrom="transform opacity-100 scale-100"
                                                        leaveTo="transform opacity-0 scale-95"
                                                    >
                                                        <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                            <MenuItem>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openEditModal(user)}
                                                                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                                                >
                                                                    Editar
                                                                </button>
                                                            </MenuItem>
                                                            <MenuItem>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteUser(user._id)}
                                                                    className="block w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                                                >
                                                                    Eliminar
                                                                </button>
                                                            </MenuItem>
                                                        </MenuItems>
                                                    </Transition>
                                                </Menu>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Vista de escritorio */}
                        <div className="hidden sm:block">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Usuario
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Rol
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Estado
                                        </th>
                                        <th scope="col" className="relative px-6 py-3">
                                            <span className="sr-only">Acciones</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                                                            <UserIcon className="h-5 w-5 text-slate-600" aria-hidden="true" />
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {user.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {user.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    user.role === 'admin' 
                                                        ? 'bg-purple-100 text-purple-800' 
                                                        : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    user.confirmed 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {user.confirmed ? 'Confirmado' : 'Pendiente'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Menu as="div" className="relative inline-block text-left">
                                                    <MenuButton className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-slate-500 rounded-md p-1">
                                                        <span className="sr-only">Abrir menú de opciones para {user.name}</span>
                                                        <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                                                    </MenuButton>
                                                    <Transition
                                                        as={Fragment}
                                                        enter="transition ease-out duration-100"
                                                        enterFrom="transform opacity-0 scale-95"
                                                        enterTo="transform opacity-100 scale-100"
                                                        leave="transition ease-in duration-75"
                                                        leaveFrom="transform opacity-100 scale-100"
                                                        leaveTo="transform opacity-0 scale-95"
                                                    >
                                                        <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                            <MenuItem>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openEditModal(user)}
                                                                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                                                >
                                                                    Editar
                                                                </button>
                                                            </MenuItem>
                                                            <MenuItem>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteUser(user._id)}
                                                                    className="block w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                                                >
                                                                    Eliminar
                                                                </button>
                                                            </MenuItem>
                                                        </MenuItems>
                                                    </Transition>
                                                </Menu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 sm:py-20 bg-white rounded-lg shadow-lg">
                        <UserIcon className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No hay usuarios registrados</h3>
                        <p className="mt-2 text-sm text-gray-500">Comienza creando el primer usuario.</p>
                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex items-center gap-2 bg-slate-600 hover:bg-slate-700 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 px-4 py-2 text-sm font-medium text-white rounded-md transition-all duration-200"
                            >
                                <PlusIcon className="w-4 h-4" aria-hidden="true" />
                                Crear primer usuario
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal para crear usuario */}
            <Transition appear show={isCreateModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsCreateModalOpen(false)}>
                    <TransitionChild
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-50" />
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
                                    <DialogTitle as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center justify-between">
                                        <span>Crear Usuario</span>
                                        <button
                                            type="button"
                                            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-slate-500 rounded-md p-1"
                                            onClick={() => setIsCreateModalOpen(false)}
                                            aria-label="Cerrar modal"
                                        >
                                            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                                        </button>
                                    </DialogTitle>
                                    <form onSubmit={handleSubmitCreate(handleCreateUser)} className="mt-4 space-y-4">
                                        <div>
                                            <label htmlFor="create-name" className="block text-sm font-medium text-gray-700">
                                                Nombre
                                            </label>
                                            <div className="mt-1 relative">
                                                <input
                                                    id="create-name"
                                                    type="text"
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                                                    placeholder="Nombre del usuario"
                                                    {...registerCreate('name', {
                                                        required: 'El nombre es obligatorio'
                                                    })}
                                                />
                                                <UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                                            </div>
                                            {createErrors.name && <ErrorMessage>{createErrors.name.message}</ErrorMessage>}
                                        </div>

                                        <div>
                                            <label htmlFor="create-email" className="block text-sm font-medium text-gray-700">
                                                Email
                                            </label>
                                            <div className="mt-1 relative">
                                                <input
                                                    id="create-email"
                                                    type="email"
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                                                    placeholder="email@ejemplo.com"
                                                    {...registerCreate('email', {
                                                        required: 'El email es obligatorio',
                                                        pattern: {
                                                            value: /\S+@\S+\.\S+/,
                                                            message: 'Email no válido'
                                                        }
                                                    })}
                                                />
                                                <EnvelopeIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                                            </div>
                                            {createErrors.email && <ErrorMessage>{createErrors.email.message}</ErrorMessage>}
                                        </div>

                                        <div>
                                            <label htmlFor="create-password" className="block text-sm font-medium text-gray-700">
                                                Contraseña
                                            </label>
                                            <div className="mt-1 relative">
                                                <input
                                                    id="create-password"
                                                    type="password"
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                                                    placeholder="Mínimo 8 caracteres"
                                                    {...registerCreate('password', {
                                                        required: 'La contraseña es obligatoria',
                                                        minLength: {
                                                            value: 8,
                                                            message: 'La contraseña debe tener al menos 8 caracteres'
                                                        }
                                                    })}
                                                />
                                                <LockClosedIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                                            </div>
                                            {createErrors.password && <ErrorMessage>{createErrors.password.message}</ErrorMessage>}
                                        </div>

                                        <div>
                                            <label htmlFor="create-password-confirmation" className="block text-sm font-medium text-gray-700">
                                                Confirmar Contraseña
                                            </label>
                                            <div className="mt-1 relative">
                                                <input
                                                    id="create-password-confirmation"
                                                    type="password"
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                                                    placeholder="Confirma tu contraseña"
                                                    {...registerCreate('password_confirmation', {
                                                        required: 'La confirmación es obligatoria',
                                                        validate: (value) => 
                                                            value === passwordCreate || 'Las contraseñas no coinciden'
                                                    })}
                                                />
                                                <LockClosedIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                                            </div>
                                            {createErrors.password_confirmation && <ErrorMessage>{createErrors.password_confirmation.message}</ErrorMessage>}
                                        </div>

                                        <div>
                                            <label htmlFor="create-role" className="block text-sm font-medium text-gray-700">
                                                Rol
                                            </label>
                                            <div className="mt-1 relative">
                                                <select
                                                    id="create-role"
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                                                    {...registerCreate('role', {
                                                        required: 'El rol es obligatorio'
                                                    })}
                                                >
                                                    <option value="user">Usuario</option>
                                                    <option value="admin">Administrador</option>
                                                </select>
                                                <ShieldCheckIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                                            </div>
                                            {createErrors.role && <ErrorMessage>{createErrors.role.message}</ErrorMessage>}
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4">
                                            <button
                                                type="button"
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-500"
                                                onClick={() => setIsCreateModalOpen(false)}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isCreating}
                                                className="px-4 py-2 text-sm font-medium text-white bg-slate-600 border border-transparent rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isCreating ? 'Creando...' : 'Crear Usuario'}
                                            </button>
                                        </div>
                                    </form>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Modal para editar usuario */}
            <Transition appear show={!!selectedUser} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setSelectedUser(null)}>
                    <TransitionChild
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-50" />
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
                                    <DialogTitle as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center justify-between">
                                        <span>Editar Usuario</span>
                                        <button
                                            type="button"
                                            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-slate-500 rounded-md p-1"
                                            onClick={() => setSelectedUser(null)}
                                            aria-label="Cerrar modal"
                                        >
                                            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                                        </button>
                                    </DialogTitle>
                                    <form onSubmit={handleSubmitEdit(handleUpdateUser)} className="mt-4 space-y-4">
                                        <div>
                                            <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                                                Nombre
                                            </label>
                                            <div className="mt-1 relative">
                                                <input
                                                    id="edit-name"
                                                    type="text"
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                                                    placeholder="Nombre del usuario"
                                                    {...registerEdit('name', {
                                                        required: 'El nombre es obligatorio'
                                                    })}
                                                />
                                                <UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                                            </div>
                                            {editErrors.name && <ErrorMessage>{editErrors.name.message}</ErrorMessage>}
                                        </div>

                                        <div>
                                            <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700">
                                                Email
                                            </label>
                                            <div className="mt-1 relative">
                                                <input
                                                    id="edit-email"
                                                    type="email"
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                                                    placeholder="email@ejemplo.com"
                                                    {...registerEdit('email', {
                                                        required: 'El email es obligatorio',
                                                        pattern: {
                                                            value: /\S+@\S+\.\S+/,
                                                            message: 'Email no válido'
                                                        }
                                                    })}
                                                />
                                                <EnvelopeIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                                            </div>
                                            {editErrors.email && <ErrorMessage>{editErrors.email.message}</ErrorMessage>}
                                        </div>

                                        <div>
                                            <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700">
                                                Rol
                                            </label>
                                            <div className="mt-1 relative">
                                                <select
                                                    id="edit-role"
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                                                    {...registerEdit('role', {
                                                        required: 'El rol es obligatorio'
                                                    })}
                                                >
                                                    <option value="user">Usuario</option>
                                                    <option value="admin">Administrador</option>
                                                </select>
                                                <ShieldCheckIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                                            </div>
                                            {editErrors.role && <ErrorMessage>{editErrors.role.message}</ErrorMessage>}
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4">
                                            <button
                                                type="button"
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-500"
                                                onClick={() => setSelectedUser(null)}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isUpdating}
                                                className="px-4 py-2 text-sm font-medium text-white bg-slate-600 border border-transparent rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isUpdating ? 'Actualizando...' : 'Actualizar Usuario'}
                                            </button>
                                        </div>
                                    </form>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    )
}
