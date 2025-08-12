import { BellIcon } from '@heroicons/react/24/outline';
import NotificationSettings from "@/components/notifications/NotificationSettings";

export default function NotificationsView() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <BellIcon className="h-8 w-8 mr-3 text-blue-600" />
          Notificaciones
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Gestiona tus recordatorios de tareas y preferencias de notificación
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <NotificationSettings />
      </div>
    </div>
  );
}
