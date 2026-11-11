import type { ItemKind, RadarItem } from '#shared/types/radar'
import type { Status } from './useMarks'

export type KindFilter = 'all' | ItemKind
export type AssigneeFilter = 'any' | 'none' | 'me'
export type SortKey = 'updated' | 'created' | 'comments'

const MAX_LABELS = 40

export const useView = createSharedComposable(() => {
  const { feed, repos } = useRadar()
  const { marks } = useMarks()
  const { login } = useViewer()

  const tab = useLocalStorage<Status>('repool:tab', 'inbox')
  const kind = useLocalStorage<KindFilter>('repool:kind', 'all')
  const assignee = useLocalStorage<AssigneeFilter>('repool:assignee', 'any')
  const sort = useLocalStorage<SortKey>('repool:sort', 'updated')
  const focus = ref<string | null>(null)
  const labels = ref<string[]>([])
  const q = ref('')

  const live = computed(() => {
    const map = new Map<string, RadarItem>()
    for (const item of feed.data.value?.items ?? []) map.set(item.key, item)
    return map
  })

  const tabItems = computed(() => {
    if (tab.value === 'inbox')
      return [...live.value.values()].filter(
        i => (marks.value[i.key]?.status ?? 'inbox') === 'inbox',
      )
    return Object.values(marks.value)
      .filter(m => m.status === tab.value)
      .map(m => live.value.get(m.item.key) ?? m.item)
  })

  const tabCounts = computed(() => {
    const counts: Record<Status, number> = { inbox: 0, watching: 0, tonight: 0, parked: 0 }
    for (const item of live.value.values())
      if ((marks.value[item.key]?.status ?? 'inbox') === 'inbox') counts.inbox++
    for (const m of Object.values(marks.value)) if (m.status !== 'inbox') counts[m.status]++
    return counts
  })

  function matches(item: RadarItem) {
    if (kind.value !== 'all' && item.kind !== kind.value) return false
    if (assignee.value === 'none' && item.assignees.length) return false
    if (assignee.value === 'me' && !(login.value && item.assignees.includes(login.value)))
      return false
    const needle = q.value.trim().toLowerCase()
    if (needle) {
      const hay = [item.title, item.repo, item.author ?? '', ...item.labels.map(l => l.name)]
        .join(' ')
        .toLowerCase()
      if (!hay.includes(needle)) return false
    }
    return true
  }

  const hasLabel = (item: RadarItem) =>
    !labels.value.length || item.labels.some(l => labels.value.includes(l.name))

  /** Everything but the label filter, so label counts say what picking one would leave. */
  const unlabeled = computed(() => tabItems.value.filter(matches))
  const filtered = computed(() => unlabeled.value.filter(hasLabel))

  const labelOptions = computed(() => {
    const counts = new Map<string, number>()
    for (const item of unlabeled.value) {
      if (focus.value && item.repo !== focus.value) continue
      for (const l of item.labels) counts.set(l.name, (counts.get(l.name) ?? 0) + 1)
    }
    const top = [...counts]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, MAX_LABELS)
    for (const name of labels.value)
      if (!top.some(([n]) => n === name)) top.push([name, counts.get(name) ?? 0])
    return top.map(([value, count]) => ({ value, label: value, count }))
  })

  function toggleLabel(name: string) {
    labels.value = labels.value.includes(name)
      ? labels.value.filter(l => l !== name)
      : [...labels.value, name]
  }

  const rail = computed(() => {
    const counts = new Map<string, number>()
    for (const item of filtered.value) counts.set(item.repo, (counts.get(item.repo) ?? 0) + 1)
    const rows = [...counts].map(([repo, hits]) => ({ repo, hits }))
    if (tab.value === 'inbox')
      for (const repo of repos.value) if (!counts.has(repo)) rows.push({ repo, hits: 0 })
    return rows.sort((a, b) => b.hits - a.hits || a.repo.localeCompare(b.repo))
  })

  const visible = computed(() => {
    const list = focus.value ? filtered.value.filter(i => i.repo === focus.value) : filtered.value
    const by: Record<SortKey, (i: RadarItem) => number> = {
      updated: i => Date.parse(i.updatedAt),
      created: i => Date.parse(i.createdAt),
      comments: i => i.comments,
    }
    const key = by[sort.value]
    return [...list].sort(
      (a, b) =>
        (marks.value[b.key]?.priority ?? 0) - (marks.value[a.key]?.priority ?? 0) ||
        key(b) - key(a),
    )
  })

  watch(tab, () => {
    focus.value = null
  })

  return {
    tab,
    kind,
    assignee,
    sort,
    focus,
    labels,
    q,
    tabCounts,
    filtered,
    labelOptions,
    toggleLabel,
    rail,
    visible,
  }
})
