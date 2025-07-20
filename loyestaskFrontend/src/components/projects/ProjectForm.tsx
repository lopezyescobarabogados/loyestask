import { useState } from 'react';
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import ErrorMessage from "../ErrorMessage";
import type { ProjectFormData } from "types"

type ProjectFormProps = {
    register: UseFormRegister<ProjectFormData>
    errors: FieldErrors<ProjectFormData>
}

export default function ProjectForm({errors, register} : ProjectFormProps) {
    const [priority, setPriority] = useState<string>('');

    // Función para obtener las clases según la prioridad
    const getPriorityClasses = () => {
        switch(priority) {
            case 'alta':
                return 'bg-red-100 border-red-500 text-red-700';
            case 'media':
                return 'bg-yellow-100 border-yellow-500 text-yellow-700';
            case 'baja':
                return 'bg-green-100 border-green-500 text-green-700';
            default:
                return 'border-gray-200';
        }
    };

    return (
        <>
            <div className="mb-5 space-y-3">
                <label htmlFor="projectName" className="text-sm uppercase font-bold">
                    Nombre del Proyecto
                </label>
                <input
                    id="projectName"
                    className="w-full p-3 border border-gray-300"
                    type="text"
                    placeholder="Nombre del Proyecto"
                    {...register("projectName", {
                        required: "El Titulo del Proyecto es obligatorio",
                    })}
                />

                {errors.projectName && (
                    <ErrorMessage>{errors.projectName.message}</ErrorMessage>
                )}
            </div>

            <div className="mb-5 space-y-3">
                <label htmlFor="clientName" className="text-sm uppercase font-bold">
                    Nombre Cliente
                </label>
                <input
                    id="clientName"
                    className="w-full p-3 border border-gray-200"
                    type="text"
                    placeholder="Nombre del Cliente"
                    {...register("clientName", {
                        required: "El Nombre del Cliente es obligatorio",
                    })}
                />

                {errors.clientName && (
                    <ErrorMessage>{errors.clientName.message}</ErrorMessage>
                )}
            </div>

            <div className="mb-5 space-y-3">
                <label htmlFor="description" className="text-sm uppercase font-bold">
                    Descripción
                </label>
                <textarea
                    id="description"
                    className="w-full p-3 border border-gray-200"
                    placeholder="Descripción del Proyecto"
                    {...register("description", {
                        required: "Una descripción del proyecto es obligatoria"
                    })}
                />

                {errors.description && (
                    <ErrorMessage>{errors.description.message}</ErrorMessage>
                )}
            </div>

            <div className="mb-5 space-y-3">
                <label htmlFor="priority" className="text-sm uppercase font-bold">
                    Prioridad
                </label>
                <select
                    id="priority"
                    className={`w-full p-3 border rounded ${getPriorityClasses()}`}
                    {...register("priority", {
                        required: "La prioridad es obligatoria"
                    })}
                    onChange={(e) => setPriority(e.target.value)}
                >
                    <option value="">Seleccione una prioridad</option>
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Baja</option>
                </select>

                {errors.priority && (
                    <ErrorMessage>{errors.priority.message}</ErrorMessage>
                )}
            </div>
        </>
    )
}