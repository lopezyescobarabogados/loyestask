import { useState } from 'react'
import { Tab, TabGroup, TabList, TabPanels, TabPanel } from '@headlessui/react'
import {
    DocumentTextIcon,
    CreditCardIcon,
    BuildingOffice2Icon,
    ChartBarIcon,
} from '@heroicons/react/24/outline'

// Componente de prueba para Dashboard
function TestFinancialDashboard() {
    return (
        <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Dashboard Financiero</h2>
            <p className="text-gray-600">Dashboard cargado correctamente - sin hooks complejos</p>
        </div>
    )
}

// Componente de prueba para otros módulos
function TestModule({ title }: { title: string }) {
    return (
        <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">{title}</h2>
            <p className="text-gray-600">Módulo {title} cargado correctamente</p>
        </div>
    )
}

export default function DiagnosticFinancialManagement() {
    const [activeTab, setActiveTab] = useState(0)

    const tabs = [
        {
            name: 'Dashboard',
            icon: ChartBarIcon,
            component: <TestFinancialDashboard />
        },
        {
            name: 'Facturas',
            icon: DocumentTextIcon,
            component: <TestModule title="Gestión de Facturas" />
        },
        {
            name: 'Pagos',
            icon: CreditCardIcon,
            component: <TestModule title="Gestión de Pagos" />
        },
        {
            name: 'Cuentas',
            icon: BuildingOffice2Icon,
            component: <TestModule title="Gestión de Cuentas" />
        },
        {
            name: 'Reportes',
            icon: ChartBarIcon,
            component: <TestModule title="Reportes Financieros" />
        }
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Sistema de Gestión Financiera - Diagnóstico
                    </h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Versión de diagnóstico para identificar problemas de carga
                    </p>
                </div>

                <TabGroup selectedIndex={activeTab} onChange={setActiveTab}>
                    <TabList className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-6">
                        {tabs.map((tab) => (
                            <Tab
                                key={tab.name}
                                className={({ selected }) =>
                                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 transition-all ${
                                        selected
                                            ? 'bg-white shadow text-blue-900'
                                            : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-800'
                                    }`
                                }
                            >
                                <div className="flex items-center justify-center space-x-2">
                                    <tab.icon className="h-5 w-5" />
                                    <span>{tab.name}</span>
                                </div>
                            </Tab>
                        ))}
                    </TabList>

                    <TabPanels>
                        {tabs.map((tab, index) => (
                            <TabPanel key={index} className="focus:outline-none">
                                {tab.component}
                            </TabPanel>
                        ))}
                    </TabPanels>
                </TabGroup>
            </div>
        </div>
    )
}
