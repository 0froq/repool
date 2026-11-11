<script setup lang="ts">
import type { RadarItem } from '#shared/types/radar'
import type { Status } from '~/composables/useMarks'

const props = defineProps<{ item: RadarItem; stale: boolean; index: number }>()

const { get, toggleStatus, cyclePriority } = useMarks()
const { focus, labels, toggleLabel } = useView()
const { login } = useViewer()

const mark = computed(() => get(props.item.key))
const status = computed(() => mark.value?.status ?? 'inbox')
const priority = computed(() => mark.value?.priority ?? 0)

const ACTIONS: { status: Status; text: string }[] = [
  { status: 'watching', text: 'watch' },
  { status: 'tonight', text: 'tonight' },
  { status: 'parked', text: 'park' },
]
</script>

<template>
  <article
    class="item"
    :class="{ stale, tonight: status === 'tonight' }"
    :style="{ '--i': Math.min(index, 12) }"
  >
    <div class="kicker">
      <button
        type="button"
        class="kicker-repo"
        :title="`Focus ${item.repo}`"
        @click="focus = item.repo"
      >
        {{ item.repo }}
      </button>
      <span>#{{ item.number }}</span>
      <span
        v-if="item.kind === 'pr'"
        class="kind"
        >{{ item.draft ? 'draft pr' : 'pr' }}</span
      >
      <span :title="`updated ${item.updatedAt}`">{{ ago(item.updatedAt) }}</span>
      <span
        v-if="stale"
        title="Not in the current source feed; showing the saved snapshot"
        >snapshot</span
      >
      <span class="actions">
        <button
          v-for="a in ACTIONS"
          :key="a.status"
          type="button"
          class="action"
          :class="{ hot: a.status === 'tonight' }"
          :aria-pressed="status === a.status"
          @click="toggleStatus(item, a.status)"
        >
          {{ a.text }}
        </button>
        <button
          type="button"
          class="action priority"
          :aria-pressed="priority > 0"
          :title="`Priority ${priority} of 3`"
          @click="cyclePriority(item)"
        >
          {{ priority ? '!'.repeat(priority) : '·' }}
        </button>
      </span>
    </div>

    <h2 class="title">
      <a
        :href="item.url"
        target="_blank"
        rel="noopener"
        >{{ item.title }}</a
      >
    </h2>

    <div class="meta">
      <button
        v-for="l in item.labels"
        :key="l.name"
        type="button"
        class="label"
        :aria-pressed="labels.includes(l.name)"
        @click="toggleLabel(l.name)"
      >
        <span
          class="label-dot"
          :style="{ background: `#${l.color}` }"
        />{{ l.name }}
      </button>
      <span v-if="item.comments"
        >{{ item.comments }} repl{{ item.comments === 1 ? 'y' : 'ies' }}</span
      >
      <span v-if="item.author">by @{{ item.author }}</span>
      <span
        v-if="!item.assignees.length"
        class="free"
        >unassigned</span
      >
      <span v-else>
        →
        <template
          v-for="(who, i) in item.assignees"
          :key="who"
          ><span :class="{ me: who === login }">@{{ who }}</span
          >{{ i < item.assignees.length - 1 ? ', ' : '' }}</template
        >
      </span>
    </div>
  </article>
</template>

<style scoped>
.item {
  position: relative;
  display: grid;
  gap: 8px;
  padding: 20px 0 18px;
  border-bottom: 1px solid var(--line);
  animation: item-in var(--dur-3) var(--ease) calc(var(--i) * 18ms) backwards;
}

@keyframes item-in {
  from {
    opacity: 0;
    translate: 0 4px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .item {
    animation: none;
  }
}

/* Same 3px accent capsule the sidebar puts on the current link. */
.item.tonight::before {
  position: absolute;
  top: 24px;
  left: -16px;
  width: 3px;
  height: 14px;
  border-radius: 1px;
  background: var(--accent);
  content: '';
}

.item.stale {
  opacity: 0.6;
}

.kicker,
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  align-items: baseline;
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 10.5px;
  line-height: 1.5;
  letter-spacing: 0.03em;
}

/* Buttons sit above the title's stretched link so the rest of the row opens the item. */
.kicker button,
.meta button {
  position: relative;
  z-index: 1;
  padding: 0;
  border: 0;
  letter-spacing: inherit;
  transition: color var(--dur-2) var(--ease);
}

.kicker-repo:hover,
.label:hover,
.label[aria-pressed='true'] {
  color: var(--fg);
}

.kind {
  color: var(--info);
}

.actions {
  display: flex;
  gap: 12px;
  margin-left: auto;
}

.action {
  color: var(--faint);
}

.item:hover .action,
.item:focus-within .action {
  color: var(--muted);
}

.kicker .action:hover {
  color: var(--fg);
}

.kicker .action[aria-pressed='true'] {
  color: var(--fg);
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-color: var(--accent);
}

.kicker .action.hot[aria-pressed='true'],
.kicker .priority[aria-pressed='true'] {
  color: var(--accent);
}

.priority {
  min-width: 2ch;
  text-align: center;
}

.kicker .priority[aria-pressed='true'] {
  text-decoration: none;
}

.title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 400;
  line-height: 1.25;
  letter-spacing: -0.015em;
  overflow-wrap: anywhere;
  text-wrap: pretty;
}

.title a {
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: 4px;
  text-decoration-thickness: 1px;
  transition: text-decoration-color var(--dur-2) var(--ease);
}

.title a::after {
  position: absolute;
  inset: 0;
  content: '';
}

.item:hover .title a {
  text-decoration-color: var(--faint);
}

.label {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.label[aria-pressed='true'] {
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-color: var(--accent);
}

.label-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.free {
  color: var(--good);
}

.me {
  color: var(--accent);
}

@media (max-width: 640px) {
  .title {
    font-size: 19px;
  }

  .item.tonight::before {
    left: -10px;
  }
}
</style>
