<script setup lang="ts">
import { Button } from '@froq/ui'

defineProps<{ configured: boolean }>()

const { signIn } = useViewer()
</script>

<template>
  <main class="sign-in">
    <h1 class="brand">repool<span class="brand-dot">.</span></h1>
    <p class="tagline">Open issues and PRs across the repos you starred, in one stream.</p>
    <Button
      class="action"
      :disabled="!configured"
      @click="signIn"
    >
      Sign in with GitHub
    </Button>
    <p class="note">Asks for <code>read:user</code> only: your stars, lists and public repos.</p>
    <p class="note">Read-only. Nothing is posted to GitHub; marks stay in this browser.</p>
    <p
      v-if="!configured"
      class="note warn"
    >
      OAuth is not configured on this server: set <code>NUXT_GITHUB_CLIENT_ID</code>,
      <code>NUXT_GITHUB_CLIENT_SECRET</code> and <code>NUXT_SESSION_SECRET</code>.
    </p>
  </main>
</template>

<style scoped>
.sign-in {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  justify-content: center;
  width: min(440px, 100%);
  min-height: 100vh;
  margin: 0 auto;
  padding: 32px 20px;
}

.brand {
  margin: 0;
  font-family: var(--font-display);
  font-size: 56px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.02em;
}

.brand-dot {
  color: var(--accent);
}

.tagline {
  margin: 0;
  color: var(--muted);
  font-size: 16px;
  text-wrap: pretty;
}

.action {
  margin-top: 12px;
}

.note {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

.note code {
  font-family: var(--font-meta);
  font-size: 12px;
}

.warn {
  margin-top: 12px;
  color: var(--fg);
}
</style>
