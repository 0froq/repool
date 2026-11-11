export interface RepoRef {
  name: string
  description: string | null
  stars: number
}

export interface StarList {
  slug: string
  name: string
  repos: string[]
}

export interface Sources {
  login: string
  stars: RepoRef[]
  lists: StarList[]
}

export interface Label {
  name: string
  color: string
}

export type ItemKind = 'issue' | 'pr'

export interface RadarItem {
  key: string
  repo: string
  kind: ItemKind
  number: number
  title: string
  url: string
  author: string | null
  createdAt: string
  updatedAt: string
  comments: number
  assignees: string[]
  draft: boolean
  labels: Label[]
}

export interface RepoTotals {
  issues: number
  prs: number
}

export const WINDOWS = [1, 7, 30] as const
export type WindowDays = (typeof WINDOWS)[number]

export interface RadarFeed {
  items: RadarItem[]
  /** Open counts on GitHub; items only hold what was updated inside the window. */
  totals: Record<string, RepoTotals>
  missing: string[]
  /** Repos that hit the per-kind cap before the window ended. */
  truncated: string[]
  days: WindowDays
  fetchedAt: string
}

export type Me =
  | { authenticated: false; configured: boolean }
  | {
      authenticated: true
      configured: boolean
      login: string
      name: string | null
      avatarUrl: string | null
      via: 'session' | 'local'
    }
