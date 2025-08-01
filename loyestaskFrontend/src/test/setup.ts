import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock window.URL.createObjectURL
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mocked-url'),
    revokeObjectURL: vi.fn(),
  },
  writable: true,
})

// Mock DataTransfer
class MockDataTransfer {
  items = {
    add: vi.fn(),
    clear: vi.fn(),
    remove: vi.fn(),
    length: 0,
    [Symbol.iterator]: function* () {},
  }
  files = [] as File[]
  types = [] as string[]
  effectAllowed = 'all' as const
  dropEffect = 'copy' as const

  getData = vi.fn()
  setData = vi.fn()
  setDragImage = vi.fn()
  clearData = vi.fn()
}

Object.defineProperty(window, 'DataTransfer', {
  value: MockDataTransfer,
  writable: true,
})

// Mock fetch
global.fetch = vi.fn()

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
