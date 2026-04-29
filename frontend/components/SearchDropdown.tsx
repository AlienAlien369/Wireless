import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'

interface SearchDropdownProps {
  items: any[]
  value: string | number
  onChange: (value: string | number) => void
  getLabel: (item: any) => string
  getValue: (item: any) => string | number
  placeholder?: string
  className?: string
  disabled?: boolean
}

export default function SearchDropdown({
  items,
  value,
  onChange,
  getLabel,
  getValue,
  placeholder = 'Search...',
  className = 'input',
  disabled = false,
}: SearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredItems = items.filter(item =>
    getLabel(item).toLowerCase().includes(search.toLowerCase())
  )

  const selectedItem = items.find(item => String(getValue(item)) === String(value))

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={dropdownRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? search : selectedItem ? getLabel(selectedItem) : ''}
          onChange={e => setSearch(e.target.value)}
          onClick={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`${className} pl-10 pr-10`}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        {value && isOpen && (
          <button
            onClick={() => {
              onChange('')
              setSearch('')
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">No results found</div>
          ) : (
            filteredItems.map(item => (
              <button
                key={getValue(item)}
                onClick={() => {
                  onChange(getValue(item))
                  setIsOpen(false)
                  setSearch('')
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                  getValue(item) === value ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700'
                }`}
              >
                {getLabel(item)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
