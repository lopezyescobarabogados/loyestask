import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FileManager from '@/components/tasks/FileManager'

// Mock the API
vi.mock('@/api/FileAPI', () => ({
  getTaskFiles: vi.fn().mockResolvedValue({ files: [] }),
  uploadFiles: vi.fn(),
  downloadFile: vi.fn(),
  deleteFile: vi.fn(),
  replaceFile: vi.fn()
}))

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

describe('FileManager Component', () => {
  const defaultProps = {
    projectId: 'project1',
    taskId: 'task1'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly with default state', () => {
    renderWithQueryClient(<FileManager {...defaultProps} />)
    
    expect(screen.getByText('Archivos Adjuntos')).toBeInTheDocument()
    expect(screen.getByText('Adjuntar archivos')).toBeInTheDocument()
  })

  it('disables actions when canEdit is false', () => {
    renderWithQueryClient(<FileManager {...defaultProps} canEdit={false} />)
    
    expect(screen.queryByText('Adjuntar archivos')).not.toBeInTheDocument()
  })
})