export const apiBaseUrl = import.meta.env?.VITE_API_BASE_URL || ''

export function createApiClient(baseUrl, fetcher = fetch) {
  return async function request(path, { body, ...options } = {}) {
    let response
    try {
      response = await fetcher(`${baseUrl.replace(/\/$/, '')}${path}`, {
        ...options, credentials: 'include',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
      })
    } catch (cause) {
      if (cause.name === 'AbortError') throw cause
      throw new Error('Tidak dapat menghubungi backend. Pastikan server dan database sudah berjalan.', { cause })
    }
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      const error = new Error(payload?.msg || payload?.message || 'Permintaan ke backend belum berhasil.')
      error.status = response.status
      throw error
    }
    return payload
  }
}

export const request = createApiClient(apiBaseUrl)
