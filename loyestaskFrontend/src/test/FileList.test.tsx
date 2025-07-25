import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FileList from '@/components/tasks/FileList'

// Mock the API
vi.mock('@/api/FileAPI', () => ({
  downloadFile: vi.fn().mockResolvedValue(new Blob()),
  deleteFile: vi.fn().mockResolvedValue({}),
  replaceFile: vi.fn().mockResolvedValue({})
}))

const mockFiles = [
  {
    _id: '1',
    fileName: 'document.pdf', // Corregido: usar fileName en lugar de filename
    originalName: 'document.pdf',
    mimeType: 'application/pdf',
    fileSize: 1048576,
    filePath: '/uploads/document.pdf',
    uploadedAt: '2024-12-31T00:00:00.000Z',
    uploadedBy: 'user1'
  }
]

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('FileList Component', () => {
  const defaultProps = {
    projectId: 'project1',
    taskId: 'task1'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state when no files', () => {
    renderWithQueryClient(<FileList {...defaultProps} files={[]} />)
    
    expect(screen.getByText(/No hay archivos adjuntos/)).toBeInTheDocument()
  })

  it('renders file list correctly', () => {
    renderWithQueryClient(<FileList {...defaultProps} files={mockFiles} />)
    
    expect(screen.getByText('Archivos adjuntos (1)')).toBeInTheDocument()
    expect(screen.getByText('document.pdf')).toBeInTheDocument()
  })
})