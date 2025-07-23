import * as cron from 'node-cron';
import NotificationPreference from '../models/NotificationPreference';
import Task from '../models/Task';
import User from '../models/User';
import Project from '../models/Project';
import { EmailService } from './EmailService';

interface TaskReminderData {
  user: {
    _id: string;
    name: string;
    email: string;
  };
  task: {
    _id: string;
    name: string;
    description: string;
    dueDate: Date;
    status: string;
    notes: any[];
  };
  project: {
    _id: string;
    projectName: string;
    clientName?: string;
  };
  preference: {
    reminderDays: number;
  };
}

export class NotificationService {
  private static instance: NotificationService;
  private cronJob: any = null;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Inicializar el servicio de notificaciones
   */
  public initialize(): void {
    console.log('🔔 Inicializando servicio de notificaciones...');
    
    // Programar ejecución diaria a las 9:00 AM para recordatorios
    this.cronJob = cron.schedule('0 9 * * *', async () => {
      console.log('⏰ Ejecutando verificación de recordatorios...');
      await this.checkAndSendReminders();
    }, {
      timezone: 'America/Mexico_City' // Ajustar según tu zona horaria
    });

    // Programar verificación de tareas vencidas a las 10:00 AM
    const overdueJob = cron.schedule('0 10 * * *', async () => {
      console.log('⏰ Ejecutando verificación de tareas vencidas...');
      await this.checkAndNotifyOverdueTasks();
    }, {
      timezone: 'America/Mexico_City'
    });

    console.log('✅ Servicio de notificaciones iniciado');
    console.log('📅 Recordatorios: diariamente a las 9:00 AM');
    console.log('⚠️ Tareas vencidas: diariamente a las 10:00 AM');
  }

  /**
   * Detener el servicio de notificaciones
   */
  public stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('🛑 Servicio de notificaciones detenido');
    }
  }

  /**
   * Verificar y enviar recordatorios pendientes
   */
  public async checkAndSendReminders(): Promise<void> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      // Buscar todas las preferencias habilitadas
      const preferences = await NotificationPreference.find({
        isEnabled: true,
      }).populate([
        {
          path: 'user',
          select: 'name email',
        },
        {
          path: 'task',
          select: 'name description dueDate status notes project',
          populate: {
            path: 'project',
            select: 'projectName clientName team',
            populate: {
              path: 'team',
              select: 'name email',
            },
          },
        },
      ]);

      console.log(`📊 Verificando ${preferences.length} preferencias de notificación...`);

      let sentCount = 0;

      for (const preference of preferences) {
        const shouldSendReminder = await this.shouldSendReminder(preference, today);
        
        if (shouldSendReminder) {
          await this.sendTaskReminder(preference as any);
          
          // Actualizar fecha de último envío
          preference.lastSentAt = new Date();
          await preference.save();
          
          sentCount++;
        }
      }

      console.log(`📧 Se enviaron ${sentCount} recordatorios`);
    } catch (error) {
      console.error('❌ Error al verificar recordatorios:', error);
    }
  }

  /**
   * Determinar si se debe enviar un recordatorio
   */
  private async shouldSendReminder(preference: any, today: Date): Promise<boolean> {
    const task = preference.task;
    const user = preference.user;

    if (!task || !user) return false;

    // No enviar si la tarea ya está completada
    if (task.status === 'completed') return false;

    // No enviar si no hay fecha límite
    if (!task.dueDate) return false;

    // Calcular días hasta la fecha límite
    const dueDate = new Date(task.dueDate);
    const timeDiff = dueDate.getTime() - today.getTime();
    const daysUntilDue = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // Verificar si coincide con los días de anticipación configurados
    if (daysUntilDue !== preference.reminderDays) return false;

    // No enviar si ya se envió hoy
    if (preference.lastSentAt) {
      const lastSentDate = new Date(preference.lastSentAt);
      const isToday = lastSentDate.toDateString() === today.toDateString();
      if (isToday) return false;
    }

    return true;
  }

  /**
   * Enviar recordatorio de tarea por correo
   */
  private async sendTaskReminder(data: TaskReminderData): Promise<void> {
    try {
      const { user, task, project, preference } = data;

      // Obtener colaboradores del proyecto
      const projectData = await Project.findById(project._id).populate('team', 'name email');
      const collaborators = projectData?.team || [];

      const dueDate = new Date(task.dueDate);
      const formattedDueDate = dueDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const statusLabels: Record<string, string> = {
        pending: 'Pendiente',
        onHold: 'En espera',
        inProgress: 'En progreso',
        underReview: 'En revisión',
        completed: 'Completada',
      };

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
            .task-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .status { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-inProgress { background: #dbeafe; color: #1e40af; }
            .status-onHold { background: #fed7d7; color: #9f1239; }
            .status-underReview { background: #e0e7ff; color: #3730a3; }
            .footer { margin-top: 20px; padding: 15px; background: #f1f5f9; border-radius: 6px; font-size: 14px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Recordatorio de Tarea</h1>
              <p>Hola ${user.name}, tienes una tarea próxima a vencer</p>
            </div>
            
            <div class="content">
              <div class="task-info">
                <h2>${task.name}</h2>
                <p><strong>Descripción:</strong> ${task.description}</p>
                <p><strong>Proyecto:</strong> ${project.projectName}${project.clientName ? ` (${project.clientName})` : ''}</p>
                <p><strong>Fecha límite:</strong> ${formattedDueDate}</p>
                <p><strong>Estado actual:</strong> <span class="status status-${task.status}">${statusLabels[task.status] || task.status}</span></p>
                <p><strong>Días restantes:</strong> ${preference.reminderDays} días</p>
                
                ${task.notes && task.notes.length > 0 ? `
                  <h3>📝 Notas recientes:</h3>
                  <ul>
                    ${task.notes.slice(0, 3).map((note: any) => `<li>${note.content || 'Nota disponible'}</li>`).join('')}
                  </ul>
                ` : ''}
                
                ${collaborators.length > 0 ? `
                  <h3>👥 Colaboradores:</h3>
                  <ul>
                    ${collaborators.slice(0, 5).map((collab: any) => `<li>${collab.name} (${collab.email})</li>`).join('')}
                  </ul>
                ` : ''}
              </div>
              
              <p><strong>💡 Recomendación:</strong> Revisa el progreso de esta tarea y asegúrate de que esté en camino de completarse a tiempo.</p>
            </div>
            
            <div class="footer">
              <p>Este recordatorio se configuró para ${preference.reminderDays} días antes del vencimiento.</p>
              <p>Para modificar tus preferencias de notificación, ingresa a la aplicación LoyesTask.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await EmailService.sendEmail({
        to: user.email,
        subject: `🔔 Recordatorio: "${task.name}" vence en ${preference.reminderDays} días`,
        html: emailHtml,
      });

      console.log(`📧 Recordatorio enviado a ${user.email} para la tarea "${task.name}"`);
    } catch (error) {
      console.error(`❌ Error al enviar recordatorio a ${data.user.email}:`, error);
    }
  }

  /**
   * Enviar recordatorio manual (para testing)
   */
  public async sendTestReminder(userId: string, taskId: string): Promise<boolean> {
    try {
      const preference = await NotificationPreference.findOne({
        user: userId,
        task: taskId,
        isEnabled: true,
      }).populate([
        {
          path: 'user',
          select: 'name email',
        },
        {
          path: 'task',
          select: 'name description dueDate status notes project',
          populate: {
            path: 'project',
            select: 'projectName clientName',
          },
        },
      ]);

      if (!preference) {
        return false;
      }

      await this.sendTaskReminder(preference as any);
      return true;
    } catch (error) {
      console.error('❌ Error al enviar recordatorio de prueba:', error);
      return false;
    }
  }

  /**
   * Notificar cambio de estado de una tarea a todos los colaboradores del proyecto
   */
  public async notifyStatusChange(data: {
    taskId: string;
    newStatus: string;
    previousStatus: string;
    changedBy: { id: string; name: string };
    projectId: string;
  }): Promise<void> {
    try {
      console.log(`🔄 Enviando notificaciones de cambio de estado para tarea ${data.taskId}`);

      // Obtener información completa de la tarea y proyecto
      const task = await Task.findById(data.taskId).populate('project');
      if (!task) {
        console.error('❌ Tarea no encontrada:', data.taskId);
        return;
      }

      const project = await Project.findById(data.projectId).populate('team manager', 'name email');
      if (!project) {
        console.error('❌ Proyecto no encontrado:', data.projectId);
        return;
      }

      // Recopilar todos los colaboradores (team + manager, excluyendo quien hizo el cambio)
      const collaborators = [
        ...(project.team as any[]),
        project.manager
      ].filter((user: any) => user._id.toString() !== data.changedBy.id);

      console.log(`📧 Enviando notificaciones a ${collaborators.length} colaboradores`);

      // Enviar notificación a cada colaborador
      for (const collaborator of collaborators) {
        await EmailService.sendTaskNotification({
          to: collaborator.email,
          userName: collaborator.name,
          taskName: task.name,
          projectName: project.projectName,
          type: 'status_change',
          additionalData: {
            oldStatus: data.previousStatus,
            newStatus: data.newStatus,
            changedBy: data.changedBy.name
          }
        });
      }

      console.log(`✅ Notificaciones de cambio de estado enviadas correctamente`);
    } catch (error) {
      console.error('❌ Error al enviar notificaciones de cambio de estado:', error);
    }
  }

  /**
   * Notificar asignación de tarea a usuarios específicos
   */
  public async notifyTaskAssignment(data: {
    taskId: string;
    assignedUsers: string[];
    projectId: string;
    assignedBy: { id: string; name: string };
    dueDate?: Date;
  }): Promise<void> {
    try {
      console.log(`📋 Enviando notificaciones de asignación para tarea ${data.taskId}`);

      // Obtener información de la tarea y proyecto
      const task = await Task.findById(data.taskId);
      const project = await Project.findById(data.projectId);
      
      if (!task || !project) {
        console.error('❌ Tarea o proyecto no encontrado');
        return;
      }

      // Obtener información de usuarios asignados
      const assignedUsersData = await User.find({
        _id: { $in: data.assignedUsers }
      }, 'name email');

      console.log(`📧 Enviando notificaciones a ${assignedUsersData.length} usuarios asignados`);

      // Enviar notificación a cada usuario asignado
      for (const user of assignedUsersData) {
        await EmailService.sendTaskNotification({
          to: user.email,
          userName: user.name,
          taskName: task.name,
          projectName: project.projectName,
          type: 'assignment',
          additionalData: {
            changedBy: data.assignedBy.name,
            dueDate: data.dueDate?.toLocaleDateString('es-ES')
          }
        });
      }

      console.log(`✅ Notificaciones de asignación enviadas correctamente`);
    } catch (error) {
      console.error('❌ Error al enviar notificaciones de asignación:', error);
    }
  }

  /**
   * Verificar y notificar tareas vencidas
   */
  public async checkAndNotifyOverdueTasks(): Promise<void> {
    try {
      console.log('⏰ Verificando tareas vencidas...');
      
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      // Buscar tareas vencidas que no estén completadas
      const overdueTasks = await Task.find({
        dueDate: { $lt: startOfDay },
        status: { $ne: 'completed' }
      }).populate('project');

      console.log(`📊 Encontradas ${overdueTasks.length} tareas vencidas`);

      let notificationsSent = 0;

      for (const task of overdueTasks) {
        // Obtener proyecto y colaboradores
        const project = await Project.findById(task.project).populate('team manager', 'name email');
        if (!project) continue;

        // Notificar a todos los colaboradores del proyecto
        const collaborators = [...(project.team as any[]), project.manager];

        for (const collaborator of collaborators) {
          await EmailService.sendTaskNotification({
            to: collaborator.email,
            userName: collaborator.name,
            taskName: task.name,
            projectName: project.projectName,
            type: 'overdue'
          });
          notificationsSent++;
        }
      }

      console.log(`📧 Se enviaron ${notificationsSent} notificaciones de tareas vencidas`);
    } catch (error) {
      console.error('❌ Error al verificar tareas vencidas:', error);
    }
  }
}

export default NotificationService;
