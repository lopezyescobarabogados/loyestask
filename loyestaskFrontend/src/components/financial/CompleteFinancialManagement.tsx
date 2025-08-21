import { useState } from 'react'
import { Tab, TabGroup, TabList, TabPanels, TabPanel } from '@headlessui/react'
import {
    CurrencyDollarIcon,
    DocumentTextIcon,
    CreditCardIcon,
    BuildingOffice2Icon,
    ChartBarIcon,
    PlusIcon
} from '@heroicons/react/24/outline'
import ProgressiveFinancialDashboard from '../financials/ProgressiveFinancialDashboard'
import ProgressiveInvoiceManagement from '../financials/ProgressiveInvoiceManagement'
import ProgressivePaymentManagement from '../financials/ProgressivePaymentManagement'
import ProgressiveAccountManagement from '../financials/ProgressiveAccountManagement'
import ProgressiveFinancialReports from '../financials/ProgressiveFinancialReports'

export default function CompleteFinancialManagement() {
    const [activeTab, setActiveTab] = useState(0)

    const tabs = [
        {
            name: 'Dashboard',
            icon: ChartBarIcon,
            component: ProgressiveFinancialDashboard,
        },
        {
            name: 'Facturas',
            icon: DocumentTextIcon,
            component: ProgressiveInvoiceManagement,
        },
        {
            name: 'Pagos',
            icon: CreditCardIcon,
            component: ProgressivePaymentManagement,
        },
        {
            name: 'Cuentas',
            icon: BuildingOffice2Icon,
            component: ProgressiveAccountManagement,
        },
        {
            name: 'Reportes',
            icon: CurrencyDollarIcon,
            component: ProgressiveFinancialReports,
        },
    ]

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
                <div className="md:flex md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Gestión Financiera
                        </h1>
                        <p className="mt-2 text-lg text-gray-600">
                            Administra facturas, pagos, cuentas y genera reportes financieros detallados
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0 md:ml-4">
                        <div className="flex space-x-3">
                            <button
                                type="button"
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                onClick={() => setActiveTab(1)}
                            >
                                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                                Nueva Factura
                            </button>
                            <button
                                type="button"
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                onClick={() => setActiveTab(2)}
                            >
                                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                                Nuevo Pago
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <TabGroup selectedIndex={activeTab} onChange={setActiveTab}>
                <TabList className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-6">
                    {tabs.map((tab, index) => (
                        <Tab
                            key={index}
                            className={({ selected }) =>
                                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200
                                 ${
                                     selected
                                         ? 'bg-white text-blue-700 shadow'
                                         : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                                 }`
                            }
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <tab.icon className="h-5 w-5" />
                                <span className="hidden sm:inline">{tab.name}</span>
                            </div>
                        </Tab>
                    ))}
                </TabList>

                {/* Tab Panels */}
                <TabPanels>
                    {tabs.map((tab, index) => (
                        <TabPanel
                            key={index}
                            className="rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-60"
                        >
                            <div className="min-h-[600px]">
                                <tab.component />
                            </div>
                        </TabPanel>
                    ))}
                </TabPanels>
            </TabGroup>
        </div>
    )
}
