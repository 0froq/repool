<script setup lang="ts">
import type { MenuItem } from '@froq/ui/vue'
import { Menu } from '@froq/ui'

const { sourceKey, options, source } = useRadar()
const open = ref(false)

const items = computed<MenuItem[]>(() =>
  options.value.map((o, i) => ({ value: o.key, label: o.label, separatorBefore: i === 1 })),
)
const counts = computed(() => Object.fromEntries(options.value.map(o => [o.key, o.repos.length])))

function select(item: MenuItem) {
  sourceKey.value = item.value
}

// The library's Menu leaves Escape to the caller.
function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) open.value = false
}

onMounted(() => window.addEventListener('keydown', onKey, true))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey, true))
</script>

<template>
  <Menu
    v-model="open"
    class="repool-menu"
    label="Source"
    :items="items"
    :disabled="!options.length"
    side="bottom"
    align="start"
    @select="select"
  >
    <template #trigger>
      <button
        type="button"
        class="source-trigger"
        :disabled="!options.length"
      >
        <span class="source-label">{{ source?.label ?? 'loading…' }}</span>
        <span
          class="source-caret"
          aria-hidden="true"
        />
      </button>
    </template>
    <template #item="{ item }">
      <span :aria-current="item.value === sourceKey ? 'page' : undefined">{{ item.label }}</span>
      <span class="repool-menu-count">{{ counts[item.value] }}</span>
    </template>
  </Menu>
</template>

<style scoped>
.source-trigger {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
  padding: 0;
  border: 0;
  color: var(--muted);
  font-size: 14px;
  transition: color var(--dur-2) var(--ease);
}

.source-trigger:hover,
.source-trigger[data-state='open'] {
  color: var(--fg);
}

.source-trigger:disabled {
  cursor: default;
}

.source-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.source-caret {
  width: 5px;
  height: 5px;
  margin-top: -3px;
  border-inline-end: 1px solid currentColor;
  border-block-end: 1px solid currentColor;
  transform: rotate(45deg);
}
</style>
