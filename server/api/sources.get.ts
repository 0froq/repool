import type { RepoRef, Sources, StarList } from '#shared/types/radar'

interface RepoNode {
  nameWithOwner: string
  description: string | null
  stargazerCount: number
  isArchived: boolean
}

interface StarsPage {
  viewer: {
    login: string
    starredRepositories: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null }
      nodes: RepoNode[]
    }
  }
}

interface ListsPage {
  viewer: {
    lists: {
      nodes: {
        slug: string
        name: string
        items: { nodes: ({ nameWithOwner?: string; isArchived?: boolean } | null)[] }
      }[]
    }
  }
}

const STARS = /* GraphQL */ `
  query ($after: String) {
    viewer {
      login
      starredRepositories(
        first: 100
        after: $after
        orderBy: { field: STARRED_AT, direction: DESC }
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          nameWithOwner
          description
          stargazerCount
          isArchived
        }
      }
    }
  }
`

// GitHub caps users at 32 lists; items per list stay well under 100 in practice.
const LISTS = /* GraphQL */ `
  query {
    viewer {
      lists(first: 32) {
        nodes {
          slug
          name
          items(first: 100) {
            nodes {
              ... on Repository {
                nameWithOwner
                isArchived
              }
            }
          }
        }
      }
    }
  }
`

const loadSources = defineCachedFunction(
  async (token: string, _login: string, _refresh: boolean): Promise<Sources> => {
    const stars: RepoRef[] = []
    let login = ''
    let after: string | null = null
    do {
      const { data } = await graphql<StarsPage>(token, STARS, { after })
      login = data.viewer.login
      for (const r of data.viewer.starredRepositories.nodes) {
        if (r.isArchived) continue
        stars.push({ name: r.nameWithOwner, description: r.description, stars: r.stargazerCount })
      }
      const page: { hasNextPage: boolean; endCursor: string | null } =
        data.viewer.starredRepositories.pageInfo
      after = page.hasNextPage ? page.endCursor : null
    } while (after)

    const { data } = await graphql<ListsPage>(token, LISTS)
    const lists: StarList[] = data.viewer.lists.nodes.map(l => ({
      slug: l.slug,
      name: l.name,
      repos: l.items.nodes.flatMap(n =>
        n?.nameWithOwner && !n.isArchived ? [n.nameWithOwner] : [],
      ),
    }))

    return { login, stars, lists }
  },
  {
    name: 'sources',
    maxAge: 60 * 30,
    swr: false,
    getKey: (_token, login) => login,
    shouldInvalidateCache: (_token, _login, refresh) => refresh,
  },
)

export default defineEventHandler(async event => {
  const { token, login } = await requireViewer(event)
  return loadSources(token, login, Boolean(getQuery(event).refresh))
})
