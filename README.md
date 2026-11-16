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

Menu **Master Akun Anggaran** (`#/master-akun-anggaran`) tersedia untuk superadmin dan membaca tabel `akun` dari GET /akuns pada backend branch `fix/pembaruan-model`. Tambah memakai POST /akuns, ubah nama memakai PATCH /akuns/:kode_akun, dan hapus memakai DELETE /akuns/:kode_akun. Dialog hapus meminta konfirmasi nama karena rincian anggaran yang memakai akun dapat ikut terhapus.
Menu **Daftar Pagu** (`#/pagu-iku`, menggantikan tampilan Pagu & IKU pada sesi backend) membaca saldo dari tabel `pagu`. Operator dan Pimpinan menggunakan GET /pagus/unit-kerja; role lintas unit menggunakan GET /pagus. GET /pagus dan GET /pagus/:id kini memerlukan login; backend membatasi Operator/Pimpinan ke unit akun, termasuk ketika meminta detail langsung. Akun unit tanpa unit kerja ditolak dengan 403. Daftar mendukung pencarian, filter unit/sumber dana, total saldo hasil filter, dan muat ulang. Nominal BIGINT dijumlahkan dengan BigInt agar presisi rupiah tetap terjaga. Admin dapat menambah pagu melalui POST /pagus dan mengubah saldo melalui PATCH /pagus/:id. Role lain hanya melihat daftar. Hapus pagu belum dihubungkan. Saldo tersimpan sudah dikurangi oleh pengajuan dan tidak dianggap sebagai alokasi awal. Database pagu belum memiliki tahun, sehingga pemilih tahun tidak memfilter halaman ini. Dashboard dan IKU tetap memakai simulasi. Restart backend agar pembatasan akses baca aktif.
Form **Tambah Pagu** memuat seluruh unit dari GET /unit-kerjas dan menawarkan sumber dana dari GET /master-pagus; sumber dana baru otomatis didaftarkan oleh backend. Nominal dikirim sebagai string rupiah bulat agar BIGINT tidak kehilangan presisi. Backend menerima nol, menolak negatif/desimal/nominal di luar BIGINT bertanda, dan menolak kombinasi unit-sumber yang sudah ada dengan HTTP 409. Pembuatan sumber dan pagu berjalan dalam satu transaksi. **Ubah Saldo** menetapkan saldo baru secara keseluruhan, bukan menambah nominal ke saldo lama; unit dan sumber dana tetap. Form mengirim saldo lama sebagai expected_nominal_pagu; jika saldo sudah berubah, backend menolak dengan 409 dan pengguna diminta memuat ulang. Form menampilkan kesalahan server dan mencegah pengiriman ganda. Setelah berhasil menyimpan, daftar dan total dimuat ulang. Restart backend agar perubahan validasi aktif.
Menu **Usulan Anggaran** (`#/usulan-anggaran`) pada sesi backend kini menampilkan daftar database melalui GET /pengajuans dengan pencarian nomor/unit/pengaju dan filter status/tahap. **Lihat Detail** membuka GET /pengajuans/:id, berisi unit, pengaju, status, posisi, total, catatan revisi, dan rincian akun/volume/satuan/harga. Detail menggunakan query `?pengajuan=<id>` sehingga dapat dibuka ulang setelah refresh. Daftar dan detail memakai pembatasan backend yang sama: Operator hanya unit akun; Pimpinan unit akun dari tahap Pimpinan ke atas; SAKIP/SPI/KPA tahap masing-masing ke atas; Admin seluruh pengajuan. Unit yang belum ditetapkan atau peran tidak dikenal ditolak, dan detail di luar cakupan menghasilkan 404. Daftar tidak mengirim seluruh rincian; rincian dimuat ketika detail dibuka. Restart backend untuk mengaktifkan endpoint detail dan akses baca Admin. Formulir kirim pengajuan sudah terhubung; simpan/edit draf belum disambungkan; pengiriman ulang revisi sudah terhubung; keputusan pemeriksa sudah terhubung. Pilihan tahun tidak memfilter pengajuan karena tabel pengajuan belum memiliki kolom tahun. Dashboard Operator/Pimpinan sudah terhubung; antrean pemeriksaan sudah terhubung ke backend.
Formulir **Formulir Usul Anggaran** tersedia untuk Operator. Isi nama item, pilih kode akun hingga kode IKU satu per satu dari data master, lalu isi target IKU, jenis belanja, satuan, volume, dan harga. Kegiatan 7731 memakai BOPTN, 7732 memakai PNBP, dan 7734 memakai RM. Satu pengajuan memakai satu jenis pagu. Backend memvalidasi relasi kode, menghitung total, dan memotong pagu unit saat dikirim ke Pimpinan Unit. Restart backend untuk menyinkronkan kolom nama item, kode komponen, kode IKU, dan target IKU.

POST /pengajuans menerima { nomor_pengajuan, jenis_pagu, items: [{ akun_id, kode_satuan, volume, nominal_satuan }] }. Server mengambil unit/operator dari sesi, memvalidasi hierarki serta satuan, dan menghitung ulang setiap total. Payload lama dengan seluruh kode hierarki masih didukung, tetapi jalurnya wajib cocok dengan tabel akun. Total/identitas unit yang dikirim klien tidak dipercaya. Server mengunci baris unit untuk pemeriksaan nomor duplikat dan baris pagu unit-sumber untuk pemeriksaan saldo terbaru. Pengajuan, seluruh item, dan pengurangan saldo disimpan dalam satu transaksi; kegagalan membatalkan seluruhnya. Pagu ganda, nomor duplikat, atau saldo kurang menghasilkan 409. Total sama dengan saldo boleh dikirim sehingga saldo menjadi nol. Nominal BIGINT dikirim sebagai string untuk menjaga presisi.

Mengikuti backend yang sudah ada, Kirim membuat status pending pada posisi pimpinan_unit dan langsung mengurangi pagu, tanpa tahap simpan draf. Respons menyertakan pengajuan_id, total_nominal_diajukan, dan sisa_pagu. Setelah berhasil, tautan Lihat Pengajuan membuka data yang baru dikirim. Tidak ada kirim otomatis ketika koneksi gagal; periksa daftar berdasarkan nomor sebelum mengirim ulang. Restart backend agar transaksi pengiriman aktif. Tahun anggaran dan IKU belum menjadi bagian kontrak pengajuan backend ini.
Dashboard **Operator dan Pimpinan Unit** (`#/dashboard`) pada sesi backend sudah mengambil data dari GET /dashboard/unit. Endpoint memerlukan login, hanya menerima kedua peran ini, dan mengambil unit dari akun; unit tidak dipilih melalui parameter klien. Backend membaca unit, saldo pagu, dan pengajuan dalam satu transaksi baca. Pengajuan mengikuti cakupan yang sama dengan daftar/detail (Pimpinan hanya tahap Pimpinan ke atas). Dashboard menampilkan saldo langsung dari pagu tanpa menguranginya lagi, saldo per sumber, nominal/jumlah pengajuan, status, tugas menunggu Pimpinan, serta lima pengajuan terbaru yang menuju detail backend. Nominal dijumlahkan memakai BigInt dan dikirim sebagai string. Tahun tidak ditampilkan sebagai filter dashboard ini karena backend belum memisahkan tahun. Muat ulang dan membuka kembali Dashboard mengambil data terbaru; badge unit memakai hitungan respons backend. Dashboard SAKIP/SPI/KPA menampilkan antrean pemeriksaan backend; mode demo tetap menggunakan simulasi. Restart backend untuk mengaktifkan route dashboard baru.
**Verifikasi backend** tersedia di menu Antrean Pemeriksaan (`#/antrean-pemeriksaan`) dan detail pada Usulan Anggaran. Pemeriksa masuk ke Tugas Saya, membuka Periksa, lalu mengonfirmasi Setujui & Teruskan atau Kembalikan dengan Catatan. Pimpinan Unit → SAKIP → SPI → KPA → completed; hanya KPA menetapkan approved. Pengembalian membutuhkan alasan nonkosong (maksimal 5000 karakter), status revision, dan turun satu tahap. Revisi yang disetujui kembali menjadi pending. Mengikuti backend sebelumnya, alias action reject juga berarti pengembalian, bukan penolakan final. Pengembalian tidak mengembalikan saldo pagu dan persetujuan tidak memotong pagu lagi. Edit dan pengiriman ulang revisi oleh Operator sudah tersedia melalui tombol Perbaiki ketika berkas berada pada posisi operator.

PATCH /pengajuans/:id/verify memeriksa peran aktif, unit Pimpinan, status yang masih dapat diproses, dan snapshot expected_position/expected_status/expected_updated_at dari detail. Pemeriksaan serta perubahan berjalan dalam transaksi dengan row lock; keputusan bersamaan tidak memproses tahap yang sama dua kali. Pengajuan final/draf ditolak; detail kedaluwarsa diminta dimuat ulang. Admin dan Operator membaca saja. Setelah keputusan berhasil, detail ditutup, antrean dan badge dimuat ulang dari backend. Dashboard unit mengambil ringkasan baru ketika dibuka kembali. Route yang dipakai tetap endpoint verify yang sudah ada; restart backend agar penguatan transaksi/status aktif. Keputusan backend menyimpan posisi/status dan catatan revisi terakhir; belum ada tabel riwayat keputusan per pemeriksa.
Menu **Antrean Koreksi** (`#/antrean-koreksi`) pada sesi backend membaca GET /pengajuans dan hanya menampilkan status revision, mengikuti pembatasan akun dari backend. Operator melihat revisi unitnya, termasuk berkas yang sudah kembali ke posisi operator; pemeriksa mengikuti cakupan tahap masing-masing. Tabel memuat catatan revisi terakhir, posisi berkas, unit, dan nominal. Pencarian dan filter posisi dapat digabungkan. Lihat Catatan membuka detail backend melalui query ?pengajuan=<id> dengan catatan penuh dan rincian anggaran. Pemeriksa pada tahap aktif dapat meninjau koreksi menggunakan verifikasi yang sudah terhubung; ketika status berubah menjadi pending/approved, pengajuan keluar dari antrean koreksi. Operator dapat membuka Perbaiki untuk revisi yang sudah kembali ke posisi operator. Muat ulang atau buka kembali menu untuk mengambil perubahan terbaru. Mode demo tetap menggunakan simulasi koreksi lama.
**Perbaiki dan Ajukan Ulang** tersedia untuk Operator di unit yang sama ketika status revision dan posisi operator. Rincian yang tersimpan dimuat kembali. Untuk rincian lama, lengkapi kolom baru yang masih kosong sebelum mengirim ulang. Nomor pengajuan tetap.

PATCH /pengajuans/:id/resubmit memeriksa peran/unit, posisi/status, expected_updated_at dan expected_total. Pengajuan, item, dan penyesuaian saldo berada dalam satu transaksi dengan kunci baris. Saldo baru = saldo tersimpan + total lama − total revisi. Total baru tidak boleh melebihi saldo tersimpan + total lama. Revisi senilai sama tidak memotong pagu lagi; revisi lebih kecil mengembalikan selisih ke sumber yang sama; revisi lebih besar hanya mengambil tambahannya. Setelah dikirim ulang, pengajuan yang sama menjadi pending pada posisi pimpinan_unit dan hilang dari Antrean Koreksi.

Model pengajuan kini menyimpan jenis_pagu dan pagu_id yang nullable, dengan FK pagu_id RESTRICT. Pengiriman baru menyimpan referensi pagu sejak awal. Restart backend agar db.sync({alter:true}) menambahkan kolom ini. Pengajuan lama yang belum memiliki sumber asal tetap dapat dikoreksi/dikirim ulang dengan total tetap tanpa mengubah saldo. Perubahan total pada data lama diblokir sampai sumber asal dipastikan, karena menebak sumber dana dapat merusak saldo. Tidak ada backfill sumber dana otomatis. Pengiriman ulang mempertahankan catatan revisi terakhir, sementara item lama diganti dalam transaksi; belum ada tabel arsip rincian per siklus.
Pada formulir perbaikan, sumber dana mengikuti kode kegiatan baru dan pagu unit yang sama. Jika sumber tetap, saldo disesuaikan dengan selisih total. Jika sumber berubah, transaksi mengembalikan seluruh total lama ke pagu asal lalu mengurangi seluruh total revisi dari pagu tujuan. Batas revisi untuk sumber tujuan adalah saldo tujuan saat ini (tidak ditambah nominal lama dari sumber berbeda). Backend mengunci kedua pagu dan membatalkan perubahan rincian serta kedua saldo jika ada kegagalan. Form menampilkan sumber asal/tujuan dan konsekuensi saldo sebelum konfirmasi. Data lama tanpa sumber asal tetap tidak dapat dipindahkan sampai asal pengurangan dipastikan; memilih tujuan saja tidak boleh dianggap sebagai bukti sumber asal.
Jika backend tidak aktif, frontend menampilkan kesalahan koneksi dan tombol coba lagi. Untuk mencoba demo tanpa backend, kosongkan `VITE_API_BASE_URL` dan restart Vite. Dalam demo, gunakan email valid atau NIP 18 digit dan kata sandi apa saja; peran dan penanda demo disimpan di sessionStorage. Kredensial tidak disimpan.

Simpan/edit draf, perhitungan pagu dashboard, master selain unit kerja, satuan, dan katalog akun anggaran, pemeriksaan, pengguna, audit, dan laporan L01–L11 masih memakai simulasi lokal TA 2027. Perubahan modul simulasi direset setelah refresh/logout. Data unit backend ditampilkan terpisah dari referensi unit demo agar tidak mengubah perhitungan atau cakupan simulasi. SSO, reset sandi, dan integrasi SAKTI belum terhubung.

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
