import { useState, useRef, useEffect, useCallback } from 'react'
import type { Profile } from '@/types'
import { cn } from '@/lib/utils'

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  profiles: Profile[]
  placeholder?: string
  rows?: number
  className?: string
}

export function MentionInput({ value, onChange, onSubmit, profiles, placeholder, rows = 2, className }: MentionInputProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionIndex, setMentionIndex] = useState(0)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filtered = profiles.filter((p) =>
    p.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 8)

  const insertMention = useCallback((profile: Profile) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPos = textarea.selectionStart
    const textBefore = value.slice(0, cursorPos)
    const textAfter = value.slice(cursorPos)

    // Find the @ position
    const atIndex = textBefore.lastIndexOf('@')
    if (atIndex === -1) return

    const beforeAt = value.slice(0, atIndex)
    const mention = `@${profile.name} `
    const newText = beforeAt + mention + textAfter

    onChange(newText)
    setShowDropdown(false)
    setMentionQuery('')

    // Set cursor position after mention
    setTimeout(() => {
      const newPos = atIndex + mention.length
      textarea.setSelectionRange(newPos, newPos)
      textarea.focus()
    }, 0)
  }, [value, onChange])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value
    onChange(newValue)

    const cursorPos = e.target.selectionStart
    const textBefore = newValue.slice(0, cursorPos)
    const atIndex = textBefore.lastIndexOf('@')

    if (atIndex !== -1) {
      const query = textBefore.slice(atIndex + 1)
      // Only show dropdown if @ is at start or preceded by space/newline
      const charBeforeAt = atIndex > 0 ? newValue[atIndex - 1] : ' '
      if (charBeforeAt === ' ' || charBeforeAt === '\n' || atIndex === 0) {
        if (!query.includes(' ') || query.length < 20) {
          setMentionQuery(query)
          setShowDropdown(true)
          setMentionIndex(0)

          // Calculate dropdown position
          const textarea = textareaRef.current
          if (textarea) {
            const rect = textarea.getBoundingClientRect()
            setDropdownPos({
              top: rect.height + 4,
              left: 0,
            })
          }
          return
        }
      }
    }
    setShowDropdown(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (showDropdown && filtered.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionIndex((prev) => (prev + 1) % filtered.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionIndex((prev) => (prev - 1 + filtered.length) % filtered.length)
      } else if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        insertMention(filtered[mentionIndex])
        return
      } else if (e.key === 'Escape') {
        setShowDropdown(false)
        return
      }
    }

    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && value.trim()) {
      e.preventDefault()
      onSubmit()
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        rows={rows}
        className={cn(
          'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white resize-none',
          className
        )}
        placeholder={placeholder || "Type @ to mention someone... (Ctrl+Enter to send)"}
      />

      {showDropdown && filtered.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-64 rounded-lg border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-800"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          {filtered.map((profile, i) => (
            <button
              key={profile.id}
              onMouseDown={(e) => {
                e.preventDefault()
                insertMention(profile)
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors',
                i === mentionIndex
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
              )}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-5 w-5 rounded-full" />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[8px] font-medium text-white">
                  {profile.name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{profile.name}</div>
                <div className="truncate text-[10px] text-gray-400">{profile.email}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
