import { useRole } from '@/hooks/useRole'
import { useAuth } from '@/hooks/useAuth'

export default function FinancialDiagnostic() {
    const { isAdmin, role } = useRole()
    const { data: user, isLoading } = useAuth()

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-yellow-800">Cargando autenticación...</h2>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    Diagnóstico - Gestión Financiera
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                    Verificando permisos y configuración
                </p>
            </div>
            
            <div className="grid gap-6">
                {/* Estado de autenticación */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Estado de Autenticación
                    </h2>
                    <div className="space-y-2">
                        <p><strong>Usuario:</strong> {user?.email || 'No autenticado'}</p>
                        <p><strong>Rol:</strong> {role || 'Sin rol'}</p>
                        <p><strong>Es Admin:</strong> {isAdmin ? '✅ Sí' : '❌ No'}</p>
                        <p><strong>ID:</strong> {user?._id || 'No disponible'}</p>
                    </div>
                </div>

                {/* Permisos */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Verificación de Permisos
                    </h2>
                    <div className="space-y-2">
                        {isAdmin ? (
                            <div className="text-green-600">
                                <p>✅ Acceso autorizado al módulo financiero</p>
                                <p>✅ Permisos de administrador verificados</p>
                            </div>
                        ) : (
                            <div className="text-red-600">
                                <p>❌ Acceso denegado - Se requieren permisos de administrador</p>
                                <p>❌ Usuario actual no tiene rol de admin</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Información del sistema */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Información del Sistema
                    </h2>
                    <div className="space-y-2">
                        <p><strong>Ruta actual:</strong> /admin/financial</p>
                        <p><strong>Componente:</strong> FinancialDiagnostic</p>
                        <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
