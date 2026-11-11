import type { H3Event } from 'h3'

// Same scheme as osdash: the GitHub token lives only in an AES-GCM sealed, httpOnly cookie.
export const SESSION_COOKIE = 'repool_session'
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60
const STATE_TTL_MS = 10 * 60 * 1000

export interface SessionUser {
  login: string
  token: string
  name?: string
  avatarUrl?: string
}

const enc = new TextEncoder()
const dec = new TextDecoder()

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function aesKey(secret: string) {
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(secret))
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

export function authConfig() {
  const { githubClientId, githubClientSecret, sessionSecret } = useRuntimeConfig()
  return { clientId: githubClientId, clientSecret: githubClientSecret, secret: sessionSecret }
}

export function requestOrigin(event: H3Event) {
  return getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).origin
}

export async function writeUserCookie(event: H3Event, secret: string, user: SessionUser) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await aesKey(secret),
    enc.encode(JSON.stringify(user)),
  )
  setCookie(event, SESSION_COOKIE, `${toBase64Url(iv)}.${toBase64Url(new Uint8Array(cipher))}`, {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export async function readUserCookie(event: H3Event, secret: string): Promise<SessionUser | null> {
  const [iv, cipher] = (getCookie(event, SESSION_COOKIE) ?? '').split('.')
  if (!iv || !cipher) return null
  try {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64Url(iv) },
      await aesKey(secret),
      fromBase64Url(cipher),
    )
    const user = JSON.parse(dec.decode(plain)) as SessionUser
    return user.login && user.token ? user : null
  } catch {
    return null
  }
}

export function clearUserCookie(event: H3Event) {
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}

/** Signed `{origin, exp, nonce}`; stands in for a state cookie so login needs no storage. */
export async function signState(secret: string, origin: string) {
  const nonce = toBase64Url(crypto.getRandomValues(new Uint8Array(16)))
  const body = toBase64Url(
    enc.encode(JSON.stringify({ origin, exp: Date.now() + STATE_TTL_MS, nonce })),
  )
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(body))
  return `${body}.${toBase64Url(new Uint8Array(sig))}`
}

export async function verifyState(secret: string, state: string, origin: string) {
  const [body, sig] = state.split('.')
  if (!body || !sig) return false
  try {
    const ok = await crypto.subtle.verify(
      'HMAC',
      await hmacKey(secret),
      fromBase64Url(sig),
      enc.encode(body),
    )
    if (!ok) return false
    const payload = JSON.parse(dec.decode(fromBase64Url(body))) as { origin?: string; exp?: number }
    return payload.origin === origin && typeof payload.exp === 'number' && payload.exp > Date.now()
  } catch {
    return false
  }
}
