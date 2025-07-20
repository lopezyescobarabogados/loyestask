import { Link, useNavigate } from "react-router-dom";
import ProjectForm from "./ProjectForm";
import type { Project, ProjectFormData } from "@/types/index";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProject, updateProjectPriority } from "@/api/ProjectAPI";
import { toast } from "react-toastify";

type EditProjectFormProps = {
    data: ProjectFormData
    projectId: Project['_id']
}

export default function EditProjectForm({ data, projectId }: EditProjectFormProps) {
    const navigate = useNavigate()

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            projectName: data.projectName,
            clientName: data.clientName,
            description: data.description,
            priority: data.priority,
        }
    })

    const queryClient = useQueryClient()

    const { mutate: mutatePriority, isPending: isPendingPriority } = useMutation({
        mutationFn: updateProjectPriority,
        onError: (error) => {
            toast.error(error.message)
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['projects'] })
            queryClient.invalidateQueries({ queryKey: ['editProject', projectId] })
            toast.success(data)
            navigate("/")
        }
    })

    const { mutate, isPending } = useMutation({
        mutationFn: updateProject,
        onError: (error) => {
            toast.error(error.message)
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['projects'] })
            queryClient.invalidateQueries({ queryKey: ['editProject', projectId] })
            toast.success(data)
            navigate("/")
        }
    })

    const handleForm = (formData: ProjectFormData) => {
        // Si la prioridad cambió, primero actualiza la prioridad
        if (formData.priority !== data.priority) {
            mutatePriority({ formData: { priority: formData.priority }, projectId })
        } else {
            // Si no cambió, actualiza el resto del proyecto
            mutate({ formData, projectId })
        }
    }

    return (
        <>
            <div className="max-w-3xl mx-auto">
                <h1 className="text-5xl font-black text-slate-700">Editar Proyecto</h1>
                <p className="text-2xl font-light text-slate-500 mt-5">Llena el siguiente formulario para Editar el Proyecto</p>

                <nav className="my-5">
                    <Link
                        className="bg-slate-600 hover:bg-slate-700 px-10 py-3 text-white text-xl font-bold rounded-lg cursor-pointer transition-colors"
                        to="/"
                    >
                        Volver a Proyectos
                    </Link>
                </nav>

                <form
                    className="mt-10 bg-white shadow-lg p-10 rounded-lg space-y-8"
                    onSubmit={handleSubmit(handleForm)}
                    noValidate
                >
                    <ProjectForm
                        register={register}
                        errors={errors}
                    />

                    <input
                        type="submit"
                        value={isPending || isPendingPriority ? "Guardando..." : "Guardar Proyecto"}
                        disabled={isPending || isPendingPriority}
                        className={`w-full p-4 text-white uppercase font-bold rounded-lg cursor-pointer transition-colors ${isPending || isPendingPriority ? "bg-slate-400" : "bg-slate-600 hover:bg-slate-700"}`}
                    />
                </form>
            </div>
        </>
    )
}
