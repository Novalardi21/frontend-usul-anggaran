export const ROLES = [
  { value: 'OPERATOR', label: 'Operator Unit Kerja (Jurusan / Bagian / UPT)' },
  { value: 'PIMPINAN', label: 'Pimpinan Unit / Ketua Jurusan (Kajur)' },
  { value: 'SAKIP', label: 'Tim Verifikator SAKIP & Perencanaan' },
  { value: 'SPI', label: 'Auditor SPI (Satuan Pengawas Internal)' },
  { value: 'KPA', label: 'KPA / Direktur POLINDRA' },
  { value: 'ADMIN', label: 'Administrator Sistem' },
]

export const AUTH_INFO = {
  password: { title: 'Bantuan akses akun', description: 'Untuk reset kata sandi, hubungi administrator atau Unit Pelaksana Teknis TIK POLINDRA. Siapkan NIP atau email institusi Anda untuk verifikasi identitas. Akun pengguna dikelola oleh Admin.' },
  sso: { title: 'Login dengan akun kampus', description: 'Layanan SSO POLINDRA belum terhubung pada halaman ini. Gunakan formulir login atau hubungi administrator untuk informasi akses akun kampus.' },
  guide: { title: 'Panduan Standar Biaya Masukan', description: 'Gunakan dokumen SBM PMK untuk tahun anggaran yang sesuai dan telah ditetapkan oleh bagian perencanaan. Dokumen panduan belum tersedia di portal ini. Hubungi bagian perencanaan POLINDRA untuk memperoleh dokumen resmi.' },
  privacy: { title: 'Informasi privasi', description: 'Halaman ini tidak menyimpan kata sandi di penyimpanan browser. Jika layanan login terhubung, data formulir dikirim ke layanan autentikasi untuk verifikasi. Kebijakan privasi resmi dan ketentuan sesi ditetapkan oleh pengelola POLINDRA.' },
}
