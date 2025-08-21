import { Fragment, useState } from 'react'
import { Combobox, ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'

interface YearOption {
    value: number
    label: string
}

interface YearSelectorProps {
    selectedYear: number
    onYearChange: (year: number) => void
    disabled?: boolean
    minYear?: number
    maxYear?: number
}

export default function YearSelector({ 
    selectedYear, 
    onYearChange, 
    disabled = false,
    minYear = 2020,
    maxYear = new Date().getFullYear() + 1
}: YearSelectorProps) {
    const [query, setQuery] = useState('')

    // Generar años disponibles
    const YEARS: YearOption[] = []
    for (let year = maxYear; year >= minYear; year--) {
        YEARS.push({ value: year, label: year.toString() })
    }

    const selectedYearOption = YEARS.find(year => year.value === selectedYear) || YEARS[0]

    const filteredYears = query === ''
        ? YEARS
        : YEARS.filter((year) =>
            year.label
                .toLowerCase()
                .includes(query.toLowerCase())
        )

    return (
        <div className="w-full">
            <Combobox 
                value={selectedYearOption} 
                onChange={(year) => year && onYearChange(year.value)}
                disabled={disabled}
            >
                <div className="relative">
                    <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm">
                        <ComboboxInput
                            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 disabled:bg-gray-100 disabled:text-gray-500"
                            displayValue={(year: YearOption) => year?.label || ''}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Seleccionar año..."
                        />
                        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                            />
                        </ComboboxButton>
                    </div>
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        afterLeave={() => setQuery('')}
                    >
                        <ComboboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
                            {filteredYears.length === 0 && query !== '' ? (
                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                    No se encontraron años.
                                </div>
                            ) : (
                                filteredYears.map((year) => (
                                    <ComboboxOption
                                        key={year.value}
                                        className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                            }`
                                        }
                                        value={year}
                                    >
                                        {({ selected, active }) => (
                                            <>
                                                <span
                                                    className={`block truncate ${
                                                        selected ? 'font-medium' : 'font-normal'
                                                    }`}
                                                >
                                                    {year.label}
                                                </span>
                                                {selected ? (
                                                    <span
                                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                            active ? 'text-white' : 'text-blue-600'
                                                        }`}
                                                    >
                                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                    </span>
                                                ) : null}
                                            </>
                                        )}
                                    </ComboboxOption>
                                ))
                            )}
                        </ComboboxOptions>
                    </Transition>
                </div>
            </Combobox>
        </div>
    )
}
