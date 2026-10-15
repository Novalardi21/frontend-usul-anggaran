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

Login dan dashboard tersedia sebagai prototipe dengan data contoh. Tanpa VITE_API_BASE_URL, masukkan email valid atau NIP 18 digit dan kata sandi apa saja untuk masuk ke dashboard. Kredensial demo tidak dikirim ke layanan eksternal atau disimpan. Hanya peran dan penanda sesi demo disimpan dalam sessionStorage agar refresh tetap membuka dashboard. Tombol keluar menghapus sesi demo. Mode demo bukan autentikasi produksi.

Dashboard menggunakan sidebar desktop 248px, topbar fixed 72px, empat kartu ringkasan, komposisi pagu, distribusi status, dan tabel berpaginasi. Pada tablet/mobile sidebar berubah menjadi drawer. Pencarian, filter status, tahun, notifikasi, detail usulan, ubah usulan, buat draf, dan ekspor CSV data contoh dapat dicoba. Sumber data: src/features/dashboard/demoData.js. Perubahan draf hanya bertahan selama dashboard terpasang dan direset setelah refresh/logout.

Angka ringkasan dihitung dari data tabel: total pagu Rp 1.850.000.000, tervalidasi Rp 340.000.000, komitmen Rp 889.550.000, sisa Rp 620.450.000. Draf dan koreksi pada tahap Operator tidak mengikat pagu. Data contoh hanya tersedia untuk TA 2027; tahun lain menampilkan keadaan kosong. Peran selain Admin tidak melihat menu master administrasi. Pilihan peran demo hanya untuk pratinjau UI.

Backend, SSO, reset sandi, keputusan pemeriksa produksi, laporan resmi L01–L11, dan integrasi SAKTI belum tersedia. Master, pengajuan, koreksi, dan laporan contoh tersedia sebagai simulasi lokal. Tahun/periode adalah konten referensi statis. Logo institusi memakai aset pengguna `src/assets/POLINDRA.png`, melalui komponen bersama `InstitutionLogo`. Avatar masih berupa inisial contoh.

Adapter API opsional. Salin .env.example menjadi .env.local, isi VITE_API_BASE_URL, lalu mulai ulang Vite setelah kontrak backend dikonfirmasi:

- POST {VITE_API_BASE_URL}/login dengan JSON { identifier, password, role, remember_session }.
- Peran: OPERATOR, PIMPINAN, SAKIP, SPI, KPA, ADMIN; server memverifikasi izin berdasarkan akun.
- Adapter mengasumsikan sesi cookie HttpOnly (credentials: include), response 2xx untuk autentikasi berhasil, serta kode error HTTP standar. HTTPS, CORS, cookie, CSRF, dan batas sesi 8 jam ditetapkan backend.
- Password/token tidak disimpan dalam localStorage/sessionStorage. Checkbox hanya mengirim preferensi sesi ke server.
- Setelah response sukses, sandi dibersihkan dan halaman berpindah ke dashboard prototipe. Dashboard masih memakai data contoh; integrasi data dan identitas akun produksi belum diimplementasikan.
- Font Inter dimuat dari Google Fonts, dengan fallback font sistem saat offline.

Klaim sinkronisasi SAKTI, sertifikasi ISO, dan TLS pada gambar tidak ditampilkan sebagai fakta. Sesuai design.md, keluaran awal untuk SAKTI berupa rekap untuk input manual.

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

