const roles = {
  operator: 'OPERATOR', pimpinan_unit: 'PIMPINAN', tim_sakip: 'SAKIP',
  spi: 'SPI', kpa: 'KPA', superadmin: 'ADMIN',
}

export function normalizeUser(account) {
  const role = roles[account?.role]
  if (!role || !account?.id) throw new Error('Data akun atau peran dari server tidak dikenali. Hubungi administrator.')
  return {
    id: account.id, name: account.nama_operator, email: account.email,
    role, unitId: account.kode_unit_kerja,
    unitName: account.unit_kerja?.unit_kerja || null, isDemo: false,
  }
}

export function accountProfile(user, fallback) {
  if (user.isDemo) return fallback
  const name = user.name || user.email
  return {
    name, shortName: name,
    initials: name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase(),
    title: null,
  }
}
