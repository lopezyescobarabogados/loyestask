import { Tab } from '@headlessui/react';
import { useRole } from '@/hooks/useRole';
import { Navigate } from 'react-router-dom';
import { UserGroupIcon, BellIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import UserManagement from '@/components/admin/UserManagement';
import AdminNotificationPanel from '@/components/admin/AdminNotificationPanel';

// Componente wrapper para las analíticas
function AdminAnalytics() {
    return (
        <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Análisis de Rendimiento del Sistema
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Esta sección mostrará métricas detalladas del sistema y rendimiento de usuarios.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700">
                        💡 <strong>Próximamente:</strong> Gráficos de rendimiento, métricas de productividad y análisis avanzados del sistema.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function AdminView() {
    const { isAdmin } = useRole();
    
    if (!isAdmin) {
        return <Navigate to="/" />;
    }

    const tabs = [
        {
            name: 'Gestión de Usuarios',
            icon: UserGroupIcon,
            component: UserManagement,
        },
        {
            name: 'Sistema de Notificaciones',
            icon: BellIcon,
            component: AdminNotificationPanel,
        },
        {
            name: 'Análisis de Rendimiento',
            icon: ChartBarIcon,
            component: AdminAnalytics,
        },
    ];
    
    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
                <p className="mt-2 text-lg text-gray-600">
                    Gestiona usuarios, notificaciones y analiza el rendimiento del sistema
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
