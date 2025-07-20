import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import ErrorMessage from "../ErrorMessage";
import type { teamMemberForm } from "@/types/index";
import { findUserByEmail } from "@/api/TeamAPI";
import SearchResult from "./SearchResult";

export default function AddMemberForm() {
    const initialValues: teamMemberForm = {
        email: ''
    }
    const params = useParams()
    const projectId = params.projectId!

    const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: initialValues })

    const mutation = useMutation({
        mutationFn: findUserByEmail,
        onError: () => {

        },
        onSuccess: () => {

        }
    })

    const handleSearchUser = async (formData: teamMemberForm) => {
        const data = { projectId, formData }
        mutation.mutate(data)
    }

    const resetData = () => {
        reset()
        mutation.reset()
    }

    return (
        <>
            <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg p-10 space-y-8">
                <h2 className="text-3xl font-black text-slate-700 mb-6">Buscar Usuario</h2>
                <form
                    className="space-y-6"
                    onSubmit={handleSubmit(handleSearchUser)}
                    noValidate
                >
                    <div className="flex flex-col gap-3">
                        <label
                            className="text-slate-500 text-lg font-semibold mb-1"
                            htmlFor="email"
                        >E-mail de Usuario</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="E-mail del usuario a agregar"
                            className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                            {...register("email", {
                                required: "El Email es obligatorio",
                                pattern: {
                                    value: /\S+@\S+\.\S+/,
                                    message: "E-mail no válido",
                                },
                            })}
                        />
                        {errors.email && (
                            <ErrorMessage>{errors.email.message}</ErrorMessage>
                        )}
                    </div>
                    <input
                        type="submit"
                        className="bg-slate-700 hover:bg-slate-800 w-full p-4 text-white font-bold text-xl rounded-lg cursor-pointer transition-colors"
                        value='Buscar Usuario'
                    />
                </form>
                <div className="mt-10">
                    {mutation.isPending && <p className="text-center text-slate-500">Cargando...</p>}
                    {mutation.isError && <p className="text-center text-red-500">{mutation.error.message}</p>}
                    {mutation.data && <SearchResult user={mutation.data} reset={resetData} />}
                </div>
            </div>
        </>
    )
}