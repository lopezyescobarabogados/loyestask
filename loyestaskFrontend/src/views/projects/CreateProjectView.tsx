import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { useMutation } from '@tanstack/react-query'
import { toast } from "react-toastify"
import ProjectForm from "@/components/projects/ProjectForm"
import type { ProjectFormData } from "@/types/index"
import { createProject } from "@/api/ProjectAPI"

export default function CreateProjectView() {
    const navigate = useNavigate()
    const initialValues: ProjectFormData = {
        projectName: "",
        clientName: "",
        description: "",
        priority: "",
    }
    
    const { register, handleSubmit, formState: { errors }} = useForm({ 
        defaultValues: initialValues 
    })
    
    const { mutate, isPending } = useMutation({
        mutationFn: createProject,
        onError: (error) => {
            toast.error(error.message)
        },
        onSuccess: (data) => {
            toast.success(data)
            navigate("/")
        }
    })

    const handleForm = (formData: ProjectFormData) => {
        mutate(formData)
    }
    
    return (
        <>
            <div className="max-w-3xl mx-auto">
                <h1 className="text-5xl font-black">Crear Proyecto</h1>
                <p className="text-2xl font-light text-slate-500 mt-5">Llena el siguiente formulario para crear un Proyecto</p>
                
                <nav className="my-5">
                    <Link
                        className="bg-slate-500 hover:bg-slate-300 px-10 py-3 text-white text-xl
                        font-bold cursor-pointer transition-colors"
                        to="/"
                    >
                        Volver a Proyectos
                    </Link>
                </nav>
                
                <form 
                    className="mt-10 bg-white shadow-lg p-10 rounded-lg" 
                    onSubmit={handleSubmit(handleForm)} 
                    noValidate
                >
                    <ProjectForm 
                        register={register} 
                        errors={errors}
                    />
                    
                    <input
                        type="submit" 
                        value={isPending ? "Guardando..." : "Crear Proyecto"}
                        disabled={isPending}
                        className={`w-full p-3 text-white uppercase font-bold cursor-pointer transition-colors ${
                            isPending ? "bg-slate-400" : "bg-slate-600 hover:bg-slate-700"
                        }`} 
                    />
                </form>
            </div>
        </>
    )
}