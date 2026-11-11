import type { RadarFeed, Sources, WindowDays } from '#shared/types/radar'

export interface SourceOption {
  key: string
  label: string
  repos: string[]
}

let forceSources = false
let forceFeed = false

export const useRadar = createSharedComposable(() => {
  const sourceKey = useLocalStorage('repool:source', 'stars')
  const days = useLocalStorage<WindowDays>('repool:days', 7)

  const sources = useAsyncData('sources', () =>
    $fetch<Sources>('/api/sources', { query: forceSources ? { refresh: 1 } : {} }).finally(() => {
      forceSources = false
    }),
  )

  const options = computed<SourceOption[]>(() => {
    const s = sources.data.value
    if (!s) return []
    return [
      { key: 'stars', label: 'All stars', repos: s.stars.map(r => r.name) },
      ...s.lists.map(l => ({ key: `list:${l.slug}`, label: l.name, repos: l.repos })),
    ]
  })

  const source = computed(
    () => options.value.find(o => o.key === sourceKey.value) ?? options.value[0],
  )
  const repos = computed(() => source.value?.repos ?? [])

  const feed = useAsyncData(
    'feed',
    async (): Promise<RadarFeed | null> => {
      if (!repos.value.length) return null
      const query: Record<string, string | number> = {
        repos: repos.value.join(','),
        days: days.value,
      }
      if (forceFeed) query.refresh = 1
      forceFeed = false
      return $fetch<RadarFeed>('/api/feed', { query })
    },
    { watch: [repos, days] },
  )

  async function reload() {
    forceSources = true
    forceFeed = true
    await sources.refresh()
    await feed.refresh()
  }

  return { sourceKey, days, sources, options, source, repos, feed, reload }
})
