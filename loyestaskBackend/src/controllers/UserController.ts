import type { Request, Response } from 'express'
import User from '../models/User'
import { checkPassword, hashPassword } from '../utils/auth'
import Token from '../models/Token'
import { generateToken } from '../utils/token'
import { AuthEmail } from '../emails/AuthEmail'

export class UserController {
    // Crear usuario (solo admin)
    static createUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const { password, email, name, role } = req.body
            
            // Prevenir duplicados
            const userExists = await User.findOne({ email })
            if (userExists) {
                const error = new Error('El usuario ya esta registrado')
                res.status(409).json({ error: error.message })
                return
            }
            
            // Crear usuario
            const user = new User({
                email,
                name,
                role: role || 'user'
            })
            
            // Hash password
            user.password = await hashPassword(password)
            
            // Generar token
            const token = new Token()
            token.token = generateToken()
            token.user = user.id
            
            // Enviar email de confirmación
            AuthEmail.sendConfirmationEmail({
                email: user.email,
                name: user.name,
                token: token.token
            })
            
            await Promise.allSettled([user.save(), token.save()])
            res.send('Usuario creado correctamente, se ha enviado un email de confirmación')
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    // Listar todos los usuarios (solo admin)
    static getAllUsers = async (req: Request, res: Response): Promise<void> => {
        try {
            const users = await User.find({}).select('-password')
            res.json(users)
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    // Obtener usuario por ID (solo admin)
    static getUserById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { userId } = req.params
            const user = await User.findById(userId).select('-password')
            if (!user) {
                const error = new Error('Usuario no encontrado')
                res.status(404).json({ error: error.message })
                return
            }
            res.json(user)
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    // Actualizar usuario (solo admin)
    static updateUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const { userId } = req.params
            const { name, email, role } = req.body
            
            const user = await User.findById(userId)
            if (!user) {
                const error = new Error('Usuario no encontrado')
                res.status(404).json({ error: error.message })
                return
            }
            
            // Verificar si el email ya está en uso por otro usuario
            const userExists = await User.findOne({ email })
            if (userExists && userExists.id.toString() !== userId) {
                const error = new Error('El email ya está en uso')
                res.status(409).json({ error: error.message })
                return
            }
            
            user.name = name
            user.email = email
            user.role = role
            
            await user.save()
            res.send('Usuario actualizado correctamente')
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    // Eliminar usuario (solo admin)
    static deleteUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const { userId } = req.params
            
            // No permitir que el admin se elimine a sí mismo
            if (req.user.id.toString() === userId) {
                const error = new Error('No puedes eliminar tu propia cuenta')
                res.status(400).json({ error: error.message })
                return
            }
            
            const user = await User.findById(userId)
            if (!user) {
                const error = new Error('Usuario no encontrado')
                res.status(404).json({ error: error.message })
                return
            }
            
            await user.deleteOne()
            res.send('Usuario eliminado correctamente')
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    // Cambiar contraseña de usuario (solo admin)
    static changeUserPassword = async (req: Request, res: Response): Promise<void> => {
        try {
            const { userId } = req.params
            const { password } = req.body
            
            const user = await User.findById(userId)
            if (!user) {
                const error = new Error('Usuario no encontrado')
                res.status(404).json({ error: error.message })
                return
            }
            
            user.password = await hashPassword(password)
            await user.save()
            res.send('Contraseña actualizada correctamente')
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' })
        }
    }
}