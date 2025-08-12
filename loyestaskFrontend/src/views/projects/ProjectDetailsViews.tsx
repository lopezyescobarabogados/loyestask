import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import { useQuery } from '@tanstack/react-query'
import { getFullProject } from "@/api/ProjectAPI"
import AddTaskModal from "@/components/tasks/AddTaskModal"
import TaskList from "@/components/tasks/TaskList"
import EditTaskData from "@/components/tasks/EditTaskData"
import TaskModalDetails from "@/components/tasks/TaskModalDetails"
import ProjectStatusForm from "@/components/projects/ProjectStatusForm"
import PDFGenerationModal from "@/components/projects/PDFGenerationModal"
import { useAuth } from "@/hooks/useAuth"
import { isManager } from "@/utils/polices"
import { useMemo, useState } from "react"

export default function ProjectDetailsViews() {
  const { data: user, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const params = useParams()
  const projectId = params.projectId!
  const [showPDFModal, setShowPDFModal] = useState(false)
  
  // Detectar modal de estado en URL
  const showStatusModal = new URLSearchParams(location.search).has('editStatus')
  
  const { data, isLoading, isError } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getFullProject(projectId),
    retry: false
  })
  
  const canEdit = useMemo(() => data?.manager === user?._id, [data, user])
  
  if (isLoading && authLoading) return 'Cargando...'
  if (isError) return <Navigate to='/404' />
  if (data && user) return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-5xl font-black">{data.projectName}</h1>
          <p className="text-2xl font-light text-slate-500 mt-5">{data.description}</p>
        </div>
        {isManager(data.manager, user._id) && (
          <div className="flex flex-col items-end gap-2">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              data.status === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {data.status === 'completed' ? 'Completado' : 'Activo'}
            </span>
            <button
              type="button"
              className="text-sm text-slate-600 hover:text-slate-800 underline"
              onClick={() => navigate(location.pathname + '?editStatus=true')}
            >
              Cambiar Estado
            </button>
          </div>
        )}
      </div>
      
      {/* Navegación disponible para managers y colaboradores */}
      <nav className="my-5 flex gap-3">
        {isManager(data.manager, user._id) && (
          <>
            <button
              type="button"
              className="bg-slate-400 hover:bg-slate-500 px-10 py-3 text-white text-xl font-bold cursor-pointer transition-colors"
              onClick={() => navigate(location.pathname + '?newTask=true')}
            >Agregar Tarea</button>
            <Link
              className="bg-slate-500 hover:bg-slate-600 px-10 py-3 text-white text-xl font-bold cursor-pointer transition-colors"
              to={'team'}
            >Colaboradores</Link>
          </>
        )}
        
        {/* Botón PDF disponible para managers y colaboradores */}
        <button
          type="button"
          className="bg-blue-500 hover:bg-blue-600 px-10 py-3 text-white text-xl font-bold cursor-pointer transition-colors"
          onClick={() => setShowPDFModal(true)}
        >Generar PDF</button>
      </nav>
      
      <TaskList
        tasks={data.tasks}
        canEdit={canEdit}
      />
      
      <AddTaskModal />
      <EditTaskData />
      <TaskModalDetails />
      <ProjectStatusForm 
        show={showStatusModal} 
        currentStatus={data.status} 
      />
      <PDFGenerationModal 
        projectId={projectId}
        isOpen={showPDFModal}
        onClose={() => setShowPDFModal(false)}
      />
    </>
  )
}
