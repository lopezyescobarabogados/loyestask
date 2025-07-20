import type { FieldErrors, UseFormRegister } from "react-hook-form"
import type { TaskFormData } from "@/types/index";
import ErrorMessage from "../ErrorMessage";

type TaskFormProps = {
    errors: FieldErrors<TaskFormData>
    register: UseFormRegister<TaskFormData>
}

export default function TaskForm({ errors, register }: TaskFormProps) {
    return (
        <>
            <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8 space-y-8">
                <h2 className="text-3xl font-black text-slate-700 mb-6">Nueva Tarea</h2>

                <div className="flex flex-col gap-3">
                    <label className="text-lg text-slate-600 font-semibold mb-1" htmlFor="name">
                        Nombre de la tarea
                    </label>
                    <input
                        id="name"
                        type="text"
                        placeholder="Nombre de la tarea"
                        className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                        {...register("name", { required: "El nombre de la tarea es obligatorio" })}
                    />
                    {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
                </div>

                <div className="flex flex-col gap-3">
                    <label className="text-lg text-slate-600 font-semibold mb-1" htmlFor="description">
                        Descripción de la tarea
                    </label>
                    <textarea
                        id="description"
                        placeholder="Descripción de la tarea"
                        className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                        {...register("description", { required: "La descripción de la tarea es obligatoria" })}
                    />
                    {errors.description && <ErrorMessage>{errors.description.message}</ErrorMessage>}
                </div>

                <div className="flex flex-col gap-3">
                    <label className="text-lg text-slate-600 font-semibold mb-1" htmlFor="dueDate">
                        Fecha límite
                    </label>
                    <input
                        id="dueDate"
                        type="date"
                        className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                        {...register("dueDate", { required: "La fecha límite es obligatoria" })}
                    />
                    {errors.dueDate && <ErrorMessage>{errors.dueDate.message}</ErrorMessage>}
                </div>
            </div>
        </>
    )
}
