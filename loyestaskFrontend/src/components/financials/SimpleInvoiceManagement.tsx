export default function SimpleInvoiceManagement() {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Gestión de Facturas</h2>
                <p className="text-gray-600">Módulo de facturas funcionando correctamente.</p>
                
                <div className="mt-6">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        + Nueva Factura
                    </button>
                </div>
                
                <div className="mt-6 border rounded-lg p-4">
                    <p className="text-center text-gray-500">No hay facturas registradas</p>
                </div>
            </div>
        </div>
    )
}
