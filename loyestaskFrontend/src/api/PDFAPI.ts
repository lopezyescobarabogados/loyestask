import api from '@/lib/axios';
import { isAxiosError } from 'axios';

export interface ProjectPDFInfo {
  _id: string;
  projectName: string;
  clientName: string;
  description: string;
  status: string;
  priority: string;
  manager: {
    _id: string;
    name: string;
    email: string;
  };
  teamSize: number;
  statistics: {
    totalTasks: number;
    completedTasks: number;
    totalNotes: number;
    completionPercentage: number;
  };
}

/**
 * Obtiene la información del proyecto para mostrar antes de generar el PDF
 */
export async function getProjectPDFInfo(projectId: string): Promise<ProjectPDFInfo> {
  try {
    const { data } = await api.get<ProjectPDFInfo>(`/pdf/project/${projectId}/info`);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
}

/**
 * Descarga el PDF completo del proyecto
 */
export async function downloadProjectPDF(projectId: string): Promise<void> {
  try {
    const response = await api.get(`/pdf/project/${projectId}/download`, {
      responseType: 'blob'
    });

    // Extraer el nombre del archivo de los headers o crear uno por defecto
    const contentDisposition = response.headers['content-disposition'];
    let fileName = `Proyecto_${projectId}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
      if (fileNameMatch) {
        fileName = fileNameMatch[1];
      }
    }

    // Crear blob y enlace de descarga
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    
    // Crear enlace temporal y hacer clic para descargar
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Error al descargar el PDF');
    }
    throw new Error('Error al descargar el PDF del proyecto');
  }
}

/**
 * Abre una vista previa del PDF del proyecto en una nueva ventana
 */
export async function previewProjectPDF(projectId: string): Promise<void> {
  try {
    const response = await api.get(`/pdf/project/${projectId}/preview`, {
      responseType: 'blob'
    });

    // Crear blob URL para la vista previa
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    
    // Abrir en nueva ventana
    const newWindow = window.open(url, '_blank');
    
    if (!newWindow) {
      // Si no se puede abrir ventana nueva, descargar el archivo
      const link = document.createElement('a');
      link.href = url;
      link.download = `Vista_Previa_Proyecto_${projectId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    // Limpiar URL después de un tiempo para liberar memoria
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 60000); // 1 minuto
    
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Error al generar vista previa del PDF');
    }
    throw new Error('Error al generar vista previa del PDF');
  }
}

/**
 * Valida si el usuario tiene permisos para generar PDF del proyecto
 */
export async function validatePDFAccess(projectId: string): Promise<boolean> {
  try {
    await getProjectPDFInfo(projectId);
    return true;
  } catch {
    return false;
  }
}
