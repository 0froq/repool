import type { SessionUser } from '../utils/session'

declare module 'h3' {
  interface H3EventContext {
    user?: SessionUser
  }
}

export default defineEventHandler(async event => {
  if (!event.path.startsWith('/api/')) return
  const { secret } = authConfig()
  if (!secret) return
  const user = await readUserCookie(event, secret)
  if (user) event.context.user = user
})
