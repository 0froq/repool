export type ThemeName = 'light' | 'dark'

/** The head script resolves `kit-theme` before paint; this only mirrors and flips it. */
export function useTheme() {
  const theme = ref<ThemeName>('light')
  const ready = ref(false)

  function setTheme(next: ThemeName) {
    theme.value = next
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('kit-theme', next)
    } catch {
      /* Storage may be unavailable; the current theme still applies. */
    }
  }

  onMounted(() => {
    theme.value = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
    ready.value = true
  })

  return { theme, ready, setTheme }
}
