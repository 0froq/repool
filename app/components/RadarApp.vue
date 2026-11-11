<script setup lang="ts">
import { Alert, Button, Drawer, EmptyState } from '@froq/ui'

const PAGE = 150

const { sourceKey, days, sources, source, feed } = useRadar()
const { tab, visible, focus, labels, q, kind, assignee } = useView()
const { signIn } = useViewer()
const { compact, open: navOpen, trigger: navTrigger } = useNav()

const limit = ref(PAGE)
watch([tab, focus, labels, q, kind, assignee, sourceKey, days], () => {
  limit.value = PAGE
})

const live = computed(() => new Set(feed.data.value?.items.map(i => i.key) ?? []))
const loading = computed(
  () => sources.status.value === 'pending' || feed.status.value === 'pending',
)
const error = computed(() => sources.error.value ?? feed.error.value)
const filtering = computed(() =>
  Boolean(
    focus.value ||
    labels.value.length ||
    q.value.trim() ||
    kind.value !== 'all' ||
    assignee.value !== 'any',
  ),
)
</script>

<template>
  <div class="shell">
    <AppHeader />
    <div class="body">
      <aside
        v-if="!compact"
        class="rail"
      >
        <RadarSidebar />
      </aside>
      <Drawer
        v-else
        id="repool-nav"
        v-model="navOpen"
        side="left"
        :show-trigger="false"
        :return-focus="navTrigger ?? undefined"
        aria-label="Views and repos"
        close-label="Close"
        close-on-scroll-outside
        style="width: min(18rem, calc(100vw - 24px))"
      >
        <RadarSidebar />
      </Drawer>
      <main class="main">
        <div class="inner">
          <StreamToolbar />

          <Alert
            v-if="error"
            class="notice"
            title="Could not reach GitHub"
          >
            {{ error.statusMessage || error.message }}
            <Button
              v-if="error.statusCode === 401"
              class="resign"
              @click="signIn"
            >
              sign in again
            </Button>
          </Alert>

          <p
            v-else-if="loading && !visible.length"
            class="status"
          >
            Fetching the last {{ days }} day{{ days === 1 ? '' : 's' }} of issues and PRs across
            {{ source?.repos.length ?? '…' }} repos…
          </p>

          <template v-else>
            <p
              v-if="feed.data.value?.missing.length"
              class="status"
            >
              Skipped (renamed, private or gone): {{ feed.data.value.missing.join(', ') }}
            </p>

            <div
              v-if="visible.length"
              class="list"
            >
              <ItemRow
                v-for="(item, index) in visible.slice(0, limit)"
                :key="item.key"
                :item="item"
                :index="index"
                :stale="tab !== 'inbox' && !live.has(item.key)"
              />
            </div>

            <EmptyState
              v-else-if="tab === 'inbox' || filtering"
              class="empty"
              title="Nothing here"
              description="No open item matches these filters."
            />
            <EmptyState
              v-else
              class="empty"
              :title="`No ${tab} items yet`"
              description="Mark rows from the Inbox with watch, tonight or park."
            >
              <template #actions>
                <Button @click="tab = 'inbox'">open inbox</Button>
              </template>
            </EmptyState>

            <div
              v-if="visible.length > limit"
              class="more"
            >
              <span>{{ limit }} of {{ visible.length }}</span>
              <Button @click="limit += PAGE">
                show {{ Math.min(PAGE, visible.length - limit) }} more
              </Button>
            </div>
          </template>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell {
  --main-pad: clamp(20px, 4vw, 56px);
  --header-h: 60px;
  min-height: 100vh;
}

.body {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  max-width: 1180px;
  margin: 0 auto;
  padding-inline: var(--main-pad);
  column-gap: clamp(32px, 4vw, 64px);
}

.rail {
  position: sticky;
  top: var(--header-h);
  align-self: start;
  max-height: calc(100vh - var(--header-h));
  overflow-y: auto;
  padding: 40px 4px 40px 0;
  margin-left: -10px;
  padding-left: 10px;
}

.main {
  min-width: 0;
  padding: 40px 0 96px;
}

.inner {
  max-width: 760px;
}

.notice {
  margin-top: 24px;
}

.resign {
  margin-left: 12px;
}

.status {
  margin: 20px 0 0;
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 11px;
  letter-spacing: 0.02em;
}

.empty {
  margin-top: 48px;
}

.more {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: center;
  margin-top: 32px;
  color: var(--muted);
  font-family: var(--font-meta);
  font-size: 11px;
}

@media (max-width: 900px) {
  .body {
    grid-template-columns: minmax(0, 1fr);
  }

  .main {
    padding-top: 32px;
  }
}
</style>
