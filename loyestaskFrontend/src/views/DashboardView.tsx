import { Fragment, useState } from 'react'
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react'
import { EllipsisVerticalIcon, FunnelIcon } from '@heroicons/react/20/solid'
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useQuery } from '@tanstack/react-query'
import { getProject } from "@/api/ProjectAPI"
import { useAuth } from '@/hooks/useAuth'
import DeleteProjectModal from '@/components/projects/DeleteProjectModal'

export default function DashboardView() {
  const location = useLocation()
  const navigate = useNavigate()
  const { data: user, isLoading: authLoading } = useAuth()
  
  // Estado para filtros
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all')
  
  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProject
  })

  // Función para obtener las clases según la prioridad
  const getPriorityClasses = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'bg-gradient-to-r from-red-50 to-white border-l-4 border-red-500';
      case 'media':
        return 'bg-gradient-to-r from-yellow-50 to-white border-l-4 border-yellow-500';
      case 'baja':
        return 'bg-gradient-to-r from-green-50 to-white border-l-4 border-green-500';
      default:
        return 'bg-white';
    }
  };

  // Filtrar proyectos por estado
  const filteredProjects = data?.filter(project => {
    if (statusFilter === 'all') return true
    return project.status === statusFilter
  }) || []

  if (isLoading && authLoading) return 'Cargando...'

  if (data && user) return (
    <>
      <h1 className="text-5xl font-black">Mis Proyectos</h1>
      <p className="text-2xl font-light text-slate-500 mt-5">Maneja y administra tus Proyectos</p>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 my-5">
        <Link
          className="bg-slate-500 hover:bg-slate-300 px-10 py-3 text-white text-xl font-bold cursor-pointer transition-colors"
          to='/projects/create'
        >
          Nuevo Proyecto
        </Link>
        
        {/* Filtros de estado */}
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-slate-400" />
          <span className="text-sm text-slate-600">Filtrar por estado:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'completed')}
            className="text-sm border border-slate-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="completed">Completados</option>
          </select>
        </div>
      </div>
      
      {filteredProjects.length ? (
        <div className="mb-4">
          <p className="text-sm text-slate-600">
            Mostrando {filteredProjects.length} de {data.length} proyectos
            {statusFilter !== 'all' && ` (${statusFilter === 'active' ? 'activos' : 'completados'})`}
          </p>
        </div>
      ) : null}
      
      {filteredProjects.length ? (
        <ul role="list" className="divide-y divide-slate-100 border border-slate-100 mt-10 shadow-lg">
          {filteredProjects.map((project) => (
            <li
              key={project._id}
              className={`flex justify-between gap-x-6 px-5 py-10 ${getPriorityClasses(project.priority)}`}
            >
              <div className="flex min-w-0 gap-x-4">
                <div className="min-w-0 flex-auto space-y-2">

                  <div className="flex items-center gap-x-2">
                    <div className=''>
                      {project.manager === user._id ?
                        <p className='font-bold text-xs uppercase bg-indigo-50 text-indigo-500 border-2 border-indigo-500 rounded-lg inline-block py-1 px-5'>Manager</p> :
                        <p className='font-bold text-xs uppercase  bg-indigo-50 text-fuchsia-500 border-2 border-fuchsia-500 rounded-lg inline-block py-1 px-5'>Colaborador</p>
                      }
                    </div>
                    <Link to={`/projects/${project._id}`}
                      className="text-slate-600 cursor-pointer hover:underline text-3xl font-bold"
                    >{project.projectName}</Link>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                      ${project.priority === 'high' ? 'bg-red-100 text-red-800' :
                        project.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                      }`}
                    >
                      {project.priority}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                      ${project.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}
                    >
                      {project.status === 'completed' ? 'Completado' : 'Activo'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    Cliente: {project.clientName}
                  </p>
                  <p className="text-sm text-slate-500">
                    {project.description}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-x-6">
                <Menu as="div" className="relative flex-none">
                  <MenuButton className="-m-2.5 block p-2.5 text-slate-500 hover:text-slate-900">
                    <span className="sr-only">opciones</span>
                    <EllipsisVerticalIcon className="h-9 w-9" aria-hidden="true" />
                  </MenuButton>
                  <Transition as={Fragment} enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95">
                    <MenuItems
                      className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-slate-900/5 focus:outline-none"
                    >
                      <MenuItem>
                        <Link to={`/projects/${project._id}`}
                          className='block px-3 py-1 text-sm leading-6 text-slate-900'>
                          Ver Proyecto
                        </Link>
                      </MenuItem>
                      {project.manager === user._id && (
                        <>
                          <MenuItem>
                            <Link to={`/projects/${project._id}/edit`}
                              className='block px-3 py-1 text-sm leading-6 text-slate-900'>
                              Editar Proyecto
                            </Link>
                          </MenuItem>
                          <MenuItem>
                            <button
                              type='button'
                              className='block px-3 py-1 text-sm leading-6 text-red-500'
                              onClick={() => {
                                const searchParams = new URLSearchParams(location.search);
                                searchParams.set('deleteProject', project._id);
                                navigate(`${location.pathname}?${searchParams.toString()}`);
                              }}
                            >
                              Eliminar Proyecto
                            </button>
                          </MenuItem>
                        </>
                      )}
                    </MenuItems>
                  </Transition>
                </Menu>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-20">
          {statusFilter === 'all' ? (
            <p>No hay Proyectos aun {' '}
              <Link to='/projects/create' className="text-slate-500 font-bold">
                Crear Proyecto
              </Link>
            </p>
          ) : (
            <p>No hay proyectos {statusFilter === 'active' ? 'activos' : 'completados'} {' '}
              <button 
                onClick={() => setStatusFilter('all')}
                className="text-slate-500 font-bold hover:underline"
              >
                Ver todos los proyectos
              </button>
            </p>
          )}
        </div>
      )}
      <DeleteProjectModal />
    </>
  )
}