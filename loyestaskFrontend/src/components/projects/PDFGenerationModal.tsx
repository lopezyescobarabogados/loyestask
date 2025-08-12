import { Fragment, useState, useEffect, useCallback } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XMarkIcon, DocumentArrowDownIcon, EyeIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import type { ProjectPDFInfo } from '@/api/PDFAPI';
import { getProjectPDFInfo, downloadProjectPDF, previewProjectPDF } from '@/api/PDFAPI';
import { toast } from 'react-toastify';

interface PDFGenerationModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PDFGenerationModal({ projectId, isOpen, onClose }: PDFGenerationModalProps) {
  const [projectInfo, setProjectInfo] = useState<ProjectPDFInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const loadProjectInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      const info = await getProjectPDFInfo(projectId);
      setProjectInfo(info);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cargar información del proyecto');
      onClose();
    } finally {
      setIsLoading(false);
    }
  }, [projectId, onClose]);

  useEffect(() => {
    if (isOpen && projectId) {
      loadProjectInfo();
    }
  }, [isOpen, projectId, loadProjectInfo]);

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      await downloadProjectPDF(projectId);
      toast.success('PDF descargado exitosamente');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al descargar el PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePreviewPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      await previewProjectPDF(projectId);
      toast.success('Vista previa generada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al generar vista previa');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Activo', className: 'bg-green-100 text-green-800' },
      completed: { label: 'Completado', className: 'bg-blue-100 text-blue-800' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: { label: 'Alta', className: 'bg-red-100 text-red-800' },
      medium: { label: 'Media', className: 'bg-yellow-100 text-yellow-800' },
      low: { label: 'Baja', className: 'bg-green-100 text-green-800' }
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig] || { label: priority, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <DialogTitle as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                    <DocumentArrowDownIcon className="h-6 w-6 mr-2 text-blue-600" />
                    Generar Reporte PDF
                  </DialogTitle>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Cargando información del proyecto...</span>
                  </div>
                ) : projectInfo ? (
                  <div className="space-y-6">
                    {/* Información del proyecto */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <InformationCircleIcon className="h-5 w-5 mr-2 text-blue-600" />
                        Información del Proyecto
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Nombre del Proyecto</label>
                          <p className="text-gray-900 font-medium">{projectInfo.projectName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Cliente</label>
                          <p className="text-gray-900">{projectInfo.clientName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Estado</label>
                          <div className="mt-1">{getStatusBadge(projectInfo.status)}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Prioridad</label>
                          <div className="mt-1">{getPriorityBadge(projectInfo.priority)}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Manager</label>
                          <p className="text-gray-900">{projectInfo.manager.name}</p>
                          <p className="text-sm text-gray-500">{projectInfo.manager.email}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Tamaño del Equipo</label>
                          <p className="text-gray-900">{projectInfo.teamSize} miembros</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-500">Descripción</label>
                        <p className="text-gray-900 text-sm leading-relaxed">{projectInfo.description}</p>
                      </div>
                    </div>

                    {/* Estadísticas del proyecto */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Estadísticas del Reporte</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{projectInfo.statistics.totalTasks}</div>
                          <div className="text-sm text-gray-600">Total Tareas</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{projectInfo.statistics.completedTasks}</div>
                          <div className="text-sm text-gray-600">Completadas</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{projectInfo.statistics.totalNotes}</div>
                          <div className="text-sm text-gray-600">Notas</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{projectInfo.statistics.completionPercentage}%</div>
                          <div className="text-sm text-gray-600">Progreso</div>
                        </div>
                      </div>
                    </div>

                    {/* Información sobre el contenido del PDF */}
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <InformationCircleIcon className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">Contenido del Reporte PDF</h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <ul className="list-disc list-inside space-y-1">
                              <li>Información completa del proyecto</li>
                              <li>Todas las tareas con sus detalles y estado</li>
                              <li>Notas y comentarios de cada tarea</li>
                              <li>Lista de colaboradores asignados</li>
                              <li>Archivos adjuntos por tarea</li>
                              <li>Historial de cambios de estado</li>
                              <li>Información del equipo del proyecto</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t">
                      <button
                        type="button"
                        className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        onClick={handlePreviewPDF}
                        disabled={isGeneratingPDF}
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        {isGeneratingPDF ? 'Generando...' : 'Vista Previa'}
                      </button>
                      <button
                        type="button"
                        className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        onClick={handleDownloadPDF}
                        disabled={isGeneratingPDF}
                      >
                        <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                        {isGeneratingPDF ? 'Generando PDF...' : 'Descargar PDF'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No se pudo cargar la información del proyecto</p>
                  </div>
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
