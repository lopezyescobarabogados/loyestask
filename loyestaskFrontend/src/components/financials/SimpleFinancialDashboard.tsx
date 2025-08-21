export default function SimpleFinancialDashboard() {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Financiero</h2>
                <p className="text-gray-600">Sistema financiero funcionando correctamente.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-900">Ingresos</h3>
                        <p className="text-2xl font-bold text-blue-700">$0</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-green-900">Gastos</h3>
                        <p className="text-2xl font-bold text-green-700">$0</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-purple-900">Balance</h3>
                        <p className="text-2xl font-bold text-purple-700">$0</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
