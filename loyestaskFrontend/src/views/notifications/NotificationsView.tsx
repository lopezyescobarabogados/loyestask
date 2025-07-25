import { Tab } from '@headlessui/react';
import { BellIcon, ChartBarIcon, ChartPieIcon } from '@heroicons/react/24/outline';
import NotificationSettings from "@/components/notifications/NotificationSettings";
import NotificationDashboard from "@/components/notifications/NotificationDashboard";
import NotificationMetrics from "@/components/notifications/NotificationMetrics";

export default function NotificationsView() {
  const tabs = [
    {
      name: 'Configuración',
      icon: BellIcon,
      component: NotificationSettings,
    },
    {
      name: 'Dashboard',
      icon: ChartBarIcon,
      component: NotificationDashboard,
    },
    {
      name: 'Métricas',
      icon: ChartPieIcon,
      component: NotificationMetrics,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notificaciones</h1>
        <p className="mt-2 text-lg text-gray-600">
          Gestiona tus recordatorios de tareas y monitorea el sistema de notificaciones
        </p>
      </div>
      
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-6">
          {tabs.map((tab) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 transition-all
                 ${
                   selected
                     ? 'bg-white shadow'
                     : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                 }`
              }
            >
              <div className="flex items-center justify-center space-x-2">
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </div>
            </Tab>
          ))}
        </Tab.List>
        
        <Tab.Panels>
          {tabs.map((tab, idx) => (
            <Tab.Panel
              key={idx}
              className="rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-60"
            >
              <tab.component />
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
