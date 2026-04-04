import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

interface BulkEntryModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  placeholder: string
  items: any[]
  getItemLabel: (item: any) => string
  onAdd: (selectedItems: any[]) => void
  itemType: string
}

export default function BulkEntryModal({
  isOpen,
  onClose,
  title,
  placeholder,
  items,
  getItemLabel,
  onAdd,
  itemType,
}: BulkEntryModalProps) {
  const [bulkText, setBulkText] = useState('')
  const [selectedItems, setSelectedItems] = useState<any[]>([])

  const handleParse = () => {
    const lines = bulkText
      .split(/[\n,;]+/)
      .map(line => line.trim())
      .filter(line => line.length > 0)

    const matched = lines
      .map(line => {
        return items.find(item => getItemLabel(item).toLowerCase() === line.toLowerCase())
      })
      .filter(Boolean)

    const unmatched = lines.filter(
      line => !matched.some(m => getItemLabel(m).toLowerCase() === line.toLowerCase())
    )

    if (unmatched.length > 0) {
      toast.error(`${unmatched.length} items not found: ${unmatched.slice(0, 3).join(', ')}`)
    }

    if (matched.length > 0) {
      setSelectedItems(matched)
      toast.success(`Matched ${matched.length} items`)
    }
  }

  const handleAdd = () => {
    if (selectedItems.length === 0) {
      toast.error('Select items to add')
      return
    }
    onAdd(selectedItems)
    setSelectedItems([])
    setBulkText('')
    onClose()
    toast.success(`Added ${selectedItems.length} ${itemType}(s)`)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter item numbers (one per line, or separated by commas/semicolons)
            </label>
            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder={placeholder}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none h-32"
            />
            <p className="text-xs text-gray-500 mt-2">
              Example: ITEM001, ITEM002, ITEM003
            </p>
          </div>

          {selectedItems.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">
                Matched Items ({selectedItems.length})
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <span className="text-sm text-gray-700">{getItemLabel(item)}</span>
                    <button
                      onClick={() =>
                        setSelectedItems(prev => prev.filter((_, i) => i !== idx))
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 md:p-6 flex gap-3">
          <button
            onClick={handleParse}
            className="flex-1 btn-secondary flex items-center justify-center gap-2"
          >
            Find Items
          </button>
          <button
            onClick={handleAdd}
            disabled={selectedItems.length === 0}
            className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus size={16} />
            Add {selectedItems.length}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
