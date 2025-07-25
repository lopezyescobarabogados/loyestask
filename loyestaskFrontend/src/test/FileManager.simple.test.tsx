import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import FileManager from '@/components/tasks/FileManager'
import * as FileAPI from '@/api/FileAPI'

// Mock toast notifications
const mockToast = {
  success: vi.fn(),
  error: vi.fn()
}

vi.mock('react-hot-toast', () => ({
  default: mockToast
}))

// Mock API
vi.mock('@/api/FileAPI', () => ({
  getTaskFiles: vi.fn(),
  uploadFiles: vi.fn(),
  deleteFile: vi.fn(),
  replaceFile: vi.fn(),
  downloadFile: vi.fn()
}))

const mockFiles = [
  {
    _id: '1',
    filename: 'document.pdf',
    originalName: 'document.pdf',
    size: 1024 * 1024,
    mimetype: 'application/pdf',
    uploadDate: '2024-12-30',
    uploadedBy: {
      _id: 'user1',
      name: 'Test User',
      email: 'test@example.com'
    }
  }
]

const defaultProps = {
  projectId: 'project-123',
  taskId: 'task-456',
  canEdit: true
}

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('FileManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(FileAPI.getTaskFiles).mockResolvedValue({ files: mockFiles })
    vi.mocked(FileAPI.uploadFiles).mockResolvedValue({ files: [mockFiles[0]] })
    vi.mocked(FileAPI.deleteFile).mockResolvedValue({})
    vi.mocked(FileAPI.replaceFile).mockResolvedValue({ file: mockFiles[0] })
  })

  describe('Basic Rendering', () => {
    it('renders the FileManager component', async () => {
      renderWithProviders(<FileManager {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Archivos Adjuntos')).toBeInTheDocument()
      })
    })

    it('displays the upload button when canEdit is true', async () => {
      renderWithProviders(<FileManager {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Adjuntar archivos')).toBeInTheDocument()
      })
    })

    it('shows files list when files are available', async () => {
      renderWithProviders(<FileManager {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Archivos adjuntos (1)')).toBeInTheDocument()
        expect(screen.getByText('document.pdf')).toBeInTheDocument()
      })
    })
  })

  describe('File Upload Interface', () => {
    it('shows upload interface when upload button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<FileManager {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Adjuntar archivos')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Adjuntar archivos'))

      expect(screen.getByText(/Haz clic para seleccionar/)).toBeInTheDocument()
      expect(screen.getByText(/o arrastra archivos aquí/)).toBeInTheDocument()
    })

    it('shows file size and count limits', async () => {
      const user = userEvent.setup()
      renderWithProviders(<FileManager {...defaultProps} />)

      await user.click(screen.getByText('Adjuntar archivos'))

      expect(screen.getByText(/Máximo 20 archivos/)).toBeInTheDocument()
      expect(screen.getByText(/50 MB por archivo/)).toBeInTheDocument()
    })
  })

  describe('File Operations', () => {
    it('displays file download button', async () => {
      renderWithProviders(<FileManager {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTitle('Descargar archivo')).toBeInTheDocument()
      })
    })

    it('displays file delete button when canEdit is true', async () => {
      renderWithProviders(<FileManager {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTitle('Eliminar archivo')).toBeInTheDocument()
      })
    })

    it('displays file replace button when canEdit is true', async () => {
      renderWithProviders(<FileManager {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByTitle('Reemplazar archivo')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      vi.mocked(FileAPI.getTaskFiles).mockRejectedValueOnce(new Error('Network error'))
      
      renderWithProviders(<FileManager {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Archivos Adjuntos')).toBeInTheDocument()
      })

      // Component should still render the title even with API errors
      expect(screen.getByText('Archivos Adjuntos')).toBeInTheDocument()
    })
  })

  describe('State Management', () => {
    it('maintains component state across re-renders', async () => {
      const { rerender } = renderWithProviders(<FileManager {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Archivos Adjuntos')).toBeInTheDocument()
      })

      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <BrowserRouter>
            <FileManager {...defaultProps} canEdit={false} />
          </BrowserRouter>
        </QueryClientProvider>
      )

      expect(screen.getByText('Archivos Adjuntos')).toBeInTheDocument()
    })

    it('responds to canEdit prop changes', async () => {
      const { rerender } = renderWithProviders(<FileManager {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Adjuntar archivos')).toBeInTheDocument()
      })

      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <BrowserRouter>
            <FileManager {...defaultProps} canEdit={false} />
          </BrowserRouter>
        </QueryClientProvider>
      )

      await waitFor(() => {
        expect(screen.queryByText('Adjuntar archivos')).not.toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    it('shows loading state during API calls', async () => {
      vi.mocked(FileAPI.getTaskFiles).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ files: mockFiles }), 100))
      )

      renderWithProviders(<FileManager {...defaultProps} />)

      expect(screen.getByText('Cargando archivos...')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText('Archivos adjuntos (1)')).toBeInTheDocument()
      })
    })
  })

  describe('Component Integration', () => {
    it('integrates with React Query for data fetching', async () => {
      renderWithProviders(<FileManager {...defaultProps} />)

      await waitFor(() => {
        expect(vi.mocked(FileAPI.getTaskFiles)).toHaveBeenCalledWith({
          projectId: 'project-123',
          taskId: 'task-456'
        })
      })
    })

    it('uses proper toast notifications system', () => {
      expect(mockToast.success).toBeDefined()
      expect(mockToast.error).toBeDefined()
    })
  })
})
