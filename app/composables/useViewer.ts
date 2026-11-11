import type { Me } from '#shared/types/radar'

export const useViewer = createSharedComposable(() => {
  const me = useAsyncData('me', () => $fetch<Me>('/api/auth/me'))
  const login = computed(() => (me.data.value?.authenticated ? me.data.value.login : null))

  function signIn() {
    window.location.href = '/api/auth/login'
  }

  async function signOut() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    window.location.reload()
  }

  return { me, login, signIn, signOut }
})
