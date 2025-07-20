/**
 * Utility functions for handling dates consistently across the application
 * Prevents timezone issues when working with date inputs
 */

/**
 * Converts a date string to the format required by HTML date inputs (YYYY-MM-DD)
 * without timezone conversion issues
 */
export const formatDateForInput = (dateString: string): string => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  
  // Handle invalid dates
  if (isNaN(date.getTime())) return ''
  
  // Get the date components in local timezone
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * Converts a date input value (YYYY-MM-DD) to a Date object
 * set to noon local time to avoid timezone issues
 */
export const parseDateFromInput = (dateString: string): Date => {
  if (!dateString) throw new Error('Date string is required')
  
  const [year, month, day] = dateString.split('-').map(Number)
  
  // Create date at noon local time to avoid timezone issues
  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

/**
 * Normalizes a date from a date input for API requests
 * Returns an ISO string that represents the date at noon local time
 */
export const normalizeDateForApi = (dateString: string): string => {
  if (!dateString) return dateString
  
  try {
    const normalizedDate = parseDateFromInput(dateString)
    return normalizedDate.toISOString()
  } catch (error) {
    console.error('Error normalizing date:', error)
    return dateString
  }
}

/**
 * Formats a date for display in the UI
 */
export const formatDateForDisplay = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) return 'Fecha inválida'
  
  return dateObj.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
