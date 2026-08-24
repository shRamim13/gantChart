import { useMemo, useState } from 'react'
import { format, differenceInCalendarDays, parseISO, isToday, isBefore, startOfDay } from 'date-fns'
import type { Task, SortDirection } from '@/types'
import { TASK_TYPE_OPTIONS } from '@/types'
import { PriorityIcon } from '@/components/ui/PriorityIcon'
import { cn } from '@/lib/utils'

interface TimelineViewProps {
  tasks: Task[]
  onSelectTask: (task: Task) => void
  onNewTask: () => void
  searchQuery: string
  projectPrefix: string
}

export function TimelineView({ tasks, onSelectTask, onNewTask, searchQuery, projectPrefix }: TimelineViewProps) {
  const [sortField, setSortField] = useState<'start_date' | 'due_date' | 'priority' | 'status' | 'title'>('start_date')
  const [sortDir, setSortDir] = useState<SortDirection>('asc')

  function toggleSort(field: typeof sortField) {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  const statusOrder: Record<string, number> = { in_progress: 0, todo: 1, qa_test: 2, hold: 3, done: 4 }

  const filteredTasks = useMemo(() => {
    const result = searchQuery
      ? tasks.filter(
          (t) =>
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
            `${projectPrefix}-${t.ticket_number}`.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : tasks

    return result
      .filter((t) => t.start_date && t.due_date)
      .sort((a, b) => {
        let cmp = 0
        if (sortField === 'start_date') cmp = new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime()
        else if (sortField === 'due_date') cmp = new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()
        else if (sortField === 'priority') cmp = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
        else if (sortField === 'status') cmp = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)
        else if (sortField === 'title') cmp = a.title.localeCompare(b.title)
        return sortDir === 'desc' ? -cmp : cmp
      })
  }, [tasks, searchQuery, projectPrefix, sortField, sortDir])

  // Build month blocks
  const monthBlocks = useMemo(() => {
    if (filteredTasks.length === 0) return []

    const allDates = filteredTasks.flatMap((t) => [parseISO(t.start_date!), parseISO(t.due_date!)])
    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())))
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())))

    // Pad 1 month before and after
    minDate.setMonth(minDate.getMonth() - 1)
    minDate.setDate(1)
    maxDate.setMonth(maxDate.getMonth() + 2)
    maxDate.setDate(0)

    const blocks: { month: string; days: number; startDate: Date }[] = []
    const current = new Date(minDate)

    while (current <= maxDate) {
      const year = current.getFullYear()
      const month = current.getMonth()
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      blocks.push({
        month: format(current, 'MMM yyyy'),
        days: daysInMonth,
        startDate: new Date(current),
      })
      current.setMonth(current.getMonth() + 1)
    }

    return blocks
  }, [filteredTasks])

  const totalDays = useMemo(() => monthBlocks.reduce((sum, b) => sum + b.days, 0), [monthBlocks])
  const timelineStart = monthBlocks.length > 0 ? monthBlocks[0].startDate.getTime() : Date.now()

  function getBarPosition(startStr: string, endStr: string) {
    const start = parseISO(startStr).getTime()
    const end = parseISO(endStr).getTime()
    const totalMs = monthBlocks.length > 0
      ? (monthBlocks[monthBlocks.length - 1].startDate.getTime() + monthBlocks[monthBlocks.length - 1].days * 86400000) - timelineStart
      : 1
    const leftPct = ((start - timelineStart) / totalMs) * 100
    const widthPct = ((end - start) / totalMs) * 100
    return { left: leftPct, width: Math.max(widthPct, 1.5) }
  }

  function getBarColor(task: Task) {
    const today = startOfDay(new Date())
    if (task.status === 'done') return 'bg-emerald-400 dark:bg-emerald-500'
    if (task.status === 'hold') return 'bg-orange-400 dark:bg-orange-500'
    if (task.due_date && isBefore(parseISO(task.due_date), today)) return 'bg-red-400 dark:bg-red-500'
    if (task.status === 'qa_test') return 'bg-yellow-400 dark:bg-yellow-500'
    if (task.status === 'in_progress') return 'bg-blue-400 dark:bg-blue-500'
    return 'bg-indigo-400 dark:bg-indigo-500'
  }

  const today = new Date()
  const todayOffset = useMemo(() => {
    const todayMs = today.getTime()
    const totalMs = monthBlocks.length > 0
      ? (monthBlocks[monthBlocks.length - 1].startDate.getTime() + monthBlocks[monthBlocks.length - 1].days * 86400000) - timelineStart
      : 1
    return ((todayMs - timelineStart) / totalMs) * 100
  }, [monthBlocks, timelineStart])

  if (tasks.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/20">
          <svg className="h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No timeline data</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add start and due dates to tasks to see the timeline</p>
        </div>
        <button onClick={onNewTask} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95">
          Create Task
        </button>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="min-w-[1000px] p-6">
        {/* Sort controls */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">Sort:</span>
          {(['start_date', 'due_date', 'priority', 'status', 'title'] as const).map((field) => (
            <button
              key={field}
              onClick={() => toggleSort(field)}
              className={cn(
                'rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all',
                sortField === field
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                  : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              )}
            >
              {field === 'start_date' ? 'Start' : field === 'due_date' ? 'Due' : field === 'title' ? 'Name' : field.charAt(0).toUpperCase() + field.slice(1)}
              {sortField === field && (sortDir === 'asc' ? ' ↑' : ' ↓')}
            </button>
          ))}
        </div>

        {/* Month headers */}
        <div className="flex border-b border-gray-200 dark:border-gray-700" style={{ marginLeft: 240 }}>
          {monthBlocks.map((block, i) => {
            const daysOnTimeline = differenceInCalendarDays(
              new Date(block.startDate.getFullYear(), block.startDate.getMonth() + 1, 0),
              block.startDate
            ) + 1
            const widthPct = (daysOnTimeline / totalDays) * 100
            return (
              <div
                key={i}
                className="flex-shrink-0 border-r border-gray-100 px-2 py-2 text-center dark:border-gray-800"
                style={{ width: `${widthPct}%` }}
              >
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{block.month}</span>
              </div>
            )
          })}
        </div>

        {/* Day grid under months */}
        <div className="flex border-b border-gray-200 dark:border-gray-700" style={{ marginLeft: 240 }}>
          {monthBlocks.map((block, bi) => {
            const daysInMonth = block.days
            const widthPct = (daysInMonth / totalDays) * 100
            return (
              <div key={bi} className="flex flex-shrink-0" style={{ width: `${widthPct}%` }}>
                {Array.from({ length: daysInMonth }, (_, di) => {
                  const d = new Date(block.startDate)
                  d.setDate(d.getDate() + di)
                  const dayNum = d.getDate()
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6
                  const isTodayDate = isToday(d)
                  return (
                    <div
                      key={di}
                      className={cn(
                        'flex-1 py-0.5 text-center text-[9px]',
                        isTodayDate ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500',
                        isWeekend && 'bg-gray-50 dark:bg-gray-800/30'
                      )}
                    >
                      {dayNum}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Today line */}
        {todayOffset > 0 && todayOffset < 100 && (
          <div
            className="absolute top-0 bottom-0 w-px bg-indigo-400 opacity-40 dark:bg-indigo-500"
            style={{ left: `calc(240px + ${todayOffset}%)` }}
          />
        )}

        {/* Task rows */}
        <div className="space-y-1 pt-1">
          {filteredTasks.map((task) => {
            const { left, width } = getBarPosition(task.start_date!, task.due_date!)
            const barColor = getBarColor(task)
            const taskType = TASK_TYPE_OPTIONS.find((t) => t.value === task.task_type)

            return (
              <div key={task.id} className="group flex items-center rounded-lg py-1 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                {/* Task info */}
                <div className="flex w-[240px] flex-shrink-0 items-center gap-2 px-2">
                  <span className="w-16 flex-shrink-0 font-mono text-[10px] text-gray-400 dark:text-gray-500">
                    {projectPrefix}-{task.ticket_number}
                  </span>
                  {taskType && (
                    <span className={`flex-shrink-0 rounded px-1 py-0.5 text-[8px] font-medium ${taskType.color}`}>
                      {taskType.label.slice(0, 3).toUpperCase()}
                    </span>
                  )}
                  <button
                    onClick={() => onSelectTask(task)}
                    className="flex-1 truncate text-left text-xs font-medium text-gray-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                  >
                    {task.title}
                  </button>
                  <PriorityIcon priority={task.priority} />
                </div>

                {/* Bar */}
                <div className="relative h-7 flex-1">
                  {/* Weekend shading */}
                  {monthBlocks.map((block, bi) => {
                    const blockWidthPct = (block.days / totalDays) * 100
                    let offset = 0
                    for (let j = 0; j < bi; j++) offset += (monthBlocks[j].days / totalDays) * 100
                    return (
                      <div
                        key={bi}
                        className="absolute top-0 bottom-0"
                        style={{ left: `${offset}%`, width: `${blockWidthPct}%` }}
                      >
                        {Array.from({ length: block.days }, (_, di) => {
                          const d = new Date(block.startDate)
                          d.setDate(d.getDate() + di)
                          if (d.getDay() !== 0 && d.getDay() !== 6) return null
                          const dayPct = (1 / totalDays) * 100
                          return (
                            <div
                              key={di}
                              className="absolute top-0 bottom-0 bg-gray-50/70 dark:bg-gray-800/20"
                              style={{ left: `${(di / block.days) * 100}%`, width: `${dayPct * 100}%` }}
                            />
                          )
                        })}
                      </div>
                    )
                  })}

                  {/* Month dividers */}
                  {monthBlocks.reduce<{ pct: number }[]>((acc, _block, i) => {
                    if (i > 0) {
                      let offset = 0
                      for (let j = 0; j < i; j++) offset += (monthBlocks[j].days / totalDays) * 100
                      acc.push({ pct: offset })
                    }
                    return acc
                  }, []).map((divider, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700/50"
                      style={{ left: `${divider.pct}%` }}
                    />
                  ))}

                  {/* Task bar */}
                  <button
                    onClick={() => onSelectTask(task)}
                    className={cn(
                      'absolute top-1 h-5 cursor-pointer rounded-md shadow-sm transition-all hover:brightness-110 hover:shadow-md',
                      barColor
                    )}
                    style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
                    title={`${projectPrefix}-${task.ticket_number}: ${task.title}`}
                  >
                    {width > 6 && (
                      <span className="flex h-full items-center px-1.5 text-[9px] font-medium text-white drop-shadow-sm">
                        {task.title.length > 25 ? task.title.slice(0, 25) + '...' : task.title}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-4 border-t border-gray-200 pt-4 dark:border-gray-800">
          <span className="text-xs text-gray-400 dark:text-gray-500">{filteredTasks.length} tasks on timeline</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="h-2 w-2 rounded-sm bg-indigo-400" /> To Do</span>
            <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="h-2 w-2 rounded-sm bg-blue-400" /> Development</span>
            <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="h-2 w-2 rounded-sm bg-orange-400" /> Hold</span>
            <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="h-2 w-2 rounded-sm bg-yellow-400" /> QA Test</span>
            <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="h-2 w-2 rounded-sm bg-emerald-400" /> Done</span>
            <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="h-2 w-2 rounded-sm bg-red-400" /> Overdue</span>
          </div>
        </div>
      </div>
    </div>
  )
}
