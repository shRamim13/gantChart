import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SlideOverProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function SlideOver({ open, onClose, title, children }: SlideOverProps) {
  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 transition-opacity" onClick={onClose} />
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-xl transition-transform duration-300 dark:bg-gray-900',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </div>
      </div>
    </>
  )
}
