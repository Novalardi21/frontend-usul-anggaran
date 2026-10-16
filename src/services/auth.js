import { apiBaseUrl, request } from './api.js'
import { normalizeUser } from './session.js'

export function createAuthService(send, live) {
  return {
    async login(credentials) {
      if (!live) return { isDemo: true, role: credentials.role }
      const result = await send('/login', {
        method: 'POST',
        body: { email: credentials.identifier, password: credentials.password },
      })
      return normalizeUser(result?.data)
    },

    async getSession(signal) {
      try {
        return normalizeUser(await send('/me', { signal }))
      } catch (error) {
        if (error.status === 401 || error.status === 404) return null
        throw error
      }
    },

    async logout() {
      try {
        await send('/logout', { method: 'DELETE' })
      } catch (error) {
        if (error.status !== 401 && error.status !== 404) throw error
      }
    },
  }
}

export const { login, getSession, logout } = createAuthService(request, Boolean(apiBaseUrl))
