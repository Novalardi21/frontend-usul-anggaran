/** Confirm this payload and cookie session policy with the backend before enabling. */
export async function login(credentials) {
  const apiUrl = import.meta.env.VITE_API_BASE_URL
  if (!apiUrl) {
    await new Promise(resolve => setTimeout(resolve, 350))
    return { isDemo: true }
  }
  let response
  try {
    response = await fetch(`${apiUrl.replace(/\/$/, '')}/login`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials), signal: AbortSignal.timeout(15000),
    })
  } catch {
    throw new Error('Tidak dapat menghubungi layanan login. Periksa koneksi Anda dan coba lagi.')
  }
  if (response.status === 401 || response.status === 422) throw new Error('NIP / email atau kata sandi tidak sesuai. Periksa kembali data Anda.')
  if (response.status === 403) throw new Error('Akun Anda tidak memiliki akses untuk peran yang dipilih. Hubungi administrator.')
  if (response.status === 429) throw new Error('Terlalu banyak percobaan masuk. Tunggu beberapa saat sebelum mencoba lagi.')
  if (!response.ok) throw new Error('Login belum berhasil. Silakan coba kembali beberapa saat lagi.')
  return { isDemo: false }
}
