import { useAuth } from './useAuth'

export const useRole = () => {
    const { data: user } = useAuth()
    
    const isAdmin = user?.role === 'admin'
    const isUser = user?.role === 'user'
    
    // Debug info - se puede remover en producción
    if (process.env.NODE_ENV === 'development') {
        console.log('User role data:', { user, isAdmin, isUser })
    }
    
    return {
        isAdmin,
        isUser,
        role: user?.role
    }
}