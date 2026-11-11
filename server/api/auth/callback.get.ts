export default defineEventHandler(async event => {
  const { clientId, clientSecret, secret } = authConfig()
  if (!clientId || !clientSecret || !secret)
    throw createError({ statusCode: 503, statusMessage: 'GitHub OAuth is not configured' })

  const query = getQuery(event)
  const code = typeof query.code === 'string' ? query.code : ''
  const state = typeof query.state === 'string' ? query.state : ''
  const origin = requestOrigin(event)
  if (!code || !(await verifyState(secret, state, origin)))
    throw createError({ statusCode: 400, statusMessage: 'Invalid OAuth state' })

  const { access_token: token, error } = await $fetch<{ access_token?: string; error?: string }>(
    'https://github.com/login/oauth/access_token',
    {
      method: 'POST',
      headers: { 'accept': 'application/json', 'user-agent': 'repool' },
      body: {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${origin}/api/auth/callback`,
      },
    },
  )
  if (!token)
    throw createError({ statusCode: 502, statusMessage: error ?? 'Token exchange failed' })

  const { data } = await graphql<{
    viewer: { login: string; name: string | null; avatarUrl: string }
  }>(token, 'query { viewer { login name avatarUrl } }')
  await writeUserCookie(event, secret, {
    login: data.viewer.login,
    token,
    name: data.viewer.name ?? undefined,
    avatarUrl: data.viewer.avatarUrl,
  })
  return sendRedirect(event, '/', 302)
})
