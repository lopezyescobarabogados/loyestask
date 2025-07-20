import { Fragment } from "react";
import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import TaskForm from "./TaskForm";
import type { TaskFormData } from "@/types/index";
import { createTask } from "@/api/TaskAPI";
import { toast } from "react-toastify";
import { normalizeDateForApi } from "@/utils/dateUtils";

export default function AddTaskModal() {
  const navigate = useNavigate()
  /** leer si modal existe */
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const modalTask = queryParams.get('newTask')
  const show = modalTask ? true : false
  /** obtener projectId */
  const params = useParams()
  const projectId = params.projectId!
  const initialValues: TaskFormData = {
    name: '',
    description: '',
    dueDate: '',
  }
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: initialValues })
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: createTask,
    onError: (error) => {
      toast.error(error.message)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      toast.success(data)
      reset()
      navigate(location.pathname, { replace: true })
    }
  })
  const handleCreateTask = (formData: TaskFormData) => {
    // Normalize the dueDate to avoid timezone issues
    const normalizedFormData = {
      ...formData,
      dueDate: normalizeDateForApi(formData.dueDate)
    }
    
    const data = {
      formData: normalizedFormData,
      projectId
    }
    mutate(data)
  }
  return (
    <>
      <Transition appear show={show} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => navigate(location.pathname, {
          replace: true
        })}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white border border-slate-200 text-left align-middle shadow-xl transition-all p-16">
                  <DialogTitle as="h3" className="font-black text-4xl text-slate-700 my-5">
                    Nueva Tarea
                  </DialogTitle>
                  <p className="text-xl font-bold text-slate-500 mb-8">
                    Llena el formulario y crea <span className="text-slate-700">una tarea</span>
                  </p>
                  <form
                    className="mt-10 space-y-6"
                    onSubmit={handleSubmit(handleCreateTask)}
                    noValidate
                  >
                    <TaskForm
                      register={register}
                      errors={errors}
                    />
                    <input
                      type="submit"
                      value={isPending ? "Guardando..." : "Guardar Tarea"}
                      disabled={isPending}
                      className={`w-full p-4 text-white font-black text-xl rounded-lg cursor-pointer transition-colors ${isPending ? "bg-slate-400" : "bg-slate-700 hover:bg-slate-800"}`}
                    />
                  </form>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
