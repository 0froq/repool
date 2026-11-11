<script setup lang="ts">
import { Sidebar, TextInput } from '@froq/ui'
import type { SidebarGroup } from '@froq/ui'
import type { Status } from '~/composables/useMarks'

const ALL = '*'
const TABS: { value: Status; label: string }[] = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'watching', label: 'Watching' },
  { value: 'tonight', label: 'Tonight' },
  { value: 'parked', label: 'Parked' },
]

const { tab, tabCounts, rail, focus, filtered } = useView()
const { feed, days } = useRadar()
const { open: navOpen } = useNav()
const needle = ref('')
const truncated = computed(() => new Set(feed.data.value?.truncated ?? []))

const views: SidebarGroup[] = [{ items: TABS }]

const rows = computed(() => {
  const n = needle.value.trim().toLowerCase()
  return n ? rail.value.filter(r => r.repo.toLowerCase().includes(n)) : rail.value
})
const hits = computed(
  () =>
    new Map<string, number>([
      [ALL, filtered.value.length],
      ...rows.value.map(r => [r.repo, r.hits] as const),
    ]),
)
const repos = computed<SidebarGroup[]>(() => [
  {
    items: [
      { value: ALL, label: 'All repos' },
      ...rows.value.map(r => ({ value: r.repo, label: r.repo })),
    ],
  },
])

function pickTab(value: string) {
  const next = TABS.find(t => t.value === value)
  if (next) tab.value = next.value
  navOpen.value = false
}

function pickRepo(value: string) {
  focus.value = value === ALL ? null : value
  navOpen.value = false
}

function tooltip(repo: string) {
  const t = feed.data.value?.totals[repo]
  if (!t) return repo
  const cap = truncated.value.has(repo) ? ' · capped at 100 per kind' : ''
  return `${repo} · ${t.issues} open issues, ${t.prs} open PRs on GitHub${cap}`
}
</script>

<template>
  <div class="radar-sidebar">
    <Sidebar
      :model-value="tab"
      :groups="views"
      aria-label="Views"
      @update:model-value="pickTab"
    >
      <template #link="{ item, props: linkProps }">
        <a
          v-bind="linkProps"
          class="side-link"
        >
          <span>{{ item.label }}</span>
          <span
            class="side-count"
            :class="{ hot: item.value === 'tonight' && tabCounts.tonight }"
            >{{ tabCounts[item.value as Status] }}</span
          >
        </a>
      </template>
    </Sidebar>

    <section class="repos">
      <TextInput
        v-model="needle"
        class="repo-filter"
        label="Repos"
        type="search"
        placeholder="filter"
      />
      <Sidebar
        :model-value="focus ?? ALL"
        :groups="repos"
        aria-label="Repos"
        @update:model-value="pickRepo"
      >
        <template #link="{ item, props: linkProps }">
          <a
            v-bind="linkProps"
            class="side-link repo-link"
            :class="{ quiet: !hits.get(item.value) }"
            :title="item.value === ALL ? undefined : tooltip(item.value)"
          >
            <span
              v-if="item.value === ALL"
              class="repo-name"
              >{{ item.label }}</span
            >
            <span
              v-else
              class="repo-name"
              ><span class="repo-owner">{{ item.value.split('/')[0] }}/</span
              >{{ item.value.split('/')[1] }}</span
            >
            <span class="side-count"
              >{{ hits.get(item.value) ?? 0 }}{{ truncated.has(item.value) ? '+' : '' }}</span
            >
          </a>
        </template>
      </Sidebar>
      <p class="footnote">
        Open items updated in the last {{ days }} day{{ days === 1 ? '' : 's' }}, up to 100 issues
        and 100 PRs per repo. A + means the cap was hit.
      </p>
    </section>
  </div>
</template>

<style scoped>
.radar-sidebar {
  display: grid;
  align-content: start;
  gap: 36px;
  min-width: 0;
}

.repos {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.repo-filter {
  padding-inline: 10px;
}

/* Two-class selectors keep this flex row above the library's block link. */
.ui-sidebar-link.side-link {
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.ui-sidebar-link.repo-link {
  padding-block: 5px;
  font-size: 13px;
}

.ui-sidebar-link.repo-link.quiet:not([aria-current]) {
  color: var(--faint);
}

.ui-sidebar-link.repo-link.quiet:hover {
  color: var(--fg);
}

.repo-name {
  overflow: hidden;
  min-width: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.repo-owner {
  opacity: 0.55;
}

.side-count {
  flex-shrink: 0;
  align-self: center;
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.side-link[aria-current] .side-count {
  color: var(--fg);
}

.side-count.hot,
.side-link[aria-current] .side-count.hot {
  color: var(--accent);
}

.footnote {
  margin: 0;
  padding-inline: 10px;
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 10px;
  line-height: 1.6;
  letter-spacing: 0.02em;
}
</style>
