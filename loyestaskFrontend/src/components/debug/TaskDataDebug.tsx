import type { Task } from '@/types/index'

interface TaskDataDebugProps {
    task: Task
    visible?: boolean
}

export default function TaskDataDebug({ task, visible = false }: TaskDataDebugProps) {
    if (!visible) return null

    return (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mt-4 text-xs">
            <h4 className="font-bold text-gray-700 mb-2">🔍 Debug: Datos de Tarea</h4>
            <div className="space-y-2">
                <div>
                    <strong>ID:</strong> {task._id}
                </div>
                <div>
                    <strong>Nombre:</strong> {task.name}
                </div>
                <div>
                    <strong>Archivos en archive:</strong> {task.archive?.length || 0}
                </div>
                {task.archive && task.archive.length > 0 && (
                    <div>
                        <strong>Archivos:</strong>
                        <pre className="bg-white p-2 rounded mt-1 text-xs overflow-auto max-h-32">
                            {JSON.stringify(task.archive, null, 2)}
                        </pre>
                    </div>
                )}
                <div>
                    <strong>Todas las propiedades:</strong>
                    <pre className="bg-white p-2 rounded mt-1 text-xs overflow-auto max-h-64">
                        {JSON.stringify(task, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    )
}
