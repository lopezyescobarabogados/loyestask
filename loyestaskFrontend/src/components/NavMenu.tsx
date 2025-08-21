import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition
} from '@headlessui/react'
import { Bars3Icon } from '@heroicons/react/20/solid'
import { Link } from 'react-router-dom'
import { Fragment } from 'react/jsx-runtime'
import type { User } from '../types'
import { useQueryClient } from '@tanstack/react-query'
import { useRole } from '@/hooks/useRole'

type NavMenuProps = {
  name: User['name']
}

export const NavMenu = ({name}: NavMenuProps) => {
  const queryClient = useQueryClient()
  const { isAdmin } = useRole()
  
  const logout = () => {
    localStorage.removeItem('AUTH_TOKEN')
    queryClient.invalidateQueries({queryKey: ['user']})
  }
  return (
    <Popover className='relative'>
      <PopoverButton className='inline-flex items-center gap-x-1 text-sm font-semibold leading-6 p-1 rounded-lg bg-gray-900'>
        <Bars3Icon className='w-8 h-8 text-white ' />
      </PopoverButton>

      <Transition
        as={Fragment}
        enter='transition ease-out duration-200'
        enterFrom='opacity-0 translate-y-1'
        enterTo='opacity-100 translate-y-0'
        leave='transition ease-in duration-150'
        leaveFrom='opacity-100 translate-y-0'
        leaveTo='opacity-0 translate-y-1'
      >
        <PopoverPanel className='absolute left-1/2 z-10 mt-5 flex w-screen lg:max-w-min -translate-x-1/2 lg:-translate-x-48'>
          <div className='w-full lg:w-56 shrink rounded-xl bg-white p-4 text-sm font-semibold leading-6 text-gray-900 shadow-lg ring-1 ring-gray-900/5'>
            <p className='text-center'>Hola: {name}</p>
            <Link
              to='/profile'
              className='block p-2 hover:text-blue-950'
            >
              Mi Perfil
            </Link>
            <Link
              to='/profile/performance'
              className='block p-2 hover:text-blue-950'
            >
              Mi Desempeño
            </Link>
            <Link
              to='/'
              className='block p-2 hover:text-blue-950'
            >
              Mis Proyectos
            </Link>
            {isAdmin && (
              <>
                <Link
                  to='/admin'
                  className='block p-2 hover:text-blue-950'
                >
                  Administrar Usuarios
                </Link>
                <Link
                  to='/admin/performance'
                  className='block p-2 hover:text-blue-950'
                >
                  Analytics de Rendimiento
                </Link>
                <Link
                  to='/admin/financial'
                  className='block p-2 hover:text-blue-950'
                >
                  Gestión Financiera
                </Link>
                <Link
                  to='/admin/clients'
                  className='block p-2 hover:text-blue-950'
                >
                  Clientes y Deudas
                </Link>
              </>
            )}
            <button
              className='block p-2 hover:text-blue-950'
              type='button'
              onClick={logout}
            >
              Cerrar Sesión
            </button>
          </div>
        </PopoverPanel>
      </Transition>
    </Popover>
  )
}
