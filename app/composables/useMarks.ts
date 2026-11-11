import type { RadarItem } from '#shared/types/radar'

export type Status = 'inbox' | 'watching' | 'tonight' | 'parked'
export type Priority = 0 | 1 | 2 | 3

export interface Mark {
  status: Status
  priority: Priority
  /** Snapshot so marked items still render when they leave the current source. */
  item: RadarItem
  at: number
}

export const useMarks = createSharedComposable(() => {
  const marks = useLocalStorage<Record<string, Mark>>('repool:marks', {})

  function get(key: string): Mark | undefined {
    return marks.value[key]
  }

  function update(item: RadarItem, patch: Partial<Pick<Mark, 'status' | 'priority'>>) {
    const prev = marks.value[item.key]
    const next: Mark = {
      status: prev?.status ?? 'inbox',
      priority: prev?.priority ?? 0,
      ...patch,
      item,
      at: Date.now(),
    }
    const copy = { ...marks.value }
    if (next.status === 'inbox' && !next.priority) delete copy[item.key]
    else copy[item.key] = next
    marks.value = copy
  }

  function toggleStatus(item: RadarItem, status: Status) {
    update(item, { status: get(item.key)?.status === status ? 'inbox' : status })
  }

  function cyclePriority(item: RadarItem) {
    update(item, { priority: (((get(item.key)?.priority ?? 0) + 1) % 4) as Priority })
  }

  return { marks, get, toggleStatus, cyclePriority }
})
