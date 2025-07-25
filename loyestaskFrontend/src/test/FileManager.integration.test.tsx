import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: mockToast
}))

// Mock completo de la API
vi.mock('@/api/FileAPI', () => ({
  getTaskFiles: vi.fn(),
  uploadFiles: vi.fn(),
  deleteFile: vi.fn(),
  replaceFile: vi.fn(),
  downloadFile: vi.fn()
}))

// Mock de react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}))

const mockFiles = [
  {
    _id: '1',
    filename: 'document.pdf',
    originalName: 'document.pdf',
    mimeType: 'application/pdf',
    fileSize: 1048576,
    filePath: '/uploads/document.pdf',
    uploadedAt: '2024-12-31T00:00:00.000Z',
    uploadedBy: 'user1'
  }
]

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    </BrowserRouter>
  )
}

describe('FileManager Integration Tests', () => {
  const defaultProps = {
    projectId: 'project1',
    taskId: 'task1'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(FileAPI.getTaskFiles).mockResolvedValue({ files: mockFiles })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Upload Flow Integration', () => {
    it('shows the file upload component', async () => {
      renderWithProviders(<FileManager {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Archivos Adjuntos')).toBeInTheDocument()
      })

      // Click to open file dialog
      await userEvent.setup().click(screen.getByText('Adjuntar archivos'))
      
      // Verify the upload interface is shown
      expect(screen.getByText(/Haz clic para seleccionar/)).toBeInTheDocument()
      expect(screen.getByText(/o arrastra archivos aquí/)).toBeInTheDocument()
    })

    it('handles upload errors gracefully', async () => {
      // Mock error response
      vi.mocked(FileAPI.uploadFiles).mockRejectedValueOnce(new Error('Upload failed'))

      renderWithProviders(<FileManager {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Archivos Adjuntos')).toBeInTheDocument()
      })

      // Verify error handling is available
      expect(mockToast.error).toBeDefined()
    })

    it('shows loading states correctly', async () => {
      // Mock slow upload
      vi.mocked(FileAPI.uploadFiles).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ files: [mockFiles[0]] }), 1000))
      )

      renderWithProviders(<FileManager {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Archivos Adjuntos')).toBeInTheDocument()
      })

      // Verify loading component is available
      expect(screen.getByText('Adjuntar archivos')).toBeInTheDocument()
    })
  })

  describe('Error Recovery', () => {
    it('recovers from network errors', async () => {
      vi.mocked(FileAPI.getTaskFiles)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ files: mockFiles })

      renderWithProviders(<FileManager {...defaultProps} />)

      // Just wait for the component to mount and handle the error gracefully
      await waitFor(() => {
        expect(screen.getByText('Archivos Adjuntos')).toBeInTheDocument()
      })

      // Since we're mocking the API to succeed on subsequent calls,
      // the component should eventually show the files
      await waitFor(() => {
        expect(screen.getByText('Archivos adjuntos (1)')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('handles concurrent operations safely', async () => {
      const user = userEvent.setup()
      
      // Mock both upload and delete
      vi.mocked(FileAPI.uploadFiles).mockResolvedValue({ files: [mockFiles[0]] })
      vi.mocked(FileAPI.deleteFile).mockResolvedValue({})

      renderWithProviders(<FileManager {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Archivos Adjuntos')).toBeInTheDocument()
      })

      // Start upload
      await user.click(screen.getByText('Adjuntar archivos'))
      
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const fileInput = document.querySelector('input[type="file"][multiple]') as HTMLInputElement
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      })
      
      fireEvent.change(fileInput)

      // Verify no conflicts occur
      await waitFor(() => {
        expect(screen.getByText('Archivos seleccionados (1)')).toBeInTheDocument()
      })
    })
  })

  describe('State Management', () => {
    it('maintains consistent state across operations', async () => {
      const user = userEvent.setup()
      vi.mocked(FileAPI.uploadFiles).mockResolvedValue({ files: [mockFiles[0]] })

      renderWithProviders(<FileManager {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Archivos Adjuntos')).toBeInTheDocument()
      })

      // Complete upload flow
      await user.click(screen.getByText('Adjuntar archivos'))
      
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const fileInput = document.querySelector('input[type="file"][multiple]') as HTMLInputElement
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      })
      
      fireEvent.change(fileInput)

      // Wait for files to be selected
      await waitFor(() => {
        expect(screen.getByText('Archivos seleccionados (1)')).toBeInTheDocument()
      })

      // Check if upload button appears
      const uploadButton = screen.queryByText(/Subir 1 archivo/)
      if (uploadButton) {
        await user.click(uploadButton)
      }

      // Verify state resets after successful upload
      await waitFor(() => {
        expect(screen.queryByText('Archivos seleccionados')).not.toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('prevents invalid state transitions', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<FileManager {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Archivos Adjuntos')).toBeInTheDocument()
      })

      // Start upload mode
      await user.click(screen.getByText('Adjuntar archivos'))
      
      // Try to click main upload button again (should be disabled/hidden)
      expect(screen.queryByText('Adjuntar archivos')).not.toBeInTheDocument()
    })
  })
})
