import type { Me } from '#shared/types/radar'

export default defineEventHandler(async (event): Promise<Me> => {
  setHeader(event, 'cache-control', 'no-store')
  const viewer = await viewerOf(event)
  const { clientId, secret } = authConfig()
  const configured = Boolean(clientId && secret)
  if (!viewer) return { authenticated: false, configured }
  return {
    authenticated: true,
    configured,
    login: viewer.login,
    name: viewer.name ?? null,
    avatarUrl: viewer.avatarUrl ?? null,
    via: viewer.via,
  }
})
