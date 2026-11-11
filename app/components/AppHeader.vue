<script setup lang="ts">
import { Paper, Toggle } from '@froq/ui'

const { sources, feed, reload } = useRadar()
const { me, login, signOut } = useViewer()
const { compact, open: navOpen, trigger: navTrigger } = useNav()
const { theme, ready, setTheme } = useTheme()

const dark = computed({
  get: () => ready.value && theme.value === 'dark',
  set: value => setTheme(value ? 'dark' : 'light'),
})

const loading = computed(
  () => sources.status.value === 'pending' || feed.status.value === 'pending',
)
const now = useNow({ interval: 30_000 })
const fetched = computed(() => {
  const at = feed.data.value?.fetchedAt
  return at ? `refreshed ${ago(at, now.value.getTime())}` : 'refresh'
})
</script>

<template>
  <Paper
    fixed
    class="app-header"
  >
    <header class="header-bar">
      <nav
        class="location"
        aria-label="Location"
      >
        <button
          v-if="compact"
          ref="navTrigger"
          type="button"
          class="nav-toggle"
          aria-label="Views and repos"
          :aria-expanded="navOpen"
          aria-controls="repool-nav"
          aria-haspopup="dialog"
          @click="navOpen = !navOpen"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M4 7h16M4 12h16M4 17h10" />
          </svg>
        </button>
        <span class="brand">repool<span class="brand-dot">.</span></span>
        <span
          class="trail-sep"
          aria-hidden="true"
          >/</span
        >
        <SourceMenu />
      </nav>
      <div class="header-end">
        <span
          v-if="login"
          class="viewer"
          >@{{ login }}</span
        >
        <button
          v-if="me.data.value?.authenticated && me.data.value.via === 'session'"
          type="button"
          class="meta-button"
          @click="signOut"
        >
          sign out
        </button>
        <button
          type="button"
          class="meta-button refresh"
          :disabled="loading"
          title="Bypass the server cache and refetch"
          @click="reload"
        >
          {{ loading ? 'loading…' : fetched }}
        </button>
        <Toggle
          v-model="dark"
          class="theme-toggle"
          label="Dark theme"
          :disabled="!ready"
        >
          <template #off>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="4"
              />
              <path
                d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1.1 1.1M17.3 17.3l1.1 1.1M5.6 18.4l1.1-1.1M17.3 6.7l1.1-1.1"
              />
            </svg>
          </template>
          <template #on>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
            </svg>
          </template>
        </Toggle>
      </div>
    </header>
  </Paper>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 5;
  border-bottom: 1px solid var(--line);
}

.header-bar {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  height: var(--header-h);
  padding: 0 var(--main-pad);
}

.location {
  display: flex;
  gap: 10px;
  align-items: baseline;
  min-width: 0;
}

.nav-toggle {
  display: inline-grid;
  place-items: center;
  align-self: center;
  width: 36px;
  height: 36px;
  margin-left: -8px;
  padding: 7px;
  border: 0;
  color: var(--fg);
}

.brand {
  color: var(--fg);
  font-family: var(--font-display);
  font-size: 24px;
  letter-spacing: -0.01em;
  line-height: 1;
}

.brand-dot {
  color: var(--accent);
}

.trail-sep {
  color: var(--faint);
  font-family: var(--font-meta);
  font-size: 14px;
}

.header-end {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-shrink: 0;
}

.viewer,
.meta-button {
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 11px;
  letter-spacing: 0.02em;
}

.meta-button {
  padding: 0;
  border: 0;
  font-variant-numeric: tabular-nums;
  transition: color var(--dur-2) var(--ease);
}

.meta-button:hover:not(:disabled) {
  color: var(--fg);
}

.meta-button:disabled {
  cursor: default;
}

/* Toggle sizes a slotted icon to 1em, so the font size is the icon size. */
.theme-toggle {
  font-size: 20px;
}

@media (max-width: 640px) {
  .viewer {
    display: none;
  }
}
</style>
