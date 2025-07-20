import { deleteNote } from "@/api/NoteAPI"
import { useAuth } from "@/hooks/useAuth"
import type { Note } from "@/types/index"
import { formatDateForDisplay } from "@/utils/dateUtils"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { useLocation, useParams } from "react-router-dom"
import { toast } from "react-toastify"

type NoteDetailProps = {
    note: Note
}

export default function NoteDetail({ note }: NoteDetailProps) {
    const { data, isLoading } = useAuth()
    const canDelete = useMemo(() => data?._id === note.createdBy._id, [data, note.createdBy._id])
    const params = useParams()
    const location = useLocation()
    const queryParams = new URLSearchParams(location.search)
    const projectId = params.projectId!
    const taskId = queryParams.get('viewTask')!
    const queryClient = useQueryClient()
    const { mutate } = useMutation({
        mutationFn: deleteNote,
        onError: (error) => {
            toast.error(error.message)
        },
        onSuccess: (data) => {
            toast.success(data)
            queryClient.invalidateQueries({ queryKey: ['task', taskId] })
        }
    })
    if (isLoading) return <p>Cargando...</p>
    return (
        <div className="py-3 flex justify-between items-center">
            <div>
                <p className="text-sm text-slate-900">
                    {note.content} : <span className="font-bold">{note.createdBy.name}</span>
                </p>
                <p className="text-sm text-slate-600">
                    {formatDateForDisplay(note.createdAt)}
                </p>
            </div>
            {canDelete && (
                <button
                    type="button"
                    className="bg-red-400 hover:bg-red-500 p-2 text-xs text-white font-bold cursor-pointer rounded-lg transition-colors"
                    onClick={() => mutate({ projectId, taskId, noteId: note._id })}>
                    Eliminar
                </button>
            )}
        </div>
    )
}
