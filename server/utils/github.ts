import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { H3Event } from 'h3'

export interface Viewer {
  login: string
  token: string
  name?: string
  avatarUrl?: string
  via: 'session' | 'local'
}

let localViewer: Promise<Viewer | null> | undefined

/** Dev only: lets `pnpm dev` run without an OAuth App, using the developer's own token. */
async function resolveLocal(): Promise<Viewer | null> {
  let token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  if (!token) {
    try {
      token = (await promisify(execFile)('gh', ['auth', 'token'])).stdout.trim()
    } catch {}
  }
  if (!token) return null
  const { data } = await graphql<{
    viewer: { login: string; name: string | null; avatarUrl: string }
  }>(token, 'query { viewer { login name avatarUrl } }')
  return { ...data.viewer, name: data.viewer.name ?? undefined, token, via: 'local' }
}

export async function viewerOf(event: H3Event): Promise<Viewer | null> {
  if (event.context.user) return { ...event.context.user, via: 'session' }
  if (!import.meta.dev) return null
  localViewer ??= resolveLocal().catch(() => null)
  return localViewer
}

export async function requireViewer(event: H3Event): Promise<Viewer> {
  const viewer = await viewerOf(event)
  if (!viewer) throw createError({ statusCode: 401, statusMessage: 'Sign in with GitHub' })
  return viewer
}

interface GraphQLError {
  message: string
  type?: string
  path?: (string | number)[]
}

interface GraphQLResponse<T> {
  data?: T
  errors?: GraphQLError[]
}

/** Returns partial data alongside errors; throws only when nothing came back. */
export async function graphql<T>(
  token: string,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<{ data: T; errors: GraphQLError[] }> {
  const res = await $fetch<GraphQLResponse<T>>('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'authorization': `bearer ${token}`,
      'user-agent': 'repool',
    },
    body: { query, variables },
  }).catch(error => {
    // An expired or revoked OAuth token surfaces as 401; let the client send the user to sign in.
    if (error?.response?.status === 401)
      throw createError({ statusCode: 401, statusMessage: 'GitHub rejected the token' })
    throw error
  })
  if (!res.data) {
    throw createError({
      statusCode: 502,
      statusMessage: res.errors?.map(e => e.message).join('; ') || 'GitHub GraphQL failed',
    })
  }
  return { data: res.data, errors: res.errors ?? [] }
}
