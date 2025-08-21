import { useState } from 'react'
import ClientManagement from '@/components/financials/ClientManagement'
import DebtManagement from '@/components/financials/DebtManagement'
import { useQuery } from '@tanstack/react-query'
import { ClientAPI, DebtAPI } from '@/api/ClientDebtAPI'
import { formatCurrency } from '@/utils/financialUtils'

type TabType = 'overview' | 'clients' | 'debts' | 'reports'

export default function ClientDebtView() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  // Obtener estadísticas generales
  const { data: clientStats } = useQuery({
    queryKey: ['clientStats'],
    queryFn: ClientAPI.getStats
  })

  const { data: debtStats } = useQuery({
    queryKey: ['debtStats'],
    queryFn: () => DebtAPI.getStats()
  })

  const { data: overdueDebts } = useQuery({
    queryKey: ['overdueDebts'],
    queryFn: DebtAPI.getOverdue
  })

  const tabs = [
    { id: 'overview', name: 'Resumen', icon: '📊' },
    { id: 'clients', name: 'Clientes', icon: '👥' },
    { id: 'debts', name: 'Deudas', icon: '💰' },
    { id: 'reports', name: 'Reportes', icon: '📈' }
  ]

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Clientes</p>
              <p className="text-2xl font-bold text-gray-900">{clientStats?.totalClients || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Deuda Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(debtStats?.totalAmount?.remaining || 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Deudas Vencidas</p>
              <p className="text-2xl font-bold text-gray-900">{debtStats?.overdueCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Cobrado</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(debtStats?.totalAmount?.paid || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Deudas Vencidas - Alerta */}
      {overdueDebts && overdueDebts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-medium text-red-800">
              Deudas Vencidas ({overdueDebts.length})
            </h3>
          </div>
          <div className="space-y-3">
            {overdueDebts.slice(0, 5).map((debt) => (
              <div key={debt._id} className="flex justify-between items-center bg-white p-3 rounded-md">
                <div>
                  <p className="font-medium text-gray-900">
                    {typeof debt.client === 'object' ? debt.client.name : 'Cliente desconocido'}
                  </p>
                  <p className="text-sm text-gray-600">{debt.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-red-600">{formatCurrency(debt.remainingAmount)}</p>
                  <p className="text-sm text-gray-500">Vencida</p>
                </div>
              </div>
            ))}
            {overdueDebts.length > 5 && (
              <button
                onClick={() => setActiveTab('debts')}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Ver todas las deudas vencidas ({overdueDebts.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Distribución por Estado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Clientes por Tipo</h3>
          {clientStats?.clientsByType && (
            <div className="space-y-3">
              {clientStats.clientsByType.map((item) => (
                <div key={item._id} className="flex justify-between items-center">
                  <span className="text-gray-600 capitalize">
                    {item._id === 'individual' ? 'Persona Natural' :
                     item._id === 'company' ? 'Empresa' : 'Entidad Gubernamental'}
                  </span>
                  <span className="font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Deudas por Estado</h3>
          {debtStats?.debtsByStatus && (
            <div className="space-y-3">
              {debtStats.debtsByStatus.map((item) => (
                <div key={item._id} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                      item._id === 'pending' ? 'bg-yellow-400' :
                      item._id === 'partial' ? 'bg-orange-400' :
                      item._id === 'paid' ? 'bg-green-400' :
                      item._id === 'overdue' ? 'bg-red-400' : 'bg-gray-400'
                    }`}></span>
                    <span className="text-gray-600 capitalize">
                      {item._id === 'pending' ? 'Pendiente' :
                       item._id === 'partial' ? 'Parcial' :
                       item._id === 'paid' ? 'Pagada' :
                       item._id === 'overdue' ? 'Vencida' : item._id}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{item.count}</div>
                    <div className="text-sm text-gray-500">{formatCurrency(item.amount)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveTab('clients')}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left transition-colors"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Nuevo Cliente</p>
                <p className="text-sm text-gray-500">Agregar cliente al sistema</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('debts')}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left transition-colors"
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Nueva Deuda</p>
                <p className="text-sm text-gray-500">Registrar nueva deuda</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left transition-colors"
          >
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Ver Reportes</p>
                <p className="text-sm text-gray-500">Análisis y reportes</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )

  const renderReports = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Reportes y Análisis</h3>
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Reportes Avanzados</h3>
        <p className="text-gray-600 mb-4">Los reportes detallados estarán disponibles próximamente</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900">Reporte de Cobranza</h4>
            <p className="text-sm text-gray-500 mt-1">Análisis de efectividad de cobranza</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900">Flujo de Caja</h4>
            <p className="text-sm text-gray-500 mt-1">Proyección de ingresos por cobrar</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900">Análisis de Clientes</h4>
            <p className="text-sm text-gray-500 mt-1">Rentabilidad y comportamiento</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900">Reporte de Vencimientos</h4>
            <p className="text-sm text-gray-500 mt-1">Próximos vencimientos y alertas</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes y Deudas</h1>
          <p className="text-sm text-gray-600">Administra tus clientes, deudas y pagos</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'clients' && <ClientManagement />}
        {activeTab === 'debts' && <DebtManagement />}
        {activeTab === 'reports' && renderReports()}
      </div>
    </div>
  )
}
