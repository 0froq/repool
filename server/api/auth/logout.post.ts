export default defineEventHandler(event => {
  clearUserCookie(event)
  return { ok: true }
})
