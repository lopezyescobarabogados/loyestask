import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { teamMember } from "@/types/index";
import { addUserToProject } from "@/api/TeamAPI";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";

type SearchResultProps = {
    user: teamMember
    reset: () => void
}

export default function SearchResult({ user, reset }: SearchResultProps) {
    const navigate = useNavigate()
    const params = useParams()
    const projectId = params.projectId!
    const queryClient = useQueryClient()
    const { mutate } = useMutation({
        mutationFn: addUserToProject,
        onError: (error) => {
            toast.error(error.message)
        },
        onSuccess: (data) => {
            toast.success(data)
            reset()
            navigate(location.pathname, { replace: true })
            queryClient.invalidateQueries({ queryKey: ['projectTeam', projectId] })
        }
    })
    const handleAddUserToProject = () => {
        const data = {
            projectId,
            id: user._id
        }
        mutate(data)
    }
    return (
        <>
            <p className="mt-10 text-center font-bold text-slate-700">Resultado:</p>
            <div className="flex justify-between items-center bg-white rounded-xl shadow p-6 mt-4 border border-slate-200">
                <p className="text-xl font-bold text-slate-600">{user.name}</p>
                <button
                    className="bg-slate-700 hover:bg-slate-800 text-white px-8 py-3 font-bold rounded-lg transition-colors"
                    onClick={handleAddUserToProject}
                >
                    Agregar al Proyecto
                </button>
            </div>
        </>
    )
}
