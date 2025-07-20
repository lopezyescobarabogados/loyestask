import NotificationSettings from "@/components/notifications/NotificationSettings";

export default function NotificationsView() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notificaciones</h1>
        <p className="mt-2 text-lg text-gray-600">
          Gestiona tus recordatorios de tareas por correo electrónico
        </p>
      </div>
      
      <NotificationSettings />
    </div>
  );
}
