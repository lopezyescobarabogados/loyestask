import puppeteer from 'puppeteer';
import { IProject } from '../models/Project';
import { ITask } from '../models/Task';
import { INote } from '../models/Note';
import { IUser } from '../models/User';

export interface ProjectPDFData {
  project: IProject & {
    tasks: (ITask & {
      notes: (INote & { createdBy: IUser })[];
      collaborators: IUser[];
      completedBy: { user: IUser; status: string }[];
    })[];
    manager: IUser;
    team: IUser[];
  };
}

interface PopulatedUser {
  _id: string;
  name: string;
  email: string;
  role?: string;
}

export class PDFService {
  /**
   * Genera un PDF completo del proyecto con todas sus tareas
   */
  static async generateProjectPDF(projectData: ProjectPDFData): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Generar HTML del reporte
      const htmlContent = this.generateProjectHTML(projectData);
      
      // Configurar el contenido HTML
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0'
      });
      
      // Generar PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          bottom: '20mm',
          left: '15mm',
          right: '15mm'
        },
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
            <span style="margin-left: 10px;">Reporte de Proyecto - ${projectData.project.projectName}</span>
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
            <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
            <span style="margin-left: 20px;">Generado el ${new Date().toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>
        `
      });
      
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Genera el HTML para el reporte del proyecto
   */
  private static generateProjectHTML(data: ProjectPDFData): string {
    const { project } = data;
    
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte de Proyecto - ${project.projectName}</title>
        <style>
          ${this.getStyles()}
        </style>
      </head>
      <body>
        ${this.generateProjectHeader(project)}
        ${this.generateProjectSummary(project)}
        ${this.generateTasksSection(project.tasks)}
        ${this.generateTeamSection(project)}
        ${this.generateFooter()}
      </body>
      </html>
    `;
  }

  /**
   * CSS Styles para el PDF
   */
  private static getStyles(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 12px;
        line-height: 1.4;
        color: #333;
        background: #fff;
      }
      
      .header {
        text-align: center;
        margin-bottom: 30px;
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 8px;
      }
      
      .header h1 {
        font-size: 24px;
        margin-bottom: 8px;
        font-weight: 700;
      }
      
      .header .subtitle {
        font-size: 14px;
        opacity: 0.9;
      }
      
      .section {
        margin-bottom: 25px;
        break-inside: avoid;
      }
      
      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: #4a5568;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 5px;
        margin-bottom: 15px;
      }
      
      .project-info {
        background: #f7fafc;
        padding: 15px;
        border-radius: 6px;
        border-left: 4px solid #4299e1;
      }
      
      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
      }
      
      .info-item {
        margin-bottom: 8px;
      }
      
      .info-label {
        font-weight: 600;
        color: #2d3748;
        display: inline-block;
        min-width: 100px;
      }
      
      .info-value {
        color: #4a5568;
      }
      
      .status-badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      .status-active {
        background: #c6f6d5;
        color: #22543d;
      }
      
      .status-completed {
        background: #bee3f8;
        color: #2c5282;
      }
      
      .priority-high {
        background: #fed7d7;
        color: #742a2a;
      }
      
      .priority-medium {
        background: #feebc8;
        color: #7c2d12;
      }
      
      .priority-low {
        background: #e6fffa;
        color: #234e52;
      }
      
      .task-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 15px;
        margin-bottom: 15px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        break-inside: avoid;
      }
      
      .task-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 10px;
      }
      
      .task-title {
        font-size: 14px;
        font-weight: 600;
        color: #2d3748;
        flex: 1;
      }
      
      .task-status {
        margin-left: 10px;
      }
      
      .task-description {
        color: #4a5568;
        margin-bottom: 10px;
        font-size: 11px;
        line-height: 1.5;
      }
      
      .task-meta {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        font-size: 10px;
        color: #718096;
        margin-bottom: 12px;
      }
      
      .collaborators {
        margin-bottom: 10px;
      }
      
      .collaborators-title {
        font-size: 11px;
        font-weight: 600;
        color: #4a5568;
        margin-bottom: 5px;
      }
      
      .collaborator-list {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }
      
      .collaborator-tag {
        background: #edf2f7;
        color: #4a5568;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 10px;
      }
      
      .notes {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #e2e8f0;
      }
      
      .notes-title {
        font-size: 11px;
        font-weight: 600;
        color: #4a5568;
        margin-bottom: 8px;
      }
      
      .note {
        background: #fffaf0;
        border-left: 3px solid #f6ad55;
        padding: 8px;
        margin-bottom: 6px;
        font-size: 10px;
        border-radius: 0 4px 4px 0;
      }
      
      .note-author {
        font-weight: 600;
        color: #744210;
      }
      
      .note-date {
        font-size: 9px;
        color: #975a16;
        float: right;
      }
      
      .note-content {
        margin-top: 4px;
        color: #744210;
      }
      
      .team-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
      }
      
      .team-member {
        background: #f7fafc;
        padding: 10px;
        border-radius: 6px;
        border-left: 3px solid #4299e1;
      }
      
      .member-name {
        font-weight: 600;
        color: #2d3748;
        font-size: 11px;
      }
      
      .member-email {
        color: #718096;
        font-size: 10px;
      }
      
      .member-role {
        color: #4299e1;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      .files-section {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #e2e8f0;
      }
      
      .files-title {
        font-size: 11px;
        font-weight: 600;
        color: #4a5568;
        margin-bottom: 6px;
      }
      
      .file-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 0;
        font-size: 10px;
        color: #718096;
      }
      
      .file-name {
        color: #4a5568;
        font-weight: 500;
      }
      
      .file-size {
        color: #a0aec0;
      }
      
      .footer {
        text-align: center;
        margin-top: 40px;
        padding: 20px;
        background: #f7fafc;
        border-radius: 6px;
        font-size: 10px;
        color: #718096;
      }
      
      .page-break {
        page-break-before: always;
      }
      
      @media print {
        .task-card {
          break-inside: avoid;
        }
        
        .section {
          break-inside: avoid;
        }
      }
    `;
  }

  /**
   * Genera el header del proyecto
   */
  private static generateProjectHeader(project: IProject): string {
    return `
      <div class="header">
        <h1>${project.projectName}</h1>
        <div class="subtitle">Reporte Completo del Proyecto</div>
      </div>
    `;
  }

  /**
   * Genera el resumen del proyecto
   */
  private static generateProjectSummary(project: any): string {
    const statusClass = project.status === 'active' ? 'status-active' : 'status-completed';
    const priorityClass = `priority-${project.priority}`;
    const manager = project.manager as PopulatedUser;
    
    return `
      <div class="section">
        <h2 class="section-title">📋 Información del Proyecto</h2>
        <div class="project-info">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Cliente:</span>
              <span class="info-value">${project.clientName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Estado:</span>
              <span class="status-badge ${statusClass}">${project.status === 'active' ? 'Activo' : 'Completado'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Prioridad:</span>
              <span class="status-badge ${priorityClass}">${this.translatePriority(project.priority)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Manager:</span>
              <span class="info-value">${manager.name} (${manager.email})</span>
            </div>
          </div>
          <div style="margin-top: 15px;">
            <div class="info-label">Descripción:</div>
            <div class="info-value" style="margin-top: 5px; line-height: 1.5;">${project.description}</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Genera la sección de tareas
   */
  private static generateTasksSection(tasks: any[]): string {
    if (!tasks || tasks.length === 0) {
      return `
        <div class="section">
          <h2 class="section-title">📝 Tareas del Proyecto</h2>
          <p style="text-align: center; color: #718096; font-style: italic;">No hay tareas asignadas a este proyecto.</p>
        </div>
      `;
    }

    const tasksHTML = tasks.map((task, index) => {
      const isNewPage = index > 0 && index % 3 === 0; // Salto de página cada 3 tareas
      return `
        ${isNewPage ? '<div class="page-break"></div>' : ''}
        <div class="task-card">
          <div class="task-header">
            <div class="task-title">${task.name}</div>
            <div class="task-status">
              <span class="status-badge status-${task.status}">${this.translateTaskStatus(task.status)}</span>
            </div>
          </div>
          
          <div class="task-description">${task.description}</div>
          
          <div class="task-meta">
            <div>
              <strong>Fecha de creación:</strong> ${new Date(task.createdAt).toLocaleDateString('es-ES')}
            </div>
            <div>
              <strong>Fecha límite:</strong> ${task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-ES') : 'Sin fecha límite'}
            </div>
          </div>
          
          ${this.generateCollaboratorsSection(task.collaborators)}
          ${this.generateFilesSection(task.archive)}
          ${this.generateNotesSection(task.notes)}
          ${this.generateStatusChangesSection(task.completedBy)}
        </div>
      `;
    }).join('');

    return `
      <div class="section">
        <h2 class="section-title">📝 Tareas del Proyecto (${tasks.length} tareas)</h2>
        ${tasksHTML}
      </div>
    `;
  }

  /**
   * Genera la sección de colaboradores de una tarea
   */
  private static generateCollaboratorsSection(collaborators: IUser[]): string {
    if (!collaborators || collaborators.length === 0) return '';

    const collaboratorsHTML = collaborators.map(collab => 
      `<span class="collaborator-tag">${collab.name}</span>`
    ).join('');

    return `
      <div class="collaborators">
        <div class="collaborators-title">👥 Colaboradores asignados:</div>
        <div class="collaborator-list">${collaboratorsHTML}</div>
      </div>
    `;
  }

  /**
   * Genera la sección de archivos de una tarea
   */
  private static generateFilesSection(files: any[]): string {
    if (!files || files.length === 0) return '';

    const filesHTML = files.map(file => `
      <div class="file-item">
        <span class="file-name">📎 ${file.originalName}</span>
        <span class="file-size">${this.formatFileSize(file.fileSize)}</span>
      </div>
    `).join('');

    return `
      <div class="files-section">
        <div class="files-title">📁 Archivos adjuntos (${files.length}):</div>
        ${filesHTML}
      </div>
    `;
  }

  /**
   * Genera la sección de notas de una tarea
   */
  private static generateNotesSection(notes: any[]): string {
    if (!notes || notes.length === 0) return '';

    const notesHTML = notes.map(note => `
      <div class="note">
        <div>
          <span class="note-author">${note.createdBy.name}</span>
          <span class="note-date">${new Date(note.createdAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
        <div class="note-content">${note.content}</div>
      </div>
    `).join('');

    return `
      <div class="notes">
        <div class="notes-title">💬 Notas y comentarios (${notes.length}):</div>
        ${notesHTML}
      </div>
    `;
  }

  /**
   * Genera la sección de cambios de estado
   */
  private static generateStatusChangesSection(completedBy: any[]): string {
    if (!completedBy || completedBy.length === 0) return '';

    const changesHTML = completedBy.map(change => `
      <div class="collaborator-tag">
        ${change.user.name}: ${this.translateTaskStatus(change.status)}
      </div>
    `).join('');

    return `
      <div class="collaborators">
        <div class="collaborators-title">🔄 Historial de cambios:</div>
        <div class="collaborator-list">${changesHTML}</div>
      </div>
    `;
  }

  /**
   * Genera la sección del equipo
   */
  private static generateTeamSection(project: any): string {
    const manager = project.manager as PopulatedUser;
    const team = project.team as PopulatedUser[];
    
    const teamMembers = [
      { ...manager, role: 'Manager' },
      ...team.map(member => ({ ...member, role: 'Colaborador' }))
    ];

    const teamHTML = teamMembers.map(member => `
      <div class="team-member">
        <div class="member-name">${member.name}</div>
        <div class="member-email">${member.email}</div>
        <div class="member-role">${member.role}</div>
      </div>
    `).join('');

    return `
      <div class="section">
        <h2 class="section-title">👥 Equipo del Proyecto (${teamMembers.length} miembros)</h2>
        <div class="team-grid">
          ${teamHTML}
        </div>
      </div>
    `;
  }

  /**
   * Genera el footer del documento
   */
  private static generateFooter(): string {
    return `
      <div class="footer">
        <div>Este reporte fue generado automáticamente por LoyesTask</div>
        <div style="margin-top: 5px;">Sistema de Gestión de Proyectos y Tareas</div>
      </div>
    `;
  }

  /**
   * Traduce la prioridad del proyecto
   */
  private static translatePriority(priority: string): string {
    const translations = {
      'high': 'Alta',
      'medium': 'Media',
      'low': 'Baja'
    };
    return translations[priority as keyof typeof translations] || priority;
  }

  /**
   * Traduce el estado de la tarea
   */
  private static translateTaskStatus(status: string): string {
    const translations = {
      'pending': 'Pendiente',
      'onHold': 'En Espera',
      'inProgress': 'En Progreso',
      'underReview': 'En Revisión',
      'completed': 'Completada'
    };
    return translations[status as keyof typeof translations] || status;
  }

  /**
   * Formatea el tamaño del archivo
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Genera un PDF resumido de todas las tareas activas para administradores
   */
  static async generateAdminSummaryPDF(summaryData: any): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Generar HTML del reporte resumido
      const htmlContent = this.generateSummaryHTML(summaryData);
      
      // Configurar el contenido HTML
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0'
      });
      
      // Generar PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });
      
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Genera el HTML completo para el reporte resumido
   */
  private static generateSummaryHTML(summaryData: any): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte Resumido de Tareas Activas</title>
        <style>
          ${this.getSummaryStyles()}
        </style>
      </head>
      <body>
        ${this.generateSummaryHeader()}
        ${this.generateSummaryContent(summaryData)}
        ${this.generateSummaryFooter()}
      </body>
      </html>
    `;
  }

  /**
   * CSS Styles para el reporte resumido
   */
  private static getSummaryStyles(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 12px;
        line-height: 1.4;
        color: #333;
        background: #fff;
      }
      
      .header {
        text-align: center;
        margin-bottom: 30px;
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 8px;
      }
      
      .header h1 {
        font-size: 20px;
        margin-bottom: 8px;
        font-weight: 700;
      }
      
      .header .subtitle {
        font-size: 12px;
        opacity: 0.9;
      }
      
      .project-section {
        margin-bottom: 25px;
        page-break-inside: avoid;
      }
      
      .project-header {
        background: #f8f9fa;
        padding: 12px 15px;
        border-left: 4px solid #007bff;
        margin-bottom: 10px;
      }
      
      .project-title {
        font-size: 14px;
        font-weight: 600;
        color: #2c3e50;
        margin-bottom: 4px;
      }
      
      .project-client {
        font-size: 11px;
        color: #6c757d;
      }
      
      .tasks-list {
        padding-left: 20px;
      }
      
      .task-item {
        margin-bottom: 6px;
        font-size: 11px;
        line-height: 1.3;
      }
      
      .task-bullet {
        color: #28a745;
        margin-right: 8px;
      }
      
      .no-tasks {
        color: #6c757d;
        font-style: italic;
        padding-left: 20px;
        font-size: 11px;
      }
      
      .footer {
        text-align: center;
        margin-top: 30px;
        padding: 15px;
        font-size: 10px;
        color: #6c757d;
        border-top: 1px solid #dee2e6;
      }
      
      .summary-stats {
        background: #e9ecef;
        padding: 15px;
        border-radius: 6px;
        margin-bottom: 20px;
        text-align: center;
      }
      
      .stats-item {
        display: inline-block;
        margin: 0 15px;
        font-size: 11px;
      }
      
      .stats-number {
        font-weight: 700;
        font-size: 16px;
        color: #007bff;
        display: block;
      }
    `;
  }

  /**
   * Genera el header del reporte resumido
   */
  private static generateSummaryHeader(): string {
    const currentDate = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <div class="header">
        <h1>Reporte Resumido de Tareas Activas</h1>
        <div class="subtitle">Generado el ${currentDate}</div>
      </div>
    `;
  }

  /**
   * Genera el contenido principal del reporte resumido
   */
  private static generateSummaryContent(summaryData: any): string {
    const { projects } = summaryData;
    
    // Calcular estadísticas
    const totalProjects = projects.length;
    const totalTasks = projects.reduce((sum: number, project: any) => sum + project.tasks.length, 0);
    const projectsWithTasks = projects.filter((project: any) => project.tasks.length > 0).length;

    const statsSection = `
      <div class="summary-stats">
        <div class="stats-item">
          <span class="stats-number">${totalProjects}</span>
          Proyectos Activos
        </div>
        <div class="stats-item">
          <span class="stats-number">${totalTasks}</span>
          Tareas Activas
        </div>
        <div class="stats-item">
          <span class="stats-number">${projectsWithTasks}</span>
          Proyectos con Tareas
        </div>
      </div>
    `;

    const projectsSection = projects.map((project: any) => {
      const tasksHtml = project.tasks.length > 0 
        ? project.tasks.map((task: any) => `
            <div class="task-item">
              <span class="task-bullet">•</span>${task.name}
            </div>
          `).join('')
        : '<div class="no-tasks">Sin tareas activas</div>';

      return `
        <div class="project-section">
          <div class="project-header">
            <div class="project-title">${project.projectName}</div>
            <div class="project-client">Cliente: ${project.clientName}</div>
          </div>
          <div class="tasks-list">
            ${tasksHtml}
          </div>
        </div>
      `;
    }).join('');

    return statsSection + projectsSection;
  }

  /**
   * Genera el footer del reporte resumido
   */
  private static generateSummaryFooter(): string {
    return `
      <div class="footer">
        <div>LoyesTask - Sistema de Gestión de Tareas</div>
        <div>Reporte generado automáticamente</div>
      </div>
    `;
  }
}
