import { Tab, TabGroup, TabList, TabPanels, TabPanel } from '@headlessui/react';
import { useRole } from '@/hooks/useRole';
import { Navigate } from 'react-router-dom';
import { UserGroupIcon, BellIcon, ChartBarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import UserManagement from '@/components/admin/UserManagement';
import AdminNotificationPanel from '@/components/admin/AdminNotificationPanel';
import FinancialManagement from '@/components/financial/FinancialManagement';
import PerformanceAnalyticsView from '@/views/admin/PerformanceAnalyticsView';

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
            component: PerformanceAnalyticsView,
        },
        {
            name: 'Gestión Financiera',
            icon: CurrencyDollarIcon,
            component: FinancialManagement,
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
            
            <TabGroup>
                <TabList className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-6">
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
                </TabList>
                
                <TabPanels>
                    {tabs.map((tab, idx) => (
                        <TabPanel
                            key={idx}
                            className="rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-60"
                        >
                            <tab.component />
                        </TabPanel>
                    ))}
                </TabPanels>
            </TabGroup>
        </div>
    );
}
