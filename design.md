# DESIGN.md — Aplikasi Usul Anggaran POLINDRA

> **Dokumen acuan desain UI/UX dan implementasi frontend**  
> Versi 1.0 · 14 Oktober 2026  
> Produk: Aplikasi Usul Anggaran POLINDRA  
> Sumber utama: `SRS_Aplikasi_Usul_Anggaran.docx` dan `SDD_Aplikasi_Usul_Anggaran.docx` (versi 1.0, 8 Oktober 2026).  
> Referensi visual: dashboard BankFlash yang dilampirkan pengguna.

---

## 1. Tujuan Produk

Bangun aplikasi web internal untuk membantu unit kerja POLINDRA menyusun rincian usulan anggaran, menghubungkan item dengan Indikator Kinerja Utama (IKU), memeriksa pagu BOPTN/PNBP, dan mengelola pemeriksaan berjenjang sampai validasi KPA/Direktur. Hasil akhir berupa usulan tervalidasi, jejak pemeriksaan yang dapat ditelusuri, serta rekap untuk input manual ke SAKTI.

Aplikasi harus terasa seperti **dashboard administrasi keuangan modern**: rapi, tenang, mudah dipindai, dan berorientasi pada tabel/formulir. Gunakan struktur visual dari referensi BankFlash—sidebar tetap, topbar, kartu ringkasan, area konten putih/abu muda, grafik ringkas, tabel berjarak lega—tetapi jangan menyalin domain perbankan. Semua label, data, grafik, dan alur harus relevan dengan usulan anggaran.

### Prinsip utama

1. **Angka anggaran harus jelas.** Total, pagu, komitmen, dan sisa pagu tidak boleh tercampur.
2. **Tindakan sesuai kewenangan.** Tampilkan aksi yang relevan dengan peran dan tahap aktif; otorisasi tetap wajib dilakukan server.
3. **Riwayat tidak hilang.** Siklus pengajuan, snapshot, catatan pemeriksa, dan audit ditampilkan dengan kronologi yang jelas.
4. **Kesalahan mudah diperbaiki.** Tunjukkan validasi di tingkat field dan item, bukan hanya toast generik.
5. **Jangan membuat fitur/angka fiktif.** Dashboard dan grafik hanya menggunakan data dari API. Data contoh untuk prototipe harus diberi label “Data contoh”.
6. **Desktop-first, tetap responsif.** Tabel kompleks nyaman di desktop; di tablet/mobile gunakan overflow horizontal atau layout kartu yang tetap mempertahankan seluruh informasi penting.

---

## 2. Identitas Visual

### 2.1 Arah gaya

- Modern, profesional, institusional, bersih.
- Referensi layout: dashboard BankFlash terlampir.
- Jangan menggunakan visual “banking” secara literal: tidak ada kartu kredit, transfer, rekening, atau transaksi pembayaran.
- Hindari efek glassmorphism berat, gradien di seluruh halaman, bayangan berlebihan, dan dekorasi yang mengurangi keterbacaan angka.
- Gunakan warna aksen kuat hanya untuk aksi primer, status, dan visualisasi data.

### 2.2 Design tokens

Gunakan token berikut secara konsisten. Nilai ini adalah usulan desain, bukan ketentuan bisnis.

```css
:root {
  --color-primary: #263D8F;
  --color-primary-hover: #1D2F73;
  --color-primary-soft: #E9EDFF;
  --color-accent: #4F46E5;

  --color-bg: #F4F6FA;
  --color-surface: #FFFFFF;
  --color-surface-muted: #F8FAFC;
  --color-border: #E2E8F0;

  --color-text: #172033;
  --color-text-secondary: #64748B;
  --color-text-muted: #94A3B8;

  --color-success: #0F9F78;
  --color-success-soft: #DDF8EF;
  --color-warning: #D97706;
  --color-warning-soft: #FFF2D8;
  --color-danger: #DC525D;
  --color-danger-soft: #FDE8EA;
  --color-info: #2877C7;
  --color-info-soft: #E5F2FF;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-xl: 24px;

  --shadow-card: 0 4px 18px rgba(23, 32, 51, 0.04);
  --shadow-popover: 0 12px 36px rgba(23, 32, 51, 0.12);
}
```

### 2.3 Tipografi

- Gunakan **Inter** sebagai pilihan utama; fallback: `ui-sans-serif, system-ui, sans-serif`.
- Judul halaman: 24–28 px, weight 650–700.
- Judul section/kartu: 15–17 px, weight 600.
- Isi dan tabel: 13–14 px.
- Label/helper text: 12–13 px.
- Nominal ringkasan: 24–30 px; gunakan angka tabular (`font-variant-numeric: tabular-nums`).
- Jangan menggunakan teks abu-abu terlalu pucat untuk informasi penting.

### 2.4 Spasi, grid, dan permukaan

- Sidebar desktop: lebar 248 px (dapat dipadatkan menjadi 80 px jika desain mendukung).
- Topbar: tinggi 72 px.
- Konten utama: padding 28–32 px desktop, 20 px tablet, 16 px mobile.
- Jarak antarsection: 24–28 px; jarak antarkomponen: 12–16 px.
- Kartu: putih, border tipis, radius 16–18 px, shadow sangat halus.
- Latar keseluruhan: abu-abu kebiruan muda; area kerja dan tabel tetap putih.
- Gunakan layout grid 12 kolom pada dashboard; pada layar sempit semua kolom turun menjadi satu kolom.

### 2.5 Ikon dan grafik

- Gunakan ikon outline konsisten (misalnya Lucide). Ikon harus membantu pemindaian, bukan dekorasi.
- Grafik memiliki judul, label, tooltip, satuan, dan empty state.
- Jangan mengandalkan warna saja untuk membedakan status atau seri grafik; tambahkan label/ikon.
- Format nominal: `Rp 1.250.000` (locale `id-ID`). Format tanggal: `14 Okt 2026`; waktu riwayat menggunakan zona `Asia/Jakarta`.

---

## 3. Kerangka Aplikasi

### 3.1 Layout utama

```text
┌──────────────────────┬─────────────────────────────────────────────────────┐
│ Logo POLINDRA / App  │ Topbar: Breadcrumb/Judul · Search opsional ·         │
│                      │ Notifikasi · Bantuan · Profil pengguna               │
├──────────────────────┼─────────────────────────────────────────────────────┤
│ Dashboard            │                                                     │
│ Usulan Anggaran      │ Area halaman                                        │
│ Antrean Pemeriksaan  │                                                     │
│ Koreksi              │                                                     │
│ Laporan              │                                                     │
│ ───────────────────  │                                                     │
│ Master Data*         │                                                     │
│ Pengguna & Hak Akses*│                                                     │
│ Pagu & IKU*          │                                                     │
│ Audit Aktivitas*     │                                                     │
│ Pengaturan           │                                                     │
├──────────────────────┴─────────────────────────────────────────────────────┤
│ Area konten responsif                                                     │
└────────────────────────────────────────────────────────────────────────────┘
```

`*` Menu master, pengguna, pagu, IKU, dan audit ditampilkan sesuai izin peran. Jangan tampilkan menu yang tidak relevan bagi pengguna. Server tetap memvalidasi setiap request meskipun menu disembunyikan.

### 3.2 Topbar

- Kiri: breadcrumb dan/atau judul halaman.
- Kanan: pencarian jika halaman mendukung, ikon notifikasi, avatar/inisial, nama, dan peran.
- Profil membuka menu: Profil, preferensi yang tersedia, Keluar.
- Notifikasi mengarahkan ke tugas baru, koreksi, atau alasan kegagalan pengajuan (F20).
- Jangan menambahkan notifikasi yang tidak punya sumber data.

### 3.3 Navigasi per peran

| Peran | Cakupan utama | Menu/tindakan yang relevan |
|---|---|---|
| Admin | Seluruh unit | Dashboard, semua usulan, master hierarki, unit, pengguna, pagu, IKU, laporan, audit |
| Operator | Unit sendiri | Dashboard, usulan saya, buat/edit draf, koreksi, ajukan ulang, laporan yang diizinkan |
| Pimpinan Unit | Unit sendiri | Dashboard, antrean persetujuan, detail usulan, setujui/kembalikan, teruskan koreksi, laporan yang diizinkan |
| Tim SAKIP | Lintas unit | Dashboard, antrean verifikasi SAKIP, detail, verifikasi/kembalikan, teruskan koreksi, laporan yang diizinkan |
| SPI | Lintas unit | Dashboard, antrean verifikasi SPI, detail, verifikasi/kembalikan, teruskan koreksi, laporan yang diizinkan |
| KPA/Direktur | Lintas unit | Dashboard, antrean validasi, detail, validasi/kembalikan, laporan yang diizinkan |

Catatan: Admin tidak otomatis memiliki hak menyetujui. Operator dan Pimpinan dibatasi pada unitnya. Pimpinan, SAKIP, SPI, dan KPA tidak mengedit rincian item saat melakukan pemeriksaan.

---

## 4. Sitemap dan Halaman

### 4.1 Daftar halaman inti

| Halaman | Tujuan | Elemen penting |
|---|---|---|
| Login | Masuk ke sistem | Logo/nama aplikasi, login, kata sandi, tampil/sembunyikan kata sandi, validasi, loading, pesan gagal |
| Dashboard | Ringkasan aktivitas sesuai peran | Pagu/sisa, draf, tugas masuk, koreksi, usulan tervalidasi, tren/rekap yang bersumber dari data |
| Daftar Usulan | Menemukan dan memantau usulan | Tabel, filter, pencarian, status, tahap aktif, total, unit/tahun sesuai izin |
| Buat/Edit Usulan | Menyusun rincian anggaran | Informasi pagu, item, IKU, kontribusi, jadwal penarikan, total otomatis, simpan dan ajukan |
| Detail Usulan | Membaca isi/snapshot dan konteks | Header usulan, rincian item, ringkasan nominal, IKU, jadwal, status dan timeline |
| Antrean Pemeriksaan | Menangani tugas pada tahap aktif | Daftar tugas sesuai peran, umur tugas jika data tersedia, status, filter |
| Antrean Koreksi | Meneruskan atau memperbaiki usulan | Catatan pengembalian, jalur koreksi, tombol teruskan atau perbaiki sesuai peran |
| Master Anggaran | Mengelola hierarki program hingga akun | Tree/select hierarkis, pencarian, tambah/edit/nonaktifkan, audit perubahan |
| Unit Kerja | Mengelola unit | Tabel unit, kode, nama, status aktif |
| Jenis Belanja | Mengelola kategori belanja | Kode, nama, status aktif |
| Pagu | Mengelola pagu tahunan | Unit, kegiatan, tahun, sumber BOPTN/PNBP, nominal, komitmen, sisa |
| IKU & Target | Mengelola IKU dan target per tahun | Kode, nama, satuan, tahun target, nilai target, kontribusi terikat jika tersedia |
| Pengguna & Hak Akses | Mengelola akun | Nama, login, peran, unit bila diperlukan, status aktif |
| Laporan | Melihat dan mengekspor laporan L01–L11 | Pemilih laporan, filter, tabel hasil, ekspor PDF/lembar kerja |
| Riwayat & Audit | Menelusuri perubahan dan keputusan | Timeline per siklus, pelaku, peran saat aksi, aksi, catatan, waktu |
| Notifikasi | Melihat pemberitahuan | Tugas baru, koreksi, alasan pengajuan gagal; tautan ke konteks |

### 4.2 Halaman login

- Tampilan sederhana dan profesional dengan logo/nama **Aplikasi Usul Anggaran POLINDRA**.
- Panel pengantar dapat memakai bidang warna primer; formulir ditempatkan pada kartu putih.
- Field login dan kata sandi harus berlabel jelas, dapat digunakan dengan keyboard, dan menampilkan kesalahan di dekat field.
- Jangan menampilkan fitur registrasi publik kecuali kebijakan autentikasi menetapkannya. Pengguna dikelola oleh Admin pada rancangan saat ini.
- Keamanan sesi, hash kata sandi, HTTPS, dan penyimpanan kredensial adalah tanggung jawab implementasi backend, bukan sekadar UI.

---

## 5. Dashboard

Dashboard mengambil struktur visual dari referensi: heading di atas, kartu ringkasan, panel grafik/tabel, dan ruang putih yang cukup. Isinya berbeda berdasarkan peran.

### 5.1 Susunan visual desktop

```text
[Dashboard]                               [Tahun ▼] [Unit ▼ jika berhak]

[ Total Pagu ] [ Sisa Dapat Diajukan ] [ Usulan Berjalan ] [ Tervalidasi ]

[ Ringkasan pagu/komitmen per sumber      ] [ Status usulan / antrean ]

[ Tugas yang perlu ditangani — tabel lebar penuh                          ]

[ Aktivitas terbaru / keputusan terbaru sesuai izin                       ]
```

Kartu hanya menampilkan metrik yang dapat dihitung dari data aktual:

- **Total Pagu** — total pagu untuk filter yang dipilih.
- **Sisa Dapat Diajukan** — nominal pagu dikurangi usulan tervalidasi dan usulan berjalan yang masih mengikat; draf dan koreksi yang sudah tiba di operator tidak mengikat.
- **Usulan Berjalan** — jumlah usulan yang statusnya `DALAM_PROSES`, atau total nominal berjalan bila diberi label jelas.
- **Usulan Tervalidasi** — jumlah atau nominal usulan tervalidasi, jangan mencampur jumlah dengan rupiah dalam satu metrik.
- **Tugas Saya** — jumlah tugas pada tahap aktif pengguna.
- **Perlu Koreksi** — jumlah usulan yang perlu diteruskan/diperbaiki oleh pengguna.

Pilih 3–4 kartu terpenting untuk peran itu; tidak harus menampilkan semuanya sekaligus. Untuk Operator, prioritaskan usulan saya, draf, koreksi, dan sisa pagu unit. Untuk pemeriksa, prioritaskan tugas masuk, perlu koreksi, dan usulan selesai.

### 5.2 Grafik yang disarankan

- **Komposisi Pagu**: BOPTN dibanding PNBP, jika filter/sumber data tersedia.
- **Status Usulan**: draf, dalam proses, koreksi, tervalidasi.
- **Rekap per unit/kegiatan**: hanya untuk peran yang boleh melihat lintas unit.
- **Tren bulanan**: hanya jika data historis cukup; jangan membuat nilai tren palsu.

Hindari chart pie dekoratif yang tidak membantu keputusan. Setiap grafik harus punya rentang waktu/filter, tooltip, label nilai, dan keadaan kosong yang informatif.

### 5.3 Tabel tugas di dashboard

Kolom yang disarankan:

- Nomor usulan
- Unit kerja (sembunyikan atau tetap dibatasi untuk peran unit sendiri)
- Tahun dan sumber dana
- Total usulan
- Status / tahap aktif
- Terakhir diperbarui
- Aksi `Lihat detail`

Urutkan berdasarkan tugas yang perlu ditangani terlebih dahulu jika backend menyediakan informasi waktu/urgensi. Jangan mengarang indikator prioritas.

---

## 6. Status, Badge, dan Workflow

Status bisnis bersifat eksplisit dan jangan diganti dengan istilah bebas.

| Status | Label UI | Gaya visual | Penjelasan |
|---|---|---|---|
| `DRAF` | Draf | Netral/abu | Masih disusun Operator; belum mengikat pagu |
| `DALAM_PROSES` | Dalam proses | Biru | Sedang diperiksa pada tahap aktif; mengikat pagu |
| `KOREKSI` | Perlu koreksi | Oranye | Sedang bergerak mundur melalui jalur koreksi; tetap mengikat sampai tiba di Operator |
| `TERVALIDASI` | Tervalidasi | Hijau | Validasi akhir KPA selesai; rincian terkunci |

Tahap aktif: `OPERATOR`, `PIMPINAN`, `SAKIP`, `SPI`, `KPA`, atau kosong setelah selesai. Di tabel, tampilkan status dan tahap aktif secara terpisah, misalnya **Dalam proses · SPI**.

### 6.1 Alur maju

```text
Operator -- AJUKAN --> Pimpinan -- SETUJUI --> Tim SAKIP
      --> SPI -- VERIFIKASI --> KPA -- VALIDASI --> Tervalidasi
```

Urutan detail: Operator mengajukan → Pimpinan menyetujui → SAKIP memverifikasi → SPI memverifikasi → KPA/Direktur memvalidasi.

### 6.2 Alur pengembalian

```text
KPA -- KEMBALIKAN --> SPI --> SAKIP --> Pimpinan --> Operator
SPI -- KEMBALIKAN --> SAKIP --> Pimpinan --> Operator
SAKIP -- KEMBALIKAN --> Pimpinan --> Operator
Pimpinan -- KEMBALIKAN --> Operator
```

- Setiap `KEMBALIKAN` mewajibkan catatan.
- Perantara hanya menggunakan aksi `TERUSKAN_KOREKSI`; tidak boleh mengubah item atau menyetujui usulan pada jalur koreksi.
- Operator memperbaiki usulan setelah tugas sampai ke tahap Operator.
- Pengajuan ulang menciptakan siklus baru dan memulai kembali dari Pimpinan.
- Riwayat siklus sebelumnya harus tetap terbaca dan tidak ditimpa.

### 6.3 Timeline riwayat

Tampilkan sebagai timeline vertikal atau tabel kronologis:

- Nomor siklus
- Aksi (AJUKAN, SETUJUI, VERIFIKASI, KEMBALIKAN, TERUSKAN_KOREKSI, VALIDASI)
- Pelaku dan peran saat aksi
- Tahap asal → tahap tujuan
- Catatan pemeriksa
- Waktu `Asia/Jakarta`

Tandai siklus aktif dengan jelas; sediakan pilihan untuk melihat siklus terdahulu. Isi snapshot siklus harus read-only.

---

## 7. Formulir Usulan Anggaran

Ini adalah salah satu halaman terpenting. Gunakan pola wizard/section yang mudah dipindai, tetapi jangan menyembunyikan ringkasan total saat pengguna mengedit.

### 7.1 Struktur halaman

1. **Header**: judul `Buat Usulan Anggaran` atau `Ubah Draf`, nomor usulan bila tersedia, badge status.
2. **Pilih pagu**: unit (terkunci dari akun untuk Operator), tahun, kegiatan, sumber dana BOPTN/PNBP, nominal pagu, komitmen, dan sisa yang dapat diajukan.
3. **Rincian item**: tabel editable dengan tambah item, ubah, hapus sesuai status/izin.
4. **Kontribusi IKU**: minimal satu IKU untuk setiap item, target tahun yang sama dengan tahun pagu, kontribusi positif.
5. **Rencana penarikan**: input nominal per bulan Januari–Desember untuk setiap item.
6. **Ringkasan**: total usulan, total per sumber (satu usulan hanya memakai satu sumber), sisa setelah pengajuan, validasi.
7. **Footer tindakan**: `Simpan Draf`, `Pratinjau`, `Ajukan Usulan` (hanya ketika relevan dan diizinkan).

### 7.2 Tabel item

Kolom minimum:

- No.
- Akun (pilihan hierarkis dan tervalidasi terhadap kegiatan pagu)
- Nama item/uraian
- Jenis belanja
- Volume
- Satuan
- Harga satuan
- Total item (otomatis, read-only)
- IKU/kontribusi (ringkasan atau tombol kelola)
- Aksi (edit/hapus sesuai izin)

Aturan interaksi:

- `Total item = volume × harga satuan`, pembulatan dua desimal.
- Total usulan adalah penjumlahan seluruh total item; tidak boleh diinput bebas.
- Volume dan harga boleh kosong pada draf, tetapi harus positif saat diajukan.
- Satu usulan wajib memiliki setidaknya satu item saat diajukan.
- Akun harus berasal dari hierarki kegiatan yang sama dengan pagu.
- Berikan penanda per baris jika akun, jenis belanja, IKU, kontribusi, atau jadwal belum valid.
- Konfirmasi sebelum menghapus item; aksi penghapusan draf tetap dicatat di audit.

### 7.3 IKU dan kontribusi

- Setiap item harus terhubung ke sedikitnya satu target IKU.
- Tahun target IKU harus sama dengan tahun pagu/usulan.
- Kontribusi rencana harus positif.
- Label dan helper text harus menyebut bahwa kontribusi adalah **rencana dukungan**, bukan bukti bahwa target IKU sudah tercapai.
- Total kontribusi yang mengikat tidak boleh melebihi target sesuai aturan D03; satuan/rumus harus mengikuti keputusan pemilik proses.
- Jika D03 belum disahkan, tampilkan konfigurasi/label yang telah ditetapkan oleh pemilik proses; jangan menetapkan satuan sendiri di frontend.

### 7.4 Rencana penarikan bulanan

- Sediakan tabel bulan Januari–Desember atau grid 12 bulan per item.
- `Total rencana penarikan per item` harus sama dengan total item sebelum pengajuan.
- Tegaskan bahwa rencana penarikan adalah **jadwal perencanaan**, bukan transaksi pembayaran.
- Tampilkan selisih jika jumlah jadwal tidak sama dengan total item.
- Jangan mengizinkan ajukan selama selisih belum nol.

### 7.5 Simpan vs ajukan

- **Simpan Draf** menyimpan progres; draf yang belum lengkap boleh disimpan dengan peringatan sesuai kebijakan yang disepakati.
- **Ajukan Usulan** menjalankan validasi final: kelengkapan item, hierarki akun, pagu/saldo terbaru, IKU dan tahun target, kontribusi, jadwal bulanan.
- Jika gagal, pertahankan semua isian, fokuskan ke field/item yang bermasalah, dan tampilkan alasan yang bisa ditindaklanjuti.
- Jika berhasil, tampilkan konfirmasi, nomor/siklus bila tersedia, status `Dalam proses`, dan tahap `Pimpinan`.
- Jangan optimistis menampilkan sukses sebelum server mengonfirmasi hasil.

### 7.6 State formulir

Wajib dirancang untuk keadaan berikut:

- Loading data master/pagu
- Draf kosong
- Draf tersimpan
- Perubahan belum disimpan
- Validasi gagal di field
- Validasi gagal di item tertentu
- Pagu tidak cukup
- Konflik saldo karena pengajuan lain berjalan
- Aksi sedang diproses (tombol disabled/loading)
- Pengajuan berhasil
- Versi usulan kedaluwarsa/konflik
- Read-only karena sedang diperiksa
- Read-only karena `TERVALIDASI`
- Akses ditolak
- Koneksi gagal dengan opsi mencoba lagi tanpa kehilangan isian

---

## 8. Detail Pemeriksaan

### 8.1 Header detail

Tampilkan nomor usulan, status, tahap aktif, unit, tahun, sumber dana, total, pembuat, dan waktu pengajuan. Untuk pemeriksa lintas unit, tampilkan identitas unit dengan jelas.

### 8.2 Ringkasan sebelum keputusan

- Data pagu dan sisa yang relevan
- Rincian item dan total
- Hierarki akun
- Hubungan IKU dan kontribusi
- Jadwal penarikan
- Snapshot siklus yang sedang diperiksa
- Catatan pemeriksaan sebelumnya
- Timeline semua keputusan yang boleh dilihat pengguna

### 8.3 Tombol tindakan

- Pimpinan: `Setujui` dan `Kembalikan`.
- SAKIP/SPI: `Verifikasi` dan `Kembalikan`.
- KPA: `Validasi` dan `Kembalikan`.
- Perantara pada jalur koreksi: `Teruskan Koreksi` saja.
- Operator saat koreksi sudah tiba: `Perbaiki` dan `Ajukan Ulang`.
- Tidak ada tombol keputusan bagi peran yang bukan pemilik tahap aktif.

Gunakan dialog konfirmasi untuk keputusan final. Aksi `Kembalikan` harus membuka dialog dengan catatan wajib dan ringkasan tujuan pengembalian. Validasi server tetap sumber kebenaran; penonaktifan tombol hanya bantuan UX.

---

## 9. Master Data dan Pengaturan

### 9.1 Hierarki master anggaran

Urutan hierarki:

`Program → Kegiatan → Output Anggaran → Suboutput → Komponen → Subkomponen → Akun`

`Jenis Belanja` merupakan master terpisah yang dirujuk item. Tampilkan sebagai tree atau pemilih bertingkat. Anak hanya dapat dipilih setelah induk dipilih. Filter pencarian harus mempertahankan konteks induknya.

- Admin dapat mengelola master sesuai haknya.
- Operator dapat menambah Subkomponen dan Akun yang belum tersedia sesuai kewenangan.
- Kode harus unik dalam lingkup induk yang ditentukan.
- Master yang telah dipakai tidak dihapus secara fisik; nonaktifkan agar histori tetap konsisten.
- Perubahan nama master tidak boleh mengubah nama pada snapshot usulan lama.
- Form tambah/edit mencatat validasi kode duplikat dan relasi induk.

### 9.2 Pagu

Field: unit kerja, kegiatan, tahun, sumber dana (`BOPTN`/`PNBP`), nominal. Kunci bisnisnya adalah kombinasi unit + kegiatan + tahun + sumber dana.

Tampilkan dalam tabel:

- Unit kerja
- Kegiatan
- Tahun
- Sumber dana
- Pagu nominal
- Nominal tervalidasi
- Komitmen berjalan
- Sisa dapat diajukan
- Status/aksi

Jangan menyatukan saldo BOPTN dan PNBP. Perubahan pagu yang membuat nilai berada di bawah nominal yang telah mengikat harus ditolak oleh sistem.

### 9.3 IKU dan target

Field master IKU: kode, nama, satuan, metode kontribusi. Target disimpan per tahun: IKU, tahun, nilai target. Berikan peringatan jika target telah dipakai usulan yang mengikat dan perubahan akan membuat total kontribusi melampaui target.

### 9.4 Pengguna

Field: nama, login/email sesuai mekanisme autentikasi, peran, unit (wajib untuk Operator dan Pimpinan), status aktif. Akun dibuat oleh Admin dalam rancangan saat ini. Jangan menampilkan password asli; hanya form penetapan/reset password bila didukung kebijakan backend.

---

## 10. Laporan

Buat satu halaman Laporan dengan pemilih laporan (tab atau dropdown), filter, tombol `Terapkan Filter`, `Reset`, dan ekspor. Pertahankan nama/kode L01–L11 dari SRS.

| Kode | Nama laporan | Akses yang tercantum pada SRS |
|---|---|---|
| L01 | Usul anggaran setiap unit | Admin, Operator, Pimpinan, SAKIP, SPI, KPA |
| L02 | Belum disetujui pimpinan unit | Admin, Pimpinan |
| L03 | Belum diverifikasi Tim SAKIP | Admin, Tim SAKIP |
| L04 | Belum diverifikasi SPI | Admin, SPI |
| L05 | Belum divalidasi KPA | Admin, KPA |
| L06 | Usul bahan praktikum setiap unit | Admin, Operator, Pimpinan, KPA |
| L07 | Usul belanja aset setiap unit | Admin, Operator, Pimpinan, KPA |
| L08 | Usul honor setiap unit | Admin, Operator, Pimpinan, KPA |
| L09 | Usul perjalanan dinas setiap unit | Admin, Operator, Pimpinan, KPA |
| L10 | Rencana penarikan anggaran setiap unit | Admin, Operator, Pimpinan, KPA |
| L11 | Rekap subkomponen untuk setiap IKU | Admin, Operator, Pimpinan, SAKIP, SPI, KPA |

Filter yang relevan: tahun, unit, sumber dana, status, jenis belanja, IKU. Operator dan Pimpinan tetap dibatasi pada unit sendiri meskipun filter menampilkan pilihan unit. Ekspor PDF/lembar kerja harus sama dengan filter dan hak akses yang berlaku.

### 10.1 Tampilan tabel laporan

- Judul laporan dan kode.
- Ringkasan filter aktif sebagai chip yang dapat dihapus.
- Jumlah hasil dan total nominal bila sesuai jenis laporan.
- Tabel dengan header yang jelas, alignment angka ke kanan, total di bagian bawah jika bermakna.
- Pagination server-side untuk dataset besar.
- Loading skeleton, empty state, error state, dan indikator ekspor berjalan.
- Ekspor 10.000 item memiliki sasaran performa pada SRS; UI harus memberi feedback selama proses dan menampilkan kegagalan jika ekspor tidak berhasil.

---

## 11. Komponen UI yang Diperlukan

Bangun komponen reusable, tidak membuat desain ulang untuk setiap halaman:

- `AppShell`, `Sidebar`, `Topbar`, `Breadcrumbs`
- `PageHeader` dengan judul, deskripsi singkat, dan primary action
- `StatCard` untuk metrik
- `StatusBadge` dan `StageBadge`
- `DataTable` dengan sorting, filter, pagination, empty/loading/error state
- `MoneyText` untuk format rupiah dan angka tabular
- `FilterBar` dan `ActiveFilterChips`
- `FormField`, `Select`, `Combobox`, `Date/YearPicker`, `Textarea`
- `BudgetSummaryCard` untuk pagu, tervalidasi, komitmen, dan sisa
- `BudgetItemTable` dan `BudgetItemEditor`
- `IkuContributionEditor`
- `MonthlyWithdrawalPlanner`
- `ApprovalTimeline` dan `CycleSelector`
- `DecisionDialog` dan `ReturnWithNoteDialog`
- `ConfirmDeleteDialog`
- `NotificationPanel`
- `Toast` untuk hasil aksi yang tidak memerlukan detail panjang
- `InlineValidationMessage` untuk kesalahan field/item
- `Skeleton`, `EmptyState`, `ErrorState`, `AccessDeniedState`

Setiap komponen memiliki props/type yang jelas, mendukung keyboard, dan tidak mengandung aturan otorisasi sebagai satu-satunya pengaman.

---

## 12. Interaksi, Aksesibilitas, dan Responsivitas

### 12.1 Interaksi

- Semua aksi mutasi menunjukkan loading dan mencegah double-submit di UI.
- Aksi penting membutuhkan konfirmasi; aksi pengembalian membutuhkan catatan.
- Tampilkan perubahan yang belum disimpan dan beri konfirmasi saat pengguna meninggalkan halaman bila relevan.
- Simpan filter tabel di state halaman; bila memakai query string, pastikan dapat dibagikan hanya dalam batas izin.
- Jangan menghapus isian ketika validasi server gagal.
- Setelah aksi sukses, perbarui antrean, badge, timeline, dan notifikasi sesuai response server.
- Konflik versi atau saldo harus ditampilkan sebagai konflik yang bisa dipahami, bukan error umum.

### 12.2 Aksesibilitas

- Semua input mempunyai label eksplisit.
- Seluruh fungsi dapat digunakan dengan keyboard; fokus terlihat jelas.
- Dialog mengunci fokus dan mengembalikan fokus setelah ditutup.
- Kontras teks/status memadai; status tidak dibedakan melalui warna saja.
- Tabel memiliki header semantik dan tombol dengan nama yang jelas.
- Grafik menyertakan ringkasan tekstual.
- Jangan menggunakan placeholder sebagai pengganti label.

### 12.3 Responsif

- Desktop ≥ 1280 px: sidebar penuh dan tabel lengkap.
- Tablet 768–1279 px: sidebar dapat diciutkan; kartu menjadi dua kolom.
- Mobile < 768 px: sidebar menjadi drawer, kartu satu kolom, form vertikal, tabel overflow horizontal atau kartu per item.
- Aksi utama formulir tetap mudah ditemukan; jangan menutupi data dengan footer sticky yang terlalu tinggi.
- Uji layout pada zoom 200% dan lebar layar kecil.

---

## 13. Aturan Bisnis yang Wajib Tercermin di UI

UI tidak boleh bertentangan dengan aturan berikut. Implementasi final harus divalidasi bersama pemilik proses untuk aturan yang ditandai sebagai usulan pada SRS.

1. Satu usulan menggunakan satu pagu: satu unit, satu tahun, satu kegiatan, satu sumber dana.
2. Semua item dalam usulan harus berada pada kegiatan yang sama dengan pagu.
3. Total item = volume × harga satuan; total usulan = jumlah seluruh item.
4. Draf yang belum lengkap dapat disimpan dengan peringatan sesuai keputusan kebijakan, tetapi tidak dapat diajukan sebelum lengkap.
5. Pengajuan wajib memiliki minimal satu item; setiap item wajib memiliki akun, jenis belanja, nama item, satuan, volume positif, harga positif, IKU, kontribusi positif, dan jadwal bulanan yang seimbang.
6. Sisa yang dapat diajukan = nominal pagu − usulan tervalidasi − usulan berjalan yang masih mengikat. Usulan tervalidasi dihitung sekali, bukan sekali per siklus.
7. Draf tidak mengikat pagu. Usulan dalam proses dan koreksi sebelum tiba di Operator tetap mengikat. Koreksi yang sudah diterima Operator melepaskan komitmen sampai diajukan ulang.
8. Saldo harus diperiksa ulang ketika ajukan; pengajuan bersamaan tidak boleh menyebabkan pagu terpakai melebihi batas.
9. Setiap pengajuan ulang membentuk siklus baru. Snapshot dan keputusan siklus sebelumnya tidak berubah.
10. Hanya peran pada tahap aktif yang dapat mengambil keputusan. Server menentukan tahap tujuan; client tidak mengirim tahap tujuan bebas.
11. Pengembalian wajib menyertakan catatan dan bergerak satu tahap ke belakang melalui perantara.
12. Setelah `TERVALIDASI`, rincian read-only.
13. Master yang sudah digunakan dinonaktifkan, bukan dihapus secara fisik.
14. Rencana penarikan adalah rencana per bulan, bukan catatan pembayaran aktual.
15. Semua laporan, detail, ekspor, dan riwayat mengikuti batas peran dan unit.
16. Audit mencatat pelaku, waktu, aksi, dan perubahan relevan; jangan pernah mencatat password atau token.

---

## 14. Data, API, dan Kontrak Frontend

Framework dan mesin basis data belum dipastikan oleh SDD; jangan mengunci pilihan teknologi dalam dokumen desain ini. Implementasi frontend harus mengikuti kontrak API yang disepakati dengan backend.

Endpoint rancangan dari SDD:

| Method | Endpoint | Tujuan UI |
|---|---|---|
| POST | `/login` | Membuat sesi pengguna |
| POST | `/logout` | Mengakhiri sesi |
| GET | `/master` | Memuat master sesuai izin |
| GET | `/pagu` | Memuat pagu dan saldo yang boleh dilihat |
| POST | `/usulan` | Membuat header draf |
| PUT | `/usulan/{id}/rincian` | Menyimpan item, IKU, dan jadwal pada usulan yang dapat diedit |
| POST | `/usulan/{id}/ajukan` | Validasi final, snapshot, siklus, dan pengiriman tugas |
| POST | `/usulan/{id}/keputusan` | Keputusan pemeriksa/koreksi dengan catatan, siklus, versi, dan request key |
| GET | `/usulan/{id}/riwayat` | Membaca siklus dan riwayat sesuai izin |
| GET | `/laporan/{kode}` | Membaca/mengekspor L01–L11 sesuai filter dan izin |

Endpoint di atas adalah rancangan, bukan jaminan bahwa backend sudah tersedia. Konfirmasi format payload, pagination, error code, dan mekanisme autentikasi sebelum mengintegrasikan UI.

### 14.1 Penanganan response

- `401`: sesi tidak valid/kedaluwarsa; arahkan ke login dengan pesan yang wajar.
- `403`: akses ditolak; tampilkan halaman akses terbatas.
- `404`: data tidak ditemukan atau tidak tersedia bagi pengguna.
- `409`: konflik versi, saldo, atau aksi ganda; muat ulang data yang relevan dan jelaskan tindakan berikutnya.
- `422`: validasi field/item; tandai kontrol terkait.
- `5xx`/network error: pesan gagal, pertahankan isian, sediakan coba lagi.

Gunakan format uang desimal yang konsisten; jangan memakai floating point tak terkontrol untuk perhitungan bisnis di frontend. Nilai resmi dihitung dan diverifikasi server.

---

## 15. Keamanan dan Integritas

- Hak akses divalidasi di server berdasarkan peran, unit, dan tahap aktif.
- Tidak mengandalkan menu tersembunyi atau tombol disabled sebagai kontrol keamanan.
- Jangan menyimpan token/kredensial di log atau menampilkan rahasia pada UI.
- Gunakan HTTPS pada deployment.
- Semua perubahan status, komitmen pagu, snapshot, dan riwayat harus atomik pada backend.
- Gunakan idempotency/request key untuk mencegah aksi ganda; frontend tetap mencegah double-click.
- Bila versi dokumen sudah berubah, tolak submit lama dan minta pengguna memuat data terbaru.
- Jangan mengubah isi snapshot terdahulu ketika master atau draf saat ini berubah.
- Tampilkan data hanya sesuai izin, termasuk ketika membuka detail melalui URL langsung atau mengekspor laporan.

---

## 16. Empty, Loading, Error, dan Feedback

### Empty state

- Belum ada usulan: jelaskan bahwa belum ada usulan untuk filter ini; Operator dapat membuat usulan jika memiliki akses.
- Antrean kosong: “Tidak ada tugas yang perlu ditangani saat ini.”
- Laporan kosong: tampilkan filter aktif dan opsi mengubah filter.
- Grafik kosong: tampilkan pesan, jangan membuat angka nol yang menyesatkan.

### Loading state

- Skeleton untuk kartu, tabel, detail, dan grafik.
- Pada mutasi, label tombol berubah seperti `Menyimpan…`, `Mengajukan…`, atau `Memproses…`.
- Hindari spinner penuh halaman jika hanya satu panel yang dimuat.

### Error/feedback

- Kesalahan validasi: inline dan ringkasan di bagian atas form.
- Pagu tidak cukup: tampilkan pagu, nominal mengikat, sisa terbaru, dan nominal usulan; jangan hanya berkata “Gagal”.
- Konflik saldo: beri tahu bahwa saldo berubah karena aktivitas lain dan minta pengguna memeriksa ulang.
- Gagal ekspor: beri opsi coba lagi.
- Sukses: toast singkat ditambah pembaruan status/halaman yang nyata.

---

## 17. Rekomendasi Struktur Frontend

Struktur ini rekomendasi, sesuaikan dengan framework yang akhirnya dipilih. Pisahkan presentasi, domain, dan komunikasi API.

```text
src/
├── app/                    # bootstrap, router, provider
├── layouts/
│   ├── AppShell
│   └── AuthLayout
├── pages/
│   ├── login
│   ├── dashboard
│   ├── usulan
│   ├── antrean
│   ├── koreksi
│   ├── master
│   ├── pagu
│   ├── iku
│   ├── pengguna
│   ├── laporan
│   └── audit
├── components/
│   ├── layout/
│   ├── data-display/
│   ├── forms/
│   ├── budget/
│   ├── workflow/
│   └── feedback/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── budget-proposals/
│   ├── budget-master/
│   ├── iku/
│   ├── approvals/
│   ├── reports/
│   └── audit/
├── services/               # API client dan endpoint
├── composables-or-hooks/    # state/reusable client logic
├── utils/                   # format rupiah, tanggal, validasi UI
├── types/                   # DTO, role, status, API response
└── styles/                  # design tokens/global styles
```

Pedoman:

- Definisikan enum status/role satu kali dan gunakan di seluruh UI.
- Pisahkan DTO API dari model tampilan bila transformasi diperlukan.
- Hindari duplikasi rumus bisnis di banyak komponen.
- Format uang/tanggal melalui utility terpusat.
- Jangan menanamkan data produksi atau hak akses berdasarkan nama pengguna di frontend.
- Komponen harus dapat diuji secara terpisah.

---

## 18. Kriteria Penerimaan UI

Gunakan daftar ini sebagai checklist review desain dan implementasi.

- [ ] Pengguna melihat dashboard dan menu yang sesuai dengan perannya.
- [ ] Operator hanya dapat melihat data unitnya sendiri.
- [ ] Kartu pagu membedakan nominal pagu, nominal tervalidasi, komitmen berjalan, dan sisa yang dapat diajukan.
- [ ] Form menghitung total item dan total usulan dengan jelas.
- [ ] Setiap item dapat dihubungkan dengan IKU dan kontribusi yang relevan.
- [ ] Jadwal penarikan per bulan tersedia dan ketidaksesuaian jumlah ditandai.
- [ ] Draf dapat disimpan tanpa menghilangkan isian saat validasi gagal.
- [ ] Tombol Ajukan tidak tersedia/aktif bila status atau hak tidak sesuai.
- [ ] Pemeriksaan hanya dapat dilakukan oleh pemilik tahap aktif.
- [ ] Pengembalian mewajibkan catatan.
- [ ] Jalur koreksi menunjukkan tugas perantara dan operator secara jelas.
- [ ] Pengajuan ulang terlihat sebagai siklus baru; snapshot lama tetap dapat dibuka.
- [ ] Usulan tervalidasi tidak dapat diedit melalui form.
- [ ] Semua laporan L01–L11 memiliki akses sesuai SRS, filter relevan, dan ekspor sesuai izin.
- [ ] Loading, empty, error, akses ditolak, konflik versi, dan validasi field dirancang.
- [ ] Tabel dan formulir dapat digunakan di desktop, tablet, dan mobile.
- [ ] Keyboard, fokus, label, kontras, dan pembaca layar diperhatikan.
- [ ] UI tidak menganggap ekspor SAKTI sebagai integrasi API; keluaran awal adalah rekap untuk input manual.

---

## 19. Catatan Validasi Dokumen

Dokumen `SRS_Aplikasi_Usul_Anggaran.docx` dan `SDD_Aplikasi_Usul_Anggaran.docx` secara eksplisit merupakan pasangan spesifikasi Aplikasi Usul Anggaran POLINDRA. Dua berkas lain yang dilampirkan—`Proposal Proyek 3- Kelompok 3_RPL3A.pdf` dan `SRS_Proyek3_Kel3_RPL2A.pdf`—memuat konteks/isi proyek yang berbeda pada bagian-bagian yang terbaca (antara lain forum, agenda, artikel, anggota, dan laporan keuangan). Karena itu, fitur yang bertentangan dari kedua berkas tersebut **tidak dicampurkan** ke rancangan ini. Bila kedua dokumen itu sebenarnya merupakan referensi wajib untuk proyek yang sama, pemilik proyek perlu mengonfirmasi perbedaan ruang lingkup terlebih dahulu.

Keputusan D01–D07 dan kebutuhan bertanda U dalam SRS masih memerlukan validasi pemilik proses, terutama:

- Dimensi pagu dan satuan satu usulan.
- Kapan usulan dianggap mengikat pagu.
- Satuan/rumus kontribusi IKU.
- Hak admin dalam membantu edit usulan.
- Alur pengembalian dan pemeriksaan ulang.
- Format rekap rencana penarikan.
- Keunikan akun di dalam subkomponen.

Desain UI harus membuat aturan tersebut mudah dipahami, tetapi tidak boleh menganggap keputusan yang belum disahkan sebagai kebijakan final.

---

## 20. Arahan Akhir untuk Implementasi

Bangun UI dengan bahasa visual yang dekat dengan referensi BankFlash: sidebar kiri yang konsisten, topbar minimal, kartu putih dengan radius lembut, latar abu-abu kebiruan, tipografi sans-serif modern, tabel bersih, grafik sederhana, dan aksen biru institusional. Terapkan gaya itu pada **workflow penganggaran**, bukan pada fitur perbankan.

Urutan implementasi yang disarankan:

1. App shell, navigasi berbasis peran, login, token visual, dan komponen dasar.
2. Dashboard dengan data API dan empty/loading states.
3. Daftar usulan, detail, status badge, dan timeline siklus.
4. Form usulan dengan rincian item, IKU, rencana penarikan, validasi, dan simpan draf.
5. Antrean pemeriksaan dan jalur koreksi bertingkat.
6. Master hierarki, unit, jenis belanja, pagu, IKU, dan pengguna.
7. Laporan L01–L11, filter, ekspor, audit, dan notifikasi.
8. Review aksesibilitas, responsivitas, keamanan UI, dan uji penerimaan AT01–AT14.

**Hasil yang diharapkan:** aplikasi administrasi anggaran yang terasa profesional, mudah digunakan, transparan, dan konsisten dengan SRS/SDD Aplikasi Usul Anggaran POLINDRA.
