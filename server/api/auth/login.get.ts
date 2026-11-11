export default defineEventHandler(async event => {
  const { clientId, secret } = authConfig()
  if (!clientId || !secret)
    throw createError({ statusCode: 503, statusMessage: 'GitHub OAuth is not configured' })
  const origin = requestOrigin(event)
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}/api/auth/callback`,
    scope: 'read:user',
    state: await signState(secret, origin),
  })
  return sendRedirect(event, `https://github.com/login/oauth/authorize?${params}`, 302)
})
