import nodemailer from 'nodemailer';
import * as brevo from '@getbrevo/brevo';
import dotenv from 'dotenv';

dotenv.config();

interface IEmailData {
    to: string;
    subject: string;
    html: string;
    from?: {
        name: string;
        email: string;
    };
}

export class EmailService {
    private static brevoClient: brevo.TransactionalEmailsApi | null = null;
    private static nodemailerTransporter: nodemailer.Transporter | null = null;

    // Inicializar Brevo para producción
    private static initBrevo() {
        if (!this.brevoClient && process.env.NODE_ENV === 'production') {
            const apiInstance = new brevo.TransactionalEmailsApi();
            
            // Configurar la API key
            apiInstance.setApiKey(
                brevo.TransactionalEmailsApiApiKeys.apiKey,
                process.env.BREVO_API_KEY || ''
            );
            
            this.brevoClient = apiInstance;
        }
    }

    // Inicializar Nodemailer para desarrollo
    private static initNodemailer() {
        if (!this.nodemailerTransporter && process.env.NODE_ENV !== 'production') {
            this.nodemailerTransporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '2525'),
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        }
    }

    // Método principal para enviar correos
    public static async sendEmail(emailData: IEmailData): Promise<void> {
        try {
            if (process.env.NODE_ENV === 'production') {
                await this.sendWithBrevo(emailData);
            } else {
                await this.sendWithNodemailer(emailData);
            }
        } catch (error) {
            console.error('Error enviando correo:', error);
            throw new Error('Error al enviar el correo electrónico');
        }
    }

    // Enviar con Brevo (producción)
    private static async sendWithBrevo(emailData: IEmailData): Promise<void> {
        this.initBrevo();
        
        if (!this.brevoClient) {
            throw new Error('Cliente de Brevo no inicializado');
        }

        const sendSmtpEmail = new brevo.SendSmtpEmail();
        
        sendSmtpEmail.to = [{ email: emailData.to }];
        sendSmtpEmail.subject = emailData.subject;
        sendSmtpEmail.htmlContent = emailData.html;
        sendSmtpEmail.sender = emailData.from || {
            name: process.env.EMAIL_FROM_NAME || 'LoyesTask',
            email: process.env.FROM_EMAIL || process.env.EMAIL_FROM || 'admin@loyestask.com'
        };

        const response = await this.brevoClient.sendTransacEmail(sendSmtpEmail);
        console.log('Correo enviado con Brevo:', response.body);
    }

    // Enviar con Nodemailer (desarrollo)
    private static async sendWithNodemailer(emailData: IEmailData): Promise<void> {
        this.initNodemailer();
        
        if (!this.nodemailerTransporter) {
            throw new Error('Transporter de Nodemailer no inicializado');
        }

        const mailOptions = {
            from: emailData.from 
                ? `${emailData.from.name} <${emailData.from.email}>` 
                : `${process.env.EMAIL_FROM_NAME || 'LoyesTask'} <${process.env.FROM_EMAIL || process.env.EMAIL_FROM || 'admin@loyestask.com'}>`,
            to: emailData.to,
            subject: emailData.subject,
            html: emailData.html
        };

        const info = await this.nodemailerTransporter.sendMail(mailOptions);
        console.log('Correo enviado con Nodemailer:', info.messageId);
    }

    // Método para envío de correos de autenticación
    public static async sendConfirmationEmail(user: { email: string; name: string; token: string }): Promise<void> {
        const emailData: IEmailData = {
            to: user.email,
            subject: 'loyestask - Confirma tu cuenta',
            html: `
                <p>Hola: ${user.name}, has creado tu cuenta en loyestask, ya casi está todo listo, solo debes confirmar tu cuenta</p>
                <p>Visita el siguiente enlace:</p>
                <a href="${process.env.FRONTEND_URL}/auth/confirm-account">Confirmar cuenta</a>
                <p>E ingresa el código: <b>${user.token}</b></p>
                <p>Este token expira en 10 minutos</p>
            `
        };

        await this.sendEmail(emailData);
    }

    // Método para envío de correos de restablecimiento de contraseña
    public static async sendPasswordResetToken(user: { email: string; name: string; token: string }): Promise<void> {
        const emailData: IEmailData = {
            to: user.email,
            subject: 'loyestask - Restablecer contraseña',
            html: `
                <p>Hola: ${user.name}, has solicitado restablecer tu contraseña</p>
                <p>Visita el siguiente enlace:</p>
                <a href="${process.env.FRONTEND_URL}/auth/new-password">Restablecer password</a>
                <p>E ingresa el código: <b>${user.token}</b></p>
                <p>Este token expira en 10 minutos</p>
            `
        };

        await this.sendEmail(emailData);
    }

    // Método para envío de notificaciones de tareas
    public static async sendTaskNotification(data: {
        to: string;
        userName: string;
        taskName: string;
        projectName: string;
        type: 'assignment' | 'reminder' | 'overdue' | 'status_change';
        additionalData?: {
            oldStatus?: string;
            newStatus?: string;
            changedBy?: string;
            dueDate?: string;
        };
    }): Promise<void> {
        let subject = '';
        let content = '';

        switch (data.type) {
            case 'assignment':
                subject = 'Nueva tarea asignada - loyestask';
                content = `
                    <p>Hola ${data.userName},</p>
                    <p>Se te ha asignado una nueva tarea: <strong>${data.taskName}</strong></p>
                    <p>Proyecto: <strong>${data.projectName}</strong></p>
                    ${data.additionalData?.dueDate ? `<p>Fecha límite: <strong>${data.additionalData.dueDate}</strong></p>` : ''}
                    <p>Ingresa a la plataforma para ver los detalles.</p>
                `;
                break;
            case 'reminder':
                subject = 'Recordatorio de tarea - loyestask';
                content = `
                    <p>Hola ${data.userName},</p>
                    <p>Recordatorio: La tarea <strong>${data.taskName}</strong> está próxima a vencer.</p>
                    <p>Proyecto: <strong>${data.projectName}</strong></p>
                    <p>No olvides completarla a tiempo.</p>
                `;
                break;
            case 'overdue':
                subject = 'Tarea vencida - loyestask';
                content = `
                    <p>Hola ${data.userName},</p>
                    <p>La tarea <strong>${data.taskName}</strong> ha vencido.</p>
                    <p>Proyecto: <strong>${data.projectName}</strong></p>
                    <p>Por favor, revisa su estado lo antes posible.</p>
                `;
                break;
            case 'status_change':
                const statusLabels = {
                    pending: 'Pendiente',
                    onHold: 'En espera',
                    inProgress: 'En progreso', 
                    underReview: 'En revisión',
                    completed: 'Completada'
                };
                
                subject = 'Cambio de estado en tarea - loyestask';
                content = `
                    <p>Hola ${data.userName},</p>
                    <p>La tarea <strong>${data.taskName}</strong> ha cambiado de estado.</p>
                    <p>Proyecto: <strong>${data.projectName}</strong></p>
                    <p>Estado anterior: <strong>${statusLabels[data.additionalData?.oldStatus as keyof typeof statusLabels] || data.additionalData?.oldStatus}</strong></p>
                    <p>Estado actual: <strong>${statusLabels[data.additionalData?.newStatus as keyof typeof statusLabels] || data.additionalData?.newStatus}</strong></p>
                    ${data.additionalData?.changedBy ? `<p>Actualizado por: <strong>${data.additionalData.changedBy}</strong></p>` : ''}
                    <p>Revisa la plataforma para más detalles.</p>
                `;
                break;
        }

        const emailData: IEmailData = {
            to: data.to,
            subject,
            html: content
        };

        await this.sendEmail(emailData);
    }
}
