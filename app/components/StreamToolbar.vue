<script setup lang="ts">
import { Choice, Pick, Select, TextInput } from '@froq/ui'
import type { ChoiceOption } from '@froq/ui'
import { WINDOWS } from '#shared/types/radar'
import type { AssigneeFilter, KindFilter, SortKey } from '~/composables/useView'

const TITLES = { inbox: 'Inbox', watching: 'Watching', tonight: 'Tonight', parked: 'Parked' }
const KINDS: ChoiceOption<KindFilter>[] = [
  { value: 'all', label: 'all' },
  { value: 'issue', label: 'issues' },
  { value: 'pr', label: 'prs' },
]
const ASSIGNEES: ChoiceOption<AssigneeFilter>[] = [
  { value: 'any', label: 'anyone' },
  { value: 'none', label: 'unassigned' },
  { value: 'me', label: 'assigned to me' },
]
const DAYS: ChoiceOption[] = [
  { value: '1', label: '24 hours' },
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
]
const SORTS: ChoiceOption<SortKey>[] = [
  { value: 'updated', label: 'updated' },
  { value: 'created', label: 'created' },
  { value: 'comments', label: 'replies' },
]

const { tab, kind, assignee, sort, labels, labelOptions, q, focus, visible } = useView()
const { feed, days } = useRadar()
const focusTotals = computed(() => (focus.value ? feed.data.value?.totals[focus.value] : undefined))

const daysText = computed({
  get: () => String(days.value),
  set: value => {
    const next = WINDOWS.find(d => d === Number(value))
    if (next) days.value = next
  },
})
const sortText = computed({
  get: () => sort.value,
  set: value => {
    const next = SORTS.find(s => s.value === value)
    if (next) sort.value = next.value
  },
})
const assigneeText = computed({
  get: () => assignee.value,
  set: value => {
    const next = ASSIGNEES.find(a => a.value === value)
    if (next) assignee.value = next.value
  },
})
</script>

<template>
  <div class="toolbar">
    <h1 class="view-title">
      {{ TITLES[tab] }}<span class="view-count">{{ visible.length }}</span>
    </h1>

    <div class="controls">
      <div class="fields">
        <TextInput
          v-model="q"
          class="search"
          label="Search"
          type="search"
          placeholder="title, label, author"
        />
        <Select
          v-model="daysText"
          class="pick"
          label="Updated within"
          :options="DAYS"
        />
        <Select
          v-model="assigneeText"
          class="pick"
          label="Assignee"
          :options="ASSIGNEES"
        />
        <Select
          v-model="sortText"
          class="pick"
          label="Sort"
          :options="SORTS"
        />
      </div>
      <Choice
        v-model="kind"
        label="Kind"
        :options="KINDS"
      />
      <Pick
        v-if="labelOptions.length"
        v-model="labels"
        label="Labels"
        :options="labelOptions"
      >
        <template
          v-if="labels.length"
          #extra
        >
          <button
            type="button"
            class="ui-pick-quiet"
            @click="labels = []"
          >
            clear
          </button>
        </template>
      </Pick>
    </div>

    <div
      v-if="focus"
      class="scope"
    >
      <span>scoped to</span>
      <button
        type="button"
        class="scope-chip"
        title="Clear repo focus"
        @click="focus = null"
      >
        {{ focus }}<span aria-hidden="true">×</span>
      </button>
      <a
        v-if="focusTotals"
        :href="`https://github.com/${focus}/issues`"
        target="_blank"
        rel="noopener"
        class="scope-totals"
      >
        {{ focusTotals.issues }} issues · {{ focusTotals.prs }} PRs open on GitHub ↗
      </a>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: grid;
  gap: 24px;
}

.view-title {
  display: flex;
  gap: 14px;
  align-items: baseline;
  margin: 0;
  font-family: var(--font-display);
  font-size: 44px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.025em;
}

.view-count {
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 12px;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
}

.controls {
  display: grid;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
}

.fields {
  display: flex;
  flex-wrap: wrap;
  gap: 20px 32px;
  align-items: end;
}

.fields .search {
  flex: 1 1 14rem;
  max-width: none;
}

.pick {
  min-width: 7.5rem;
}

.scope {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: baseline;
  margin-top: -8px;
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 11px;
  letter-spacing: 0.02em;
}

.scope-chip {
  display: inline-flex;
  gap: 8px;
  padding: 0;
  border: 0;
  color: var(--fg);
  transition: color var(--dur-2) var(--ease);
}

.scope-chip span {
  color: var(--muted);
}

.scope-chip:hover span {
  color: var(--accent);
}

.scope-totals {
  margin-left: auto;
  transition: color var(--dur-2) var(--ease);
}

.scope-totals:hover {
  color: var(--fg);
}
</style>
