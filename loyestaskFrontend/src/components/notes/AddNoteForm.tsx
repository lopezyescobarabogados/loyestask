import type { NoteFormData } from '@/types/index'
import { useForm } from 'react-hook-form'
import ErrorMessage from '../ErrorMessage'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createNote } from '@/api/NoteAPI'
import { toast } from 'react-toastify'
import { useLocation, useParams } from 'react-router-dom'

export default function AddNoteForm() {
    const params = useParams()
    const location = useLocation()
    const queryParams = new URLSearchParams(location.search)
    const projectId = params.projectId!
    const taskId = queryParams.get('viewTask')!
    const initialValues : NoteFormData = {
        content: ''
    }
    const { register, handleSubmit, reset, formState: { errors } } = useForm({defaultValues: initialValues})
    const queryClient = useQueryClient()
    const { mutate } = useMutation({
        mutationFn: createNote,
        onError: (error) => {
            toast.error(error.message)
        },
        onSuccess: (data) => {
            toast.success(data)
            queryClient.invalidateQueries({queryKey: ['task', taskId]})
        }
    })
    const handleAddNote = (formData: NoteFormData) => {
        mutate({ formData, projectId, taskId })
        reset()
    }
    return (
        <form
            onSubmit={handleSubmit(handleAddNote)}
            className="space-y-4 bg-white p-6 rounded-lg shadow-md border border-slate-200"
            noValidate
        >
            <div
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
                <label className="font-bold" htmlFor="content">Nota</label>
                <input
                    type="text"
                    id="content"
                    className="border border-slate-300 p-2 rounded-md w-full"
                    placeholder="Escribe tu nota aquí."
                    {...register('content', {
                        required: 'El contenido de la nota es obligatorio',
                    })}
                />
                {errors.content && (
                    <ErrorMessage>{errors.content?.message}</ErrorMessage>
                )}
            </div>
            <input
                type="submit"
                value="Crear Nota"
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 font-black rounded-lg transition-colors w-full p-2 cursor-pointer"
            />
        </form>
    )
}
