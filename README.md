# SIPADU Anggaran POLINDRA

Halaman login dan dashboard React + Vite berdasarkan referensi pengguna dan design.md.

## Menjalankan

```sh
npm install
npm run dev
npm run lint
npm run build
```

## Struktur folder

```text
src/
├── components/
│   ├── feedback/InfoDialog.jsx   # Dialog native, keyboard dan fokus
│   ├── forms/FormField.jsx      # Label, ikon, dan error field
│   └── ui/Icon.jsx              # Ikon outline bersama
├── features/auth/
│   ├── constants.js             # Peran dan teks informasi
│   └── LoginForm.jsx            # Validasi dan state formulir
├── layouts/AuthLayout.jsx       # Header dan footer
├── pages/login/
│   ├── LoginPage.jsx            # Komposisi halaman
│   └── login.css                # Layout responsif
├── services/auth.js             # Adapter API autentikasi
├── styles/
│   ├── global.css               # Reset dan aksesibilitas
│   └── tokens.css               # Token design.md
├── App.jsx
├── index.css
└── main.jsx
```

## Status integrasi

Login, pemulihan sesi melalui GET /me, logout melalui DELETE /logout, daftar unit kerja melalui GET /unit-kerjas, dan master satuan melalui GET /master-satuans sudah terhubung ke API backend. Identitas dan peran diambil dari akun server; JWT yang dikembalikan backend tidak disimpan oleh frontend. Autentikasi menggunakan cookie sesi HttpOnly.

### Menjalankan integrasi lokal

1. Jalankan MySQL dan backend sesuai konfigurasi `.env` backend, lalu `npm install` dan `npm start` dari folder `Backend_Usul_Anggaran`. Backend harus mendengarkan port 5000.
2. Dari folder frontend, salin `.env.example` menjadi `.env.local`. Gunakan `VITE_API_BASE_URL=/api`.
3. Jalankan `npm install` dan `npm run dev`. Restart Vite jika konfigurasi env berubah.
4. Login dengan email dan kata sandi akun yang sudah ada di database. Belum tersedia pendaftaran atau seed akun awal. Peran UI mengikuti peran backend: operator → OPERATOR, pimpinan_unit → PIMPINAN, tim_sakip → SAKIP, spi → SPI, kpa → KPA, superadmin → ADMIN.
5. Buka menu **Daftar Unit Kerja** untuk melihat data database. Admin (superadmin pada backend) dapat menambah unit dan mengubah namanya melalui POST /unit-kerjas dan PATCH /unit-kerjas/:id. Kode unit dibuat otomatis dan tidak diubah. Daftar dimuat ulang setelah penyimpanan berhasil. Role lain hanya melihat daftar; backend tetap memverifikasi izin setiap perubahan. Form menampilkan kesalahan penyimpanan dan mencegah pengiriman ganda. Daftar mendukung pencarian, muat ulang, dan tampilan kosong/gagal.
6. Refresh halaman untuk memeriksa pemulihan sesi; gunakan Keluar untuk mengakhiri sesi backend. Cookie backend berlaku hingga 24 jam.

Vite meneruskan `/api/*` ke `http://127.0.0.1:5000/*`, sehingga browser menggunakan origin frontend yang sama. Proxy ini hanya untuk development. Hosting produksi perlu reverse proxy `/api` atau URL API dan konfigurasi cookie/CORS yang sesuai.

Admin juga dapat menghapus unit melalui tombol **Hapus**, dengan mengetik nama unit persis sebagai konfirmasi. DELETE /unit-kerjas/:id hanya menghapus unit yang belum dipakai; backend mengunci baris unit dan memeriksa operator, pengajuan, serta pagu dalam satu transaksi. Unit yang masih dipakai menghasilkan HTTP 409 dengan alasan, tanpa menghapus data terkait. Restart backend setelah memperbarui kode penghapusan. Tes backend: `npm test` dari folder `Backend_Usul_Anggaran`.

Menu **Master Satuan** (`#/master-satuan`) mengambil data dari GET /master-satuans, mendukung pencarian dan muat ulang. Admin dapat menambah kode/nama melalui POST /master-satuans dan mengubah nama melalui PATCH /master-satuans/:code. Kode satuan tetap saat diubah. Backend memverifikasi Superadmin untuk perubahan, menolak kode duplikat dengan HTTP 409, data tidak valid dengan 400, dan satuan tidak ditemukan dengan 404. Setelah berhasil menyimpan, daftar dimuat ulang; kesalahan tetap tampil di formulir. Role lain hanya melihat daftar. Restart backend agar endpoint PATCH aktif. Referensi satuan pada formulir usulan demo belum menggunakan daftar ini.

Tombol **Hapus** pada Master Satuan hanya tersedia untuk Admin. Dialog memperingatkan bahwa penghapusan permanen dan meminta nama satuan sebagai konfirmasi. DELETE /master-satuans/:code memverifikasi Superadmin serta memeriksa referensi rincian anggaran dalam transaksi dengan kunci baris. Satuan yang masih dipakai ditolak dengan HTTP 409; satuan kosong dapat dihapus. Restart backend agar endpoint DELETE aktif.

Menu **Master Akun Anggaran** (`#/master-akun-anggaran`) membaca tabel `master_akun` melalui GET /master-akuns. Semua role dapat melihat dan mencari. Admin menambah kode 6 digit dan nama lewat POST /master-akuns, mengubah nama lewat PATCH /master-akuns/:id, serta menghapus lewat DELETE /master-akuns/:id. Kode tidak dapat diubah; kode duplikat ditolak dengan HTTP 409. Hapus memerlukan peringatan dan konfirmasi nama akun. Backend memeriksa referensi pada hierarki akun dan rincian anggaran dalam transaksi; akun yang masih dipakai ditolak dengan HTTP 409. Restart backend untuk mengaktifkan endpoint tambah dan perlindungan hapus. Katalog ini terpisah dari Master Hierarki Anggaran dan formulir usulan yang masih berupa simulasi.
Menu **Daftar Pagu** (`#/pagu-iku`, menggantikan tampilan Pagu & IKU pada sesi backend) membaca saldo dari tabel `pagu`. Operator dan Pimpinan menggunakan GET /pagus/unit-kerja; role lintas unit menggunakan GET /pagus. GET /pagus dan GET /pagus/:id kini memerlukan login; backend membatasi Operator/Pimpinan ke unit akun, termasuk ketika meminta detail langsung. Akun unit tanpa unit kerja ditolak dengan 403. Daftar mendukung pencarian, filter unit/sumber dana, total saldo hasil filter, dan muat ulang. Nominal BIGINT dijumlahkan dengan BigInt agar presisi rupiah tetap terjaga. Tahap ini hanya membaca pagu; tambah, ubah, dan hapus pagu belum dihubungkan. Saldo tersimpan sudah dikurangi oleh pengajuan dan tidak dianggap sebagai alokasi awal. Database pagu belum memiliki tahun, sehingga pemilih tahun tidak memfilter halaman ini. Dashboard dan IKU tetap memakai simulasi. Restart backend agar pembatasan akses baca aktif.
Jika backend tidak aktif, frontend menampilkan kesalahan koneksi dan tombol coba lagi. Untuk mencoba demo tanpa backend, kosongkan `VITE_API_BASE_URL` dan restart Vite. Dalam demo, gunakan email valid atau NIP 18 digit dan kata sandi apa saja; peran dan penanda demo disimpan di sessionStorage. Kredensial tidak disimpan.

Usulan, perhitungan pagu dashboard, master selain unit kerja, satuan, dan katalog akun anggaran, pemeriksaan, pengguna, audit, dan laporan L01–L11 masih memakai simulasi lokal TA 2027. Perubahan modul simulasi direset setelah refresh/logout. Data unit backend ditampilkan terpisah dari referensi unit demo agar tidak mengubah perhitungan atau cakupan simulasi. SSO, reset sandi, dan integrasi SAKTI belum terhubung.

Jalankan `npm run lint`, `npm test`, dan `npm run build` untuk validasi. Tes API menggunakan respons mock; pengujian nyata memerlukan backend, database, dan akun terdaftar.

## Modul dashboard

Menu **Antrean Pemeriksaan** membuka `#/antrean-pemeriksaan` dengan daftar usulan dalam proses, pencarian, filter tahap, dan pilihan tugas sesuai peran. Detail usulan menggunakan sidebar dan navbar yang sama. Detail mencakup pagu sumber dana, rincian item, pemeriksaan IKU, jadwal penarikan per item selama 12 bulan, snapshot siklus, alur validasi, catatan pemeriksa, riwayat audit, dan lembar kontrol untuk dicetak.

Simulasi keputusan mengikuti Operator → Pimpinan → SAKIP → SPI → KPA. Hanya peran yang sesuai tahap aktif dapat mengambil keputusan; Operator dan peran lain membaca detail saja. Pengembalian membutuhkan alasan dan mengarah satu tahap ke belakang. Persetujuan bergerak ke tahap berikutnya, dengan validasi akhir oleh KPA. Keputusan memperbarui status, ringkasan pagu, dan audit dalam memori; refresh/logout mengembalikan data contoh. Untuk mencoba verifikasi, masuk sebagai SPI lalu buka usulan USL/2027/TI/004. Rincian item berjumlah Rp 485.000.000 agar konsisten dengan data dashboard. Pemeriksaan SBM tetap manual karena basis standar resmi belum terhubung.

Implementasi antrean ada di `src/pages/antrean/ReviewQueuePage.jsx` dan `reviews.css`. Komponen detail, tab, dialog keputusan, serta aturan simulasi berada di `src/features/approvals/`.

Menu **Usulan Anggaran** membuka halaman khusus di `#/usulan-anggaran`. Halaman menggunakan `DashboardLayout`, `DashboardSidebar`, dan `DashboardNavbar` bersama dashboard. Implementasi halaman ada di `src/pages/usulan/ProposalsPage.jsx`; penyaringan terpusat ada di `src/features/budget-proposals/selectors.js`. Filter sumber dana, tahap, status, pencarian, dan urutan bisa digabungkan. Ekspor CSV hanya mencakup hasil filter, termasuk hasil di halaman pagination lain. Navigasi browser Back/Forward dan refresh mempertahankan halaman aktif; data draf tetap berupa simulasi dalam memori.

```text
src/
├── components/
│   ├── data-display/   # StatCard, StatusBadge
│   ├── feedback/       # Modal bersama
│   └── layout/         # DashboardSidebar
├── features/dashboard/
│   ├── demoData.js
│   ├── BudgetComposition.jsx
│   ├── StatusDistribution.jsx
│   ├── ProposalTable.jsx
│   ├── ProposalDetail.jsx
│   └── ProposalEditor.jsx
├── layouts/DashboardLayout.jsx
├── pages/dashboard/   # DashboardPage dan CSS khusus
└── utils/             # Format nominal/persentase dan ekspor CSV
```
