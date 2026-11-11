export const useNav = createSharedComposable(() => {
  const compact = useMediaQuery('(max-width: 900px)')
  const open = ref(false)
  const trigger = shallowRef<HTMLElement | null>(null)

  watch(compact, value => {
    if (!value) open.value = false
  })

  return { compact, open, trigger }
})
