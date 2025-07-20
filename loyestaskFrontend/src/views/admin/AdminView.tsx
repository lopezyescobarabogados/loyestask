import { useRole } from '@/hooks/useRole'
import { Navigate } from 'react-router-dom'
import UserManagement from '@/components/admin/UserManagement'

export default function AdminView() {
    const { isAdmin } = useRole()
    
    if (!isAdmin) {
        return <Navigate to="/" />
    }
    
    return <UserManagement />
}
