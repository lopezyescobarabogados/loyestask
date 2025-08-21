import React, { useState } from 'react'

interface CurrencyInputProps {
  id: string
  name: string
  value?: number
  onChange: (value: number) => void
  placeholder?: string
  className?: string
  required?: boolean
}

export default function CurrencyInput({
  id,
  name,
  value = 0,
  onChange,
  placeholder = "0",
  className = "",
  required = false
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState(() => {
    if (value && value > 0) {
      return formatCurrencyDisplay(value)
    }
    return ""
  })

  // Formatear número para mostrar en el input (con puntos como separadores de miles)
  const formatCurrencyDisplay = (num: number): string => {
    if (!num || num === 0) return ""
    return num.toLocaleString('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
  }

  // Convertir texto del input a número
  const parseCurrencyValue = (text: string): number => {
    if (!text) return 0
    // Remover puntos (separadores de miles) y reemplazar coma por punto para decimales
    const cleaned = text.replace(/\./g, '').replace(',', '.')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // Permitir solo números, puntos, comas y espacios
    const allowedPattern = /^[\d.,\s]*$/
    if (!allowedPattern.test(inputValue)) {
      return
    }

    // Si el campo está vacío, limpiar todo
    if (inputValue === '') {
      setDisplayValue('')
      onChange(0)
      return
    }

    // Convertir a número y validar
    const numericValue = parseCurrencyValue(inputValue)
    
    // Actualizar el valor numérico en el formulario
    onChange(numericValue)
    
    // Formatear para mostrar en el input
    if (numericValue > 0) {
      setDisplayValue(formatCurrencyDisplay(numericValue))
    } else {
      setDisplayValue('')
    }
  }

  const handleBlur = () => {
    // Al perder el foco, asegurar formato correcto
    if (value && value > 0) {
      setDisplayValue(formatCurrencyDisplay(value))
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Al enfocar, seleccionar todo el texto
    e.target.select()
  }

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
        $
      </span>
      <input
        type="text"
        id={id}
        name={name}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={`pl-8 ${className}`}
        required={required}
        inputMode="numeric"
      />
      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
        COP
      </span>
    </div>
  )
}
