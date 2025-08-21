import { useRole } from '@/hooks/useRole'
import { Navigate } from 'react-router-dom'
import FinancialManagement from '@/components/financial/FinancialManagement'

export default function FinancialView() {
    const { isAdmin } = useRole()
    
    // Solo administradores pueden acceder al módulo financiero
    if (!isAdmin) {
        return <Navigate to="/" />
    }

    return <FinancialManagement />
}
