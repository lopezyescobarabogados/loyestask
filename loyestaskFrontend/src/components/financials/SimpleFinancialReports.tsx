export default function SimpleFinancialReports() {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Reportes Financieros</h2>
                <p className="text-gray-600">Módulo de reportes funcionando correctamente.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">Reporte de Ingresos</h3>
                        <p className="text-gray-500">Próximamente disponible</p>
                    </div>
                    <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">Reporte de Gastos</h3>
                        <p className="text-gray-500">Próximamente disponible</p>
                    </div>
                    <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">Balance General</h3>
                        <p className="text-gray-500">Próximamente disponible</p>
                    </div>
                    <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">Flujo de Caja</h3>
                        <p className="text-gray-500">Próximamente disponible</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
