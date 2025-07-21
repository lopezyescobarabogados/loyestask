import dotenv from 'dotenv'
import { connectDB } from '../config/db'
import User from '../models/User'
import { hashPassword } from '../utils/auth'

dotenv.config()

const createAdmin = async () => {
    try {
        await connectDB()
        
        // Verificar si ya existe un admin
        const existingAdmin = await User.findOne({ role: 'admin' })
        if (existingAdmin) {
            console.log('Ya existe un usuario administrador')
            process.exit(0)
        }
        
        // Crear el usuario admin
        const admin = new User({
            name: 'Administrador',
            email: 'admin@loyestask.com',
            password: await hashPassword('admin123'),
            role: 'admin',
            confirmed: true
        })
    
        await admin.save()
        console.log('Usuario administrador creado exitosamente')
        console.log('Email: admin@loyestask.com')
        console.log('Password: admin123')
        console.log('Rol: admin')
        
        process.exit(0)
    } catch (error) {
        console.error('Error al crear administrador:', error)
        process.exit(1)
    }
}

createAdmin()