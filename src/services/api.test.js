import test from 'node:test'
import assert from 'node:assert/strict'
import { createApiClient } from './api.js'
import { createAuthService } from './auth.js'
import { normalizeUser } from './session.js'
import { createUnitsService } from './units.js'
import { createSatuansService } from './satuans.js'
import { createMasterAkunsService } from './masterAkuns.js'
import { createPagusService, paguAmount, formatPagu, selectPagus } from './pagus.js'
import { createPengajuansService, selectPengajuans, prepareSubmission, submissionTotal, canVerifySubmission, isReviewSubmission, isCorrectionSubmission, canRepairSubmission, revisionBudget, revisionItems } from './pengajuans.js'
import { createUnitDashboardService } from './unitDashboard.js'

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

test('form pagu memuat referensi dan mengirim tambah serta saldo nol dengan presisi', async () => {
  const calls = []
  const service = createPagusService(async (path, options) => {
    calls.push({ path, options })
    if (path === '/unit-kerjas') return [{ kode_unit_kerja: 7, unit_kerja: 'Mesin' }]
    if (path === '/master-pagus') return [{ jenis_pagu: 'PNBP' }]
    return { msg: 'Berhasil' }
  })
  const options = await service.options()
  assert.equal(options.units[0].kode_unit_kerja, 7)
  assert.equal(options.sources[0].jenis_pagu, 'PNBP')
  await service.save({ kode_unit_kerja: '7', jenis_pagu: ' PNBP ', nominal_pagu: '9007199254740993' })
  assert.deepEqual(calls[2], { path: '/pagus', options: { method: 'POST', body: { kode_unit_kerja: '7', jenis_pagu: 'PNBP', nominal_pagu: '9007199254740993' } } })
  await service.save({ nominal_pagu: '0' }, { id: 12, nominal_pagu: '100' })
  assert.deepEqual(calls[3], { path: '/pagus/12', options: { method: 'PATCH', body: { nominal_pagu: '0', expected_nominal_pagu: '100' } } })
})

test('form pagu menolak nominal tidak valid dan meneruskan konflik saldo atau izin', async () => {
  let sent = false
  const invalid = createPagusService(async () => { sent = true })
  for (const nominal_pagu of ['', '-1', '1.5', '1e6', '9223372036854775808']) await assert.rejects(invalid.save({ nominal_pagu }))
  assert.equal(sent, false)
  for (const status of [403, 409]) {
    const service = createPagusService(async () => { throw Object.assign(new Error('Ditolak'), { status }) })
    await assert.rejects(service.save({ nominal_pagu: '0' }, { id: 1, nominal_pagu: '100' }), error => error.status === status)
  }
  await assert.rejects(createPagusService(async () => ({})).options(), /Format referensi/)
})

test('daftar dan detail pengajuan memakai API cookie serta mempertahankan nominal BIGINT', async () => {
  const calls = []
  const record = { pengajuan_id: 12, nomor_pengajuan: 'USL/12', total_nominal_pengajuan: '9007199254740993' }
  const service = createPengajuansService(createApiClient('/api', async (url, options) => {
    calls.push({ url, options })
    return { ok: true, json: async () => url.endsWith('/pengajuans') ? [record] : { ...record, items: [] } }
  }))
  assert.equal((await service.list())[0].total_nominal_pengajuan, '9007199254740993')
  assert.equal((await service.detail(12)).pengajuan_id, 12)
  assert.deepEqual(calls.map(call => call.url), ['/api/pengajuans', '/api/pengajuans/12'])
  assert.ok(calls.every(call => call.options.credentials === 'include'))
})

test('pengajuan menangani respons invalid, sesi berakhir, dan detail di luar kewenangan', async () => {
  const invalid = createPengajuansService(async () => ({}))
  await assert.rejects(invalid.list(), /Format daftar/)
  await assert.rejects(invalid.detail(12), /Format detail/)
  for (const status of [401, 403, 404]) {
    const service = createPengajuansService(async () => { throw Object.assign(new Error('Ditolak'), { status }) })
    await assert.rejects(service.detail(99), error => error.status === status)
  }
})

test('pencarian pengajuan menggabungkan nomor, unit, pengaju, status dan tahap', () => {
  const records = [
    { nomor_pengajuan: 'USL/1', kode_unit_kerja: 7, unit_kerja: { unit_kerja: 'Mesin' }, operator: { nama_operator: 'Budi' }, status: 'pending', current_position: 'spi' },
    { nomor_pengajuan: 'USL/2', kode_unit_kerja: 8, status: 'draft', current_position: 'operator' },
  ]
  assert.deepEqual(selectPengajuans(records, { search: ' BUDI ', status: 'pending', stage: 'spi' }), [records[0]])
  assert.deepEqual(selectPengajuans(records, { search: 'mesin' }), [records[0]])
  assert.deepEqual(selectPengajuans(records, { search: 'USL/2' }), [records[1]])
  assert.equal(selectPengajuans(records, { status: 'approved' }).length, 0)
})

test('form pengajuan memuat pagu unit, hierarki dan satuan lalu mengirim POST cookie', async () => {
  const calls = []
  const service = createPengajuansService(createApiClient('/api', async (url, options) => {
    calls.push({ url, options })
    return { ok: true, json: async () => options.method ? { pengajuan_id: 12, total_nominal_diajukan: '80', sisa_pagu: '20' } : [] }
  }))
  await service.options()
  const payload = { nomor_pengajuan: 'USL/1', jenis_pagu: 'PNBP', items: [{ akun_id: '1', kode_satuan: 'PKT', volume: '2', nominal_satuan: '40' }] }
  await service.submit(payload)
  assert.deepEqual(calls.map(call => call.url), ['/api/pagus/unit-kerja', '/api/akuns', '/api/master-satuans', '/api/pengajuans'])
  assert.deepEqual(JSON.parse(calls[3].options.body), payload)
  assert.equal(calls[3].options.method, 'POST')
  assert.ok(calls.every(call => call.options.credentials === 'include'))
})

test('validasi pengajuan mengikuti saldo sumber dana dan menghitung total tanpa pembulatan', () => {
  const options = { pagus: [{ jenis_pagu: 'PNBP', nominal_pagu: '100' }, { jenis_pagu: 'RM', nominal_pagu: '50' }], accounts: [{ id: 1 }], satuans: [{ kode_satuan: 'PKT' }] }
  const values = { nomor_pengajuan: ' USL/1 ', jenis_pagu: 'PNBP', items: [{ akun_id: '1', kode_satuan: 'PKT', volume: '2', nominal_satuan: '50', key: 'ui-only' }] }
  const payload = prepareSubmission(values, options)
  assert.equal(payload.nomor_pengajuan, 'USL/1')
  assert.equal(payload.items[0].key, undefined)
  assert.equal(submissionTotal(values.items), 100n)
  assert.throws(() => prepareSubmission({ ...values, jenis_pagu: 'RM' }, options), /melebihi sisa pagu/)
  assert.throws(() => prepareSubmission({ ...values, jenis_pagu: 'BOPTN' }, options), /tidak tersedia/)
  assert.equal(submissionTotal([{ volume: '2', nominal_satuan: '9007199254740993' }]), 18014398509481986n)
  for (const volume of ['', '0', '-1', '1.5', '2147483648']) assert.equal(submissionTotal([{ volume, nominal_satuan: '50' }]), null)
  assert.throws(() => prepareSubmission({ ...values, items: [{ ...values.items[0], akun_id: '99' }] }, options), /hierarki terdaftar/)
  assert.throws(() => prepareSubmission({ ...values, items: [{ ...values.items[0], kode_satuan: 'missing' }] }, options), /Pilih satuan/)
})

test('dashboard unit mengambil data dari backend memakai cookie tanpa memilih unit klien', async () => {
  const calls = []
  const data = { unit: { kode_unit_kerja: 7 }, statuses: {}, sources: [], latest: [], saldo_pagu: '9007199254740993' }
  const load = createUnitDashboardService(createApiClient('/api', async (url, options) => {
    calls.push({ url, options })
    return { ok: true, json: async () => data }
  }))
  assert.equal((await load()).saldo_pagu, '9007199254740993')
  assert.equal(calls[0].url, '/api/dashboard/unit')
  assert.equal(calls[0].options.credentials, 'include')
  assert.equal(calls[0].options.body, undefined)
})

test('dashboard unit menampilkan respons invalid dan penolakan server tanpa data demo', async () => {
  await assert.rejects(createUnitDashboardService(async () => ({}))(), /Format dashboard/)
  for (const status of [401, 403, 404, 500]) {
    const load = createUnitDashboardService(async () => { throw Object.assign(new Error('Gagal memuat'), { status }) })
    await assert.rejects(load(), error => error.status === status)
  }
})

test('keputusan verifikasi memakai PATCH cookie dan snapshot tahap/status/waktu', async () => {
  const calls = []
  const service = createPengajuansService(createApiClient('/api', async (url, options) => {
    calls.push({ url, options })
    return { ok: true, json: async () => ({ status: 'revision', current_position: 'operator', msg: 'Dikembalikan' }) }
  }))
  const record = { pengajuan_id: 12, current_position: 'pimpinan_unit', status: 'pending', updatedAt: '2026-10-29T01:00:00.000Z' }
  await service.verify(record, 'revise', ' Perbaiki harga ')
  assert.equal(calls[0].url, '/api/pengajuans/12/verify')
  assert.equal(calls[0].options.method, 'PATCH')
  assert.equal(calls[0].options.credentials, 'include')
  assert.deepEqual(JSON.parse(calls[0].options.body), { action: 'revise', catatan_revisi: 'Perbaiki harga', expected_position: 'pimpinan_unit', expected_status: 'pending', expected_updated_at: record.updatedAt })
})

test('antrean dan tombol keputusan mengikuti tahap serta status aktif setiap pemeriksa', () => {
  for (const [role, stage] of [['PIMPINAN', 'pimpinan_unit'], ['SAKIP', 'tim_sakip'], ['SPI', 'spi'], ['KPA', 'kpa']]) {
    for (const status of ['pending', 'revision']) {
      const record = { status, current_position: stage }
      assert.equal(canVerifySubmission(record, role), true)
      assert.equal(isReviewSubmission(record), true)
      assert.equal(canVerifySubmission(record, 'OPERATOR'), false)
      assert.equal(canVerifySubmission(record, 'ADMIN'), false)
    }
    assert.equal(canVerifySubmission({ status: 'approved', current_position: stage }, role), false)
    assert.equal(canVerifySubmission({ status: 'pending', current_position: 'operator' }, role), false)
  }
  assert.equal(isReviewSubmission({ status: 'revision', current_position: 'operator' }), false)
  assert.equal(isReviewSubmission({ status: 'approved', current_position: 'completed' }), false)
})

test('catatan kosong tidak dikirim dan konflik keputusan server tetap ditampilkan', async () => {
  let calls = 0
  const service = createPengajuansService(async () => { calls++; throw Object.assign(new Error('Pengajuan telah berubah'), { status: 409 }) })
  await assert.rejects(service.verify({ pengajuan_id: 1 }, 'revise', ' '), /alasan/)
  assert.equal(calls, 0)
  await assert.rejects(service.verify({ pengajuan_id: 1 }, 'approve'), error => error.status === 409)
})

test('antrean koreksi mengikuti status revision, posisi berkas dan catatan asli backend', () => {
  const records = [
    { pengajuan_id: 1, nomor_pengajuan: 'USL/1', status: 'revision', current_position: 'operator', catatan_revisi: 'Perbaiki harga', unit_kerja: { unit_kerja: 'Mesin' } },
    { pengajuan_id: 2, nomor_pengajuan: 'USL/2', status: 'revision', current_position: 'pimpinan_unit', catatan_revisi: 'Lengkapi dasar usulan' },
    { pengajuan_id: 3, nomor_pengajuan: 'USL/3', status: 'pending', current_position: 'spi', catatan_revisi: 'Catatan lama' },
    { pengajuan_id: 4, nomor_pengajuan: 'USL/4', status: 'approved', current_position: 'completed', catatan_revisi: 'Catatan lama' },
  ]
  const corrections = records.filter(isCorrectionSubmission)
  assert.deepEqual(corrections.map(record => record.pengajuan_id), [1, 2])
  assert.deepEqual(selectPengajuans(corrections, { search: 'mesin', stage: 'operator' }), [records[0]])
  assert.equal(corrections[0].catatan_revisi, 'Perbaiki harga')
  assert.equal(canVerifySubmission(records[0], 'OPERATOR'), false)
  assert.equal(canVerifySubmission(records[1], 'PIMPINAN'), true)
  assert.equal(isCorrectionSubmission({ ...records[1], status: 'pending' }), false)
})

test('perbaikan memuat rincian lama dan memakai batas saldo ditambah nominal lama', () => {
  const account = { id: 1, kode_akun: '521211', kode_sk: 'A', kode_so: '001', kode_output: 'BEI', kode_kegiatan: '7731', kode_program: 'DK' }
  const record = { pengajuan_id: 12, status: 'revision', current_position: 'operator', nomor_pengajuan: 'USL/1', pagu_id: 11, jenis_pagu: 'PNBP', total_nominal_pengajuan: '80', updatedAt: '2026-10-29T01:00:00Z', items: [{ ...account, kode_satuan: 'PKT', volume: 1, nominal_satuan: '80' }] }
  const options = { accounts: [account], satuans: [{ kode_satuan: 'PKT' }], pagus: [{ id: 11, jenis_pagu: 'PNBP', nominal_pagu: '20' }] }
  assert.equal(canRepairSubmission(record, 'OPERATOR'), true)
  assert.equal(canRepairSubmission(record, 'PIMPINAN'), false)
  assert.equal(canRepairSubmission({ ...record, current_position: 'pimpinan_unit' }, 'OPERATOR'), false)
  assert.equal(revisionBudget(record, options).available, 100n)
  const restored = revisionItems(record, options.accounts)
  assert.equal(restored[0].akun_id, '1')
  assert.equal(restored[0].nominal_satuan, '80')
  const values = { nomor_pengajuan: 'USL/1', jenis_pagu: 'PNBP', items: [{ ...restored[0], nominal_satuan: '90' }] }
  const payload = prepareSubmission(values, options, record)
  assert.equal(payload.expected_total, '80')
  assert.equal(payload.expected_updated_at, record.updatedAt)
  assert.equal(payload.nomor_pengajuan, undefined)
  assert.throws(() => prepareSubmission({ ...values, items: [{ ...restored[0], nominal_satuan: '101' }] }, options, record), /melebihi sisa pagu/)
  assert.equal(revisionItems(record, [account, { ...account, id: 2 }])[0].akun_id, '')
})

test('pengajuan lama tanpa sumber boleh diperbaiki dengan total tetap', () => {
  const record = { status: 'revision', current_position: 'operator', nomor_pengajuan: 'USL/1', total_nominal_pengajuan: '80', updatedAt: '2026-10-29T01:00:00Z' }
  const options = { accounts: [{ id: 1 }], satuans: [{ kode_satuan: 'PKT' }], pagus: [] }
  const values = { nomor_pengajuan: 'USL/1', jenis_pagu: '', items: [{ akun_id: '1', kode_satuan: 'PKT', volume: '2', nominal_satuan: '40' }] }
  assert.equal(revisionBudget(record, options).legacy, true)
  assert.equal(prepareSubmission(values, options, record).items[0].volume, '2')
  assert.throws(() => prepareSubmission({ ...values, items: [{ ...values.items[0], nominal_satuan: '39' }] }, options, record), /Total revisi harus tetap/)
})

test('kirim ulang memakai PATCH pengajuan yang sama dan cookie sesi', async () => {
  let call
  const service = createPengajuansService(createApiClient('/api', async (url, options) => {
    call = { url, options }
    return { ok: true, json: async () => ({ pengajuan_id: 12, status: 'pending' }) }
  }))
  await service.resubmit(12, { items: [], expected_total: '80' })
  assert.equal(call.url, '/api/pengajuans/12/resubmit')
  assert.equal(call.options.method, 'PATCH')
  assert.equal(call.options.credentials, 'include')
})

test('pindah sumber pada revisi memakai saldo tujuan tanpa menambahkan nominal lama', () => {
  const record = { status: 'revision', current_position: 'operator', nomor_pengajuan: 'USL/1', pagu_id: 11, jenis_pagu: 'PNBP', total_nominal_pengajuan: '80', updatedAt: '2026-10-29T01:00:00Z' }
  const options = { accounts: [{ id: 1 }], satuans: [{ kode_satuan: 'PKT' }], pagus: [{ id: 11, jenis_pagu: 'PNBP', nominal_pagu: '20' }, { id: 22, jenis_pagu: 'RM', nominal_pagu: '90' }] }
  const budget = revisionBudget(record, options, 'RM')
  assert.equal(budget.available, 90n)
  assert.equal(budget.originalSource, 'PNBP')
  assert.equal(budget.moved, true)
  const values = { nomor_pengajuan: 'USL/1', jenis_pagu: 'RM', items: [{ akun_id: '1', kode_satuan: 'PKT', volume: '1', nominal_satuan: '90' }] }
  assert.equal(prepareSubmission(values, options, record).jenis_pagu, 'RM')
  assert.throws(() => prepareSubmission({ ...values, items: [{ ...values.items[0], nominal_satuan: '91' }] }, options, record), /melebihi sisa pagu/)
  assert.throws(() => prepareSubmission(values, options, { ...record, pagu_id: null, jenis_pagu: null }), /Sumber dana asal/)
})
