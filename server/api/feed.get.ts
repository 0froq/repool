import { createHash } from 'node:crypto'
import { WINDOWS } from '#shared/types/radar'
import type { Label, RadarFeed, RadarItem, RepoTotals, WindowDays } from '#shared/types/radar'

const REPO_RE = /^[\w.-]+\/[\w.-]+$/
const MAX_REPOS = 200
const PER_KIND = 100
const CHUNK = 5
const PARALLEL = 8
const DAY = 86_400_000

interface ItemNode {
  number: number
  title: string
  url: string
  createdAt: string
  updatedAt: string
  isDraft?: boolean
  author: { login: string } | null
  comments: { totalCount: number }
  assignees: { nodes: { login: string }[] }
  labels: { nodes: Label[] }
}

interface Page {
  totalCount: number
  nodes: ItemNode[]
}

interface RepoNode {
  nameWithOwner: string
  issues: { totalCount: number }
  pullRequests: { totalCount: number }
  recentIssues: Page
  recentPulls: Page
}

const ITEM_FIELDS = `
  number title url createdAt updatedAt
  author { login }
  comments { totalCount }
  assignees(first: 10) { nodes { login } }
  labels(first: 6) { nodes { name color } }
`

// Issues filter by `since` server-side; pull requests have no such filter, so they are cut by date below.
const FRAGMENT = /* GraphQL */ `
  fragment R on Repository {
    nameWithOwner
    issues(states: OPEN) { totalCount }
    pullRequests(states: OPEN) { totalCount }
    recentIssues: issues(first: ${PER_KIND}, states: OPEN, filterBy: { since: $since }, orderBy: { field: UPDATED_AT, direction: DESC }) {
      totalCount
      nodes { ${ITEM_FIELDS} }
    }
    recentPulls: pullRequests(first: ${PER_KIND}, states: OPEN, orderBy: { field: UPDATED_AT, direction: DESC }) {
      totalCount
      nodes { ${ITEM_FIELDS} isDraft }
    }
  }
`

function toItem(repo: string, kind: RadarItem['kind'], n: ItemNode): RadarItem {
  return {
    key: `${repo}#${n.number}`,
    repo,
    kind,
    number: n.number,
    title: n.title,
    url: n.url,
    author: n.author?.login ?? null,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
    comments: n.comments.totalCount,
    assignees: n.assignees.nodes.map(a => a.login),
    draft: n.isDraft ?? false,
    labels: n.labels.nodes,
  }
}

async function fetchChunk(token: string, repos: string[], since: string) {
  const vars: Record<string, string> = { since }
  const defs: string[] = ['$since: DateTime!']
  const fields: string[] = []
  repos.forEach((full, i) => {
    const [owner, name] = full.split('/') as [string, string]
    vars[`o${i}`] = owner
    vars[`n${i}`] = name
    defs.push(`$o${i}: String!, $n${i}: String!`)
    fields.push(`r${i}: repository(owner: $o${i}, name: $n${i}) { ...R }`)
  })
  const query = `query (${defs.join(', ')}) { ${fields.join('\n')} }\n${FRAGMENT}`
  const { data } = await graphql<Record<string, RepoNode | null>>(token, query, vars)

  const items: RadarItem[] = []
  const totals: Record<string, RepoTotals> = {}
  const missing: string[] = []
  const truncated: string[] = []
  repos.forEach((full, i) => {
    const node = data[`r${i}`]
    if (!node) return void missing.push(full)
    const repo = node.nameWithOwner
    totals[repo] = { issues: node.issues.totalCount, prs: node.pullRequests.totalCount }

    const pulls = node.recentPulls.nodes.filter(n => n.updatedAt >= since)
    if (
      node.recentIssues.totalCount > PER_KIND ||
      (pulls.length === PER_KIND && node.recentPulls.totalCount > PER_KIND)
    )
      truncated.push(repo)

    for (const n of node.recentIssues.nodes) items.push(toItem(repo, 'issue', n))
    for (const n of pulls) items.push(toItem(repo, 'pr', n))
  })
  return { items, totals, missing, truncated }
}

const loadFeed = defineCachedFunction(
  async (
    token: string,
    _login: string,
    repos: string[],
    days: WindowDays,
    _refresh: boolean,
  ): Promise<RadarFeed> => {
    const since = new Date(Date.now() - days * DAY).toISOString()
    const chunks: string[][] = []
    for (let i = 0; i < repos.length; i += CHUNK) chunks.push(repos.slice(i, i + CHUNK))

    const results: Awaited<ReturnType<typeof fetchChunk>>[] = []
    for (let i = 0; i < chunks.length; i += PARALLEL)
      results.push(
        ...(await Promise.all(chunks.slice(i, i + PARALLEL).map(c => fetchChunk(token, c, since)))),
      )

    return {
      items: results.flatMap(r => r.items),
      totals: Object.assign({}, ...results.map(r => r.totals)),
      missing: results.flatMap(r => r.missing),
      truncated: results.flatMap(r => r.truncated),
      days,
      fetchedAt: new Date().toISOString(),
    }
  },
  {
    name: 'feed',
    maxAge: 60 * 5,
    swr: false,
    getKey: (_token, login, repos, days) =>
      createHash('sha1')
        .update(`${login}:${days}:${repos.join(',')}`)
        .digest('hex'),
    shouldInvalidateCache: (_token, _login, _repos, _days, refresh) => refresh,
  },
)

export default defineEventHandler(async event => {
  const { token, login } = await requireViewer(event)
  const query = getQuery(event)
  const repos = [...new Set(String(query.repos ?? '').split(','))]
    .filter(r => REPO_RE.test(r))
    .sort()
  if (!repos.length) throw createError({ statusCode: 400, statusMessage: 'No repos given' })
  if (repos.length > MAX_REPOS)
    throw createError({ statusCode: 400, statusMessage: `At most ${MAX_REPOS} repos` })
  const days = WINDOWS.find(d => d === Number(query.days)) ?? 7
  return loadFeed(token, login, repos, days, Boolean(query.refresh))
})
