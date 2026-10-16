import test from 'node:test'
import assert from 'node:assert/strict'
import { createApiClient } from './api.js'
import { createAuthService } from './auth.js'
import { normalizeUser } from './session.js'
import { createUnitsService } from './units.js'
import { createSatuansService } from './satuans.js'
import { createMasterAkunsService } from './masterAkuns.js'
import { createPagusService, paguAmount, formatPagu, selectPagus } from './pagus.js'

test('login mengirim email/password dan memakai peran server, tanpa menyimpan JWT', async () => {
  const calls = []
  const send = createApiClient('/api/', async (url, options) => {
    calls.push({ url, options })
    return { ok: true, json: async () => ({ accessToken: 'private-token', data: { id: 1, nama_operator: 'Admin Kampus', email: 'admin@example.test', role: 'superadmin' } }) }
  })
  const auth = createAuthService(send, true)
  const user = await auth.login({ identifier: 'admin@example.test', password: 'secret', role: 'OPERATOR' })
  assert.equal(calls[0].url, '/api/login')
  assert.equal(calls[0].options.credentials, 'include')
  assert.deepEqual(JSON.parse(calls[0].options.body), { email: 'admin@example.test', password: 'secret' })
  assert.equal(user.role, 'ADMIN')
  assert.equal(user.name, 'Admin Kampus')
  assert.equal(user.isDemo, false)
  assert.equal(user.accessToken, undefined)
})

test('pemulihan sesi dan logout mengikuti kontrak cookie backend', async () => {
  const calls = []
  const auth = createAuthService(async (path, options) => {
    calls.push({ path, options })
    if (path === '/me') return { id: 2, email: 'unit@example.test', nama_operator: 'Operator', role: 'operator', kode_unit_kerja: 4, unit_kerja: { unit_kerja: 'Jurusan Mesin' } }
    return { msg: 'Berhasil keluar' }
  }, true)
  const user = await auth.getSession()
  assert.equal(user.role, 'OPERATOR')
  assert.equal(user.unitId, 4)
  assert.equal(user.unitName, 'Jurusan Mesin')
  await auth.logout()
  assert.equal(calls[1].path, '/logout')
  assert.equal(calls[1].options.method, 'DELETE')
})

test('sesi kedaluwarsa dianggap keluar, gangguan server tetap ditampilkan', async () => {
  for (const status of [401, 404, 500]) {
    const auth = createAuthService(async () => { throw Object.assign(new Error('Gagal'), { status }) }, true)
    if (status === 500) {
      await assert.rejects(auth.getSession(), /Gagal/)
      await assert.rejects(auth.logout(), /Gagal/)
    } else {
      assert.equal(await auth.getSession(), null)
      await auth.logout()
    }
  }
})

test('role tidak dikenal ditolak dan mode demo tidak mengirim kredensial', async () => {
  assert.throws(() => normalizeUser({ id: 3, role: 'unknown' }), /tidak dikenali/)
  const auth = createAuthService(() => { throw new Error('Tidak boleh mengirim') }, false)
  assert.deepEqual(await auth.login({ role: 'SPI' }), { role: 'SPI', isDemo: true })
})

test('API menampilkan pesan backend dan menangani respons bukan JSON', async () => {
  const invalid = createApiClient('/api', async () => ({ ok: false, status: 400, json: async () => ({ msg: 'Kata sandi salah!' }) }))
  await assert.rejects(invalid('/login'), error => error.status === 400 && error.message === 'Kata sandi salah!')
  const unavailable = createApiClient('/api', async () => ({ ok: false, status: 502, json: async () => { throw new Error('HTML') } }))
  await assert.rejects(unavailable('/unit-kerjas'), /belum berhasil/)
  const offline = createApiClient('/api', async () => { throw new TypeError('Offline') })
  await assert.rejects(offline('/me'), /Tidak dapat menghubungi backend/)
})

test('tambah dan ubah unit mengirim kontrak backend, lalu daftar memuat hasil terbaru', async () => {
  const records = []
  const calls = []
  const service = createUnitsService(createApiClient('/api', async (url, options) => {
    calls.push({ url, options })
    const body = options.body ? JSON.parse(options.body) : null
    if (options.method === 'POST') records.push({ kode_unit_kerja: 7, ...body })
    if (options.method === 'PATCH') records[0] = { ...records[0], ...body }
    return { ok: true, json: async () => options.method ? { msg: 'Berhasil' } : records.map(unit => ({ ...unit })) }
  }))
  await service.save('  Jurusan Mesin  ')
  assert.equal(calls[0].options.method, 'POST')
  assert.equal(calls[0].url, '/api/unit-kerjas')
  assert.equal(calls[0].options.credentials, 'include')
  assert.deepEqual(JSON.parse(calls[0].options.body), { unit_kerja: 'Jurusan Mesin' })
  assert.deepEqual(await service.list(), [{ kode_unit_kerja: 7, unit_kerja: 'Jurusan Mesin' }])
  await service.save('Jurusan Teknik Mesin', 7)
  assert.equal(calls[2].options.method, 'PATCH')
  assert.equal(calls[2].url, '/api/unit-kerjas/7')
  assert.deepEqual(JSON.parse(calls[2].options.body), { unit_kerja: 'Jurusan Teknik Mesin' })
  assert.deepEqual(await service.list(), [{ kode_unit_kerja: 7, unit_kerja: 'Jurusan Teknik Mesin' }])
})

test('validasi nama unit dan penolakan izin server diteruskan ke formulir', async () => {
  let sent = false
  const service = createUnitsService(async () => { sent = true; throw Object.assign(new Error('Khusus Superadmin.'), { status: 403 }) })
  await assert.rejects(service.save('   '), /wajib diisi/)
  await assert.rejects(service.save('a'.repeat(256)), /maksimal 255/)
  assert.equal(sent, false)
  await assert.rejects(service.save('Jurusan Mesin'), error => error.status === 403 && error.message === 'Khusus Superadmin.')
})

test('hapus unit mengirim DELETE dan meneruskan penolakan unit terpakai', async () => {
  const calls = []
  const service = createUnitsService(createApiClient('/api', async (url, options) => {
    calls.push({ url, options })
    return { ok: false, status: 409, json: async () => ({ msg: 'Unit kerja masih digunakan oleh operator/pengguna.' }) }
  }))
  await assert.rejects(service.remove(7), error => error.status === 409 && error.message.includes('operator/pengguna'))
  assert.equal(calls[0].url, '/api/unit-kerjas/7')
  assert.equal(calls[0].options.method, 'DELETE')
  assert.equal(calls[0].options.credentials, 'include')
  await assert.rejects(service.remove(undefined), /tidak valid/)
  assert.equal(calls.length, 1)
})

test('master satuan membaca daftar serta menambah dan mengubah sesuai kontrak backend', async () => {
  const calls = []
  const service = createSatuansService(async (path, options) => {
    calls.push({ path, options })
    return path === '/master-satuans' && !options.method ? [{ kode_satuan: 'PKT', nama_satuan: 'Paket' }] : { msg: 'Berhasil' }
  })
  assert.deepEqual(await service.list(), [{ kode_satuan: 'PKT', nama_satuan: 'Paket' }])
  await service.save({ kode_satuan: ' PKT ', nama_satuan: ' Paket ' })
  assert.deepEqual(calls[1], { path: '/master-satuans', options: { method: 'POST', body: { kode_satuan: 'PKT', nama_satuan: 'Paket' } } })
  await service.save({ kode_satuan: 'PKT/1', nama_satuan: 'Paket Pekerjaan' }, 'PKT/1')
  assert.deepEqual(calls[2], { path: '/master-satuans/PKT%2F1', options: { method: 'PATCH', body: { nama_satuan: 'Paket Pekerjaan' } } })
})

test('master satuan menolak data kosong, menangani respons invalid dan kode duplikat', async () => {
  let calls = 0
  const service = createSatuansService(async () => { calls++; throw Object.assign(new Error('Kode satuan sudah digunakan.'), { status: 409 }) })
  await assert.rejects(service.save({ kode_satuan: ' ', nama_satuan: 'Paket' }), /wajib diisi/)
  await assert.rejects(service.save({ kode_satuan: 'PKT', nama_satuan: 'a'.repeat(256) }), /maksimal 255/)
  assert.equal(calls, 0)
  await assert.rejects(service.save({ kode_satuan: 'PKT', nama_satuan: 'Paket' }), error => error.status === 409)
  await assert.rejects(createSatuansService(async () => ({})).list(), /Format daftar satuan/)
})

test('hapus satuan memakai cookie dan kode terenkode, penolakan 409 diteruskan', async () => {
  const calls = []
  const service = createSatuansService(createApiClient('/api', async (url, options) => {
    calls.push({ url, options })
    return { ok: calls.length === 1, status: calls.length === 1 ? 200 : 409, json: async () => ({ msg: calls.length === 1 ? 'Satuan berhasil dihapus' : 'Satuan masih digunakan rincian anggaran.' }) }
  }))
  await service.remove('PKT/1')
  assert.equal(calls[0].url, '/api/master-satuans/PKT%2F1')
  assert.equal(calls[0].options.method, 'DELETE')
  assert.equal(calls[0].options.credentials, 'include')
  await assert.rejects(service.remove('PKT'), error => error.status === 409 && error.message.includes('rincian anggaran'))
  await assert.rejects(service.remove(' '), /tidak valid/)
  assert.equal(calls.length, 2)
})

test('master akun memakai endpoint backend untuk daftar, tambah, ubah dan hapus', async () => {
  const calls = []
  const service = createMasterAkunsService(createApiClient('/api', async (url, options) => {
    calls.push({ url, options })
    return { ok: true, json: async () => options.method ? { msg: 'Berhasil' } : [{ kode_akun: '521211', nama_akun: 'Belanja Bahan' }] }
  }))
  assert.equal((await service.list())[0].kode_akun, '521211')
  await service.save({ kode_akun: ' 521211 ', nama_akun: ' Belanja Bahan ' })
  await service.save({ kode_akun: '521211', nama_akun: 'Belanja Baru' }, '521211')
  await service.remove('521211')
  assert.deepEqual(calls.map(call => call.url), ['/api/master-akuns', '/api/master-akuns', '/api/master-akuns/521211', '/api/master-akuns/521211'])
  assert.deepEqual(calls.map(call => call.options.method), [undefined, 'POST', 'PATCH', 'DELETE'])
  assert.deepEqual(JSON.parse(calls[1].options.body), { kode_akun: '521211', nama_akun: 'Belanja Bahan' })
  assert.deepEqual(JSON.parse(calls[2].options.body), { nama_akun: 'Belanja Baru' })
  assert.ok(calls.every(call => call.options.credentials === 'include'))
})

test('master akun menolak input invalid dan meneruskan konflik serta penolakan izin', async () => {
  let calls = 0
  const invalid = createMasterAkunsService(async () => { calls++; return {} })
  for (const code of ['', '12345', 'ABCDEF']) await assert.rejects(invalid.save({ kode_akun: code, nama_akun: 'Belanja' }))
  await assert.rejects(invalid.save({ kode_akun: '521211', nama_akun: ' ' }), /wajib diisi/)
  assert.equal(calls, 0)
  await assert.rejects(invalid.list(), /Format daftar/)
  for (const status of [403, 409]) {
    const service = createMasterAkunsService(async () => { throw Object.assign(new Error('Ditolak'), { status }) })
    await assert.rejects(service.save({ kode_akun: '521211', nama_akun: 'Belanja' }), error => error.status === status)
    await assert.rejects(service.remove('521211'), error => error.status === status)
  }
})

test('daftar pagu memilih endpoint sesuai cakupan akun dan menolak respons invalid', async () => {
  const paths = []
  const service = createPagusService(async path => { paths.push(path); return [] })
  for (const role of ['OPERATOR', 'PIMPINAN', 'ADMIN', 'SAKIP', 'SPI', 'KPA']) await service.list(role)
  assert.deepEqual(paths, ['/pagus/unit-kerja', '/pagus/unit-kerja', '/pagus', '/pagus', '/pagus', '/pagus'])
  await assert.rejects(createPagusService(async () => ({})).list('ADMIN'), /Format daftar pagu/)
  await assert.rejects(createPagusService(async () => { throw Object.assign(new Error('Sesi berakhir'), { status: 401 }) }).list('ADMIN'), error => error.status === 401)
})

test('filter pagu menggabungkan pencarian, unit, sumber dana dan mempertahankan nominal besar', () => {
  const records = [
    { id: 1, kode_unit_kerja: 7, unit_kerja: { unit_kerja: 'Jurusan Mesin' }, jenis_pagu: 'PNBP', nominal_pagu: '9007199254740993' },
    { id: 2, kode_unit_kerja: 7, unit_kerja: { unit_kerja: 'Jurusan Mesin' }, jenis_pagu: 'BOPTN', nominal_pagu: '1000' },
    { id: 3, kode_unit_kerja: 8, unit_kerja: null, jenis_pagu: 'PNBP', nominal_pagu: '2000' },
  ]
  assert.deepEqual(selectPagus(records, { search: 'mesin', unit: '7', source: 'PNBP' }), [records[0]])
  assert.equal(selectPagus(records, { source: 'PNBP' }).length, 2)
  assert.equal(selectPagus(records, { search: 'tidak ada' }).length, 0)
  assert.equal(records.reduce((sum, record) => sum + paguAmount(record.nominal_pagu), 0n), 9007199254743993n)
  assert.match(formatPagu('9007199254740993'), /9\.007\.199\.254\.740\.993/)
  assert.throws(() => paguAmount('bukan angka'), /tidak valid/)
})
