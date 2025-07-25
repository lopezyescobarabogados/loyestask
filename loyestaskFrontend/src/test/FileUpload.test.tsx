import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import FileUpload from '@/components/tasks/FileUpload'

describe('FileUpload Component', () => {
  const mockOnFilesSelected = vi.fn()

  beforeEach(() => {
    mockOnFilesSelected.mockClear()
  })

  it('renders upload zone correctly', () => {
    render(<FileUpload onFilesSelected={mockOnFilesSelected} />)
    
    expect(screen.getByText(/Haz clic para seleccionar/)).toBeInTheDocument()
    expect(screen.getByText(/o arrastra archivos aquí/)).toBeInTheDocument()
    expect(screen.getByText(/Máximo 20 archivos/)).toBeInTheDocument()
  })

  it('shows loading state when uploading', () => {
    render(<FileUpload onFilesSelected={mockOnFilesSelected} isUploading={true} />)
    
    expect(screen.getByText('Subiendo archivos...')).toBeInTheDocument()
  })

  it('handles drag and drop correctly', () => {
    render(<FileUpload onFilesSelected={mockOnFilesSelected} />)
    
    const dropZone = screen.getByText(/Haz clic para seleccionar/).closest('div')
    expect(dropZone).toBeInTheDocument()
  })
})