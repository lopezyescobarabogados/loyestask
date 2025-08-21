export default function SimpleFinancialManagement() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    Gestión Financiera - Diagnóstico
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                    Sistema financiero cargado correctamente
                </p>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Estado del Sistema
                </h2>
                <div className="space-y-2">
                    <p className="text-green-600">✅ Componente cargado</p>
                    <p className="text-green-600">✅ Estilos aplicados</p>
                    <p className="text-green-600">✅ Sin errores de importación</p>
                </div>
            </div>
        </div>
    )
}
