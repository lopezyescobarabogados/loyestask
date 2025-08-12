import { useAuth } from './useAuth'

export const useRole = () => {
    const { data: user } = useAuth()
    
    const isAdmin = user?.role === 'admin'
    const isUser = user?.role === 'user'
    
    return {
        isAdmin,
        isUser,
        role: user?.role
    }
}