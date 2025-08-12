import { Fragment, useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild, Switch } from '@headlessui/react';
import { XMarkIcon, BellIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  getTaskNotificationPreference, 
  setTaskNotificationPreference, 
  updateTaskNotificationPreference,
  removeTaskNotificationPreference,
  sendTestReminder
} from '@/api/NotificationAPI';
import type { Task, TaskProject } from '@/types/index';

interface TaskNotificationModalProps {
  task: Task | TaskProject;
  show: boolean;
  onClose: () => void;
}

const reminderOptions = [
  { value: 0, label: 'El mismo día' },
  { value: 1, label: '1 día antes' },
  { value: 2, label: '2 días antes' },
  { value: 3, label: '3 días antes' },
  { value: 7, label: '1 semana antes' },
  { value: 14, label: '2 semanas antes' },
  { value: 30, label: '1 mes antes' },
];

export default function TaskNotificationModal({ task, show, onClose }: TaskNotificationModalProps) {
  const [reminderDays, setReminderDays] = useState(3);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isDailyReminderEnabled, setIsDailyReminderEnabled] = useState(false);
  const [hasExistingPreference, setHasExistingPreference] = useState(false);

  const queryClient = useQueryClient();

  // Consultar preferencia existente
  const { data: existingPreference, isLoading: isLoadingPreference } = useQuery({
    queryKey: ['taskNotificationPreference', task._id],
    queryFn: () => getTaskNotificationPreference(task._id),
    enabled: show,
    retry: false,
  });

  // Configurar valores iniciales cuando se carga la preferencia existente
  useEffect(() => {
    if (existingPreference) {
      setReminderDays(existingPreference.reminderDays);
      setIsEnabled(existingPreference.isEnabled);
      setIsDailyReminderEnabled(existingPreference.isDailyReminderEnabled || false);
      setHasExistingPreference(true);
    } else {
      setReminderDays(3);
      setIsEnabled(true);
      setIsDailyReminderEnabled(false);
      setHasExistingPreference(false);
    }
  }, [existingPreference]);

  // Mutación para crear/actualizar preferencia
  const { mutate: savePreference, isPending: isSaving } = useMutation({
    mutationFn: (data: { reminderDays: number; isEnabled: boolean; isDailyReminderEnabled: boolean }) => {
      if (hasExistingPreference) {
        return updateTaskNotificationPreference(task._id, data);
      } else {
        return setTaskNotificationPreference(task._id, data);
      }
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['taskNotificationPreference', task._id] });
      queryClient.invalidateQueries({ queryKey: ['userNotificationPreferences'] });
      queryClient.invalidateQueries({ queryKey: ['notificationSummary'] });
      onClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Mutación para eliminar preferencia
  const { mutate: removePreference, isPending: isRemoving } = useMutation({
    mutationFn: () => removeTaskNotificationPreference(task._id),
    onSuccess: (message) => {
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['taskNotificationPreference', task._id] });
      queryClient.invalidateQueries({ queryKey: ['userNotificationPreferences'] });
      queryClient.invalidateQueries({ queryKey: ['notificationSummary'] });
      onClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Mutación para enviar recordatorio de prueba
  const { mutate: sendTest, isPending: isSendingTest } = useMutation({
    mutationFn: () => sendTestReminder(task._id),
    onSuccess: (message) => {
      toast.success(message);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSave = () => {
    savePreference({ reminderDays, isEnabled, isDailyReminderEnabled });
  };

  const handleRemove = () => {
    removePreference();
  };

  const handleSendTest = () => {
    if (!hasExistingPreference || !isEnabled) {
      toast.error('Primero debes configurar y activar la notificación');
      return;
    }
    sendTest();
  };

  const formatDueDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Transition appear show={show} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
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
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <DialogTitle as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                    <BellIcon className="h-6 w-6 text-blue-500 mr-2" />
                    Configurar Recordatorio
                  </DialogTitle>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {isLoadingPreference ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Información de la tarea */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">{task.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      {task.dueDate && (
                        <p className="text-sm text-gray-500">
                          <span className="font-medium">Fecha límite:</span> {formatDueDate(task.dueDate)}
                        </p>
                      )}
                    </div>

                    {/* Activar/Desactivar notificación */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-900">
                          Activar recordatorios
                        </label>
                        <p className="text-sm text-gray-500">
                          Recibe un correo cuando se acerque la fecha límite
                        </p>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onChange={setIsEnabled}
                        className={`${
                          isEnabled ? 'bg-blue-600' : 'bg-gray-200'
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                      >
                        <span
                          className={`${
                            isEnabled ? 'translate-x-6' : 'translate-x-1'
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                    </div>

                    {/* Selección de días de anticipación */}
                    {isEnabled && (
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Enviar recordatorio
                        </label>
                        <select
                          value={reminderDays}
                          onChange={(e) => setReminderDays(Number(e.target.value))}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          {reminderOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Activar recordatorios diarios para esta tarea */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-900">
                          Incluir en recordatorios diarios
                        </label>
                        <p className="text-sm text-gray-500">
                          Esta tarea aparecerá en el resumen diario de tareas (8:00 AM)
                        </p>
                      </div>
                      <Switch
                        checked={isDailyReminderEnabled}
                        onChange={setIsDailyReminderEnabled}
                        className={`${
                          isDailyReminderEnabled ? 'bg-orange-600' : 'bg-gray-200'
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2`}
                      >
                        <span
                          className={`${
                            isDailyReminderEnabled ? 'translate-x-6' : 'translate-x-1'
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col space-y-3">
                      <div className="flex space-x-3">
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="flex-1 inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                          {isSaving ? 'Guardando...' : hasExistingPreference ? 'Actualizar' : 'Configurar'}
                        </button>

                        {hasExistingPreference && (
                          <button
                            onClick={handleRemove}
                            disabled={isRemoving}
                            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
                          >
                            {isRemoving ? 'Eliminando...' : 'Eliminar'}
                          </button>
                        )}
                      </div>

                      {/* Botón de prueba */}
                      {hasExistingPreference && isEnabled && (
                        <button
                          onClick={handleSendTest}
                          disabled={isSendingTest}
                          className="w-full inline-flex justify-center items-center rounded-md border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                          <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                          {isSendingTest ? 'Enviando...' : 'Enviar recordatorio de prueba'}
                        </button>
                      )}
                    </div>

                    {/* Información adicional */}
                    {(isEnabled || isDailyReminderEnabled) && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-700">
                          💡 <strong>Tips:</strong>
                        </p>
                        <ul className="text-sm text-blue-700 mt-1 list-disc pl-5 space-y-1">
                          {isEnabled && (
                            <li>Los recordatorios específicos se envían diariamente a las 9:00 AM.</li>
                          )}
                          {isDailyReminderEnabled && (
                            <li>Los recordatorios diarios se envían a las 8:00 AM con un resumen.</li>
                          )}
                          <li>Solo recibirás un recordatorio por día para cada tarea.</li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
