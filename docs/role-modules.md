# Modul lanjutan SIPADU

Semua halaman mengikuti `design.md`, memakai logo `src/assets/POLINDRA.png`, sidebar bersama, dan navbar fixed. Data hanya bertahan selama aplikasi terbuka; refresh/logout mengembalikan fixture. Angka tambahan lintas unit adalah data contoh yang dihitung dari `src/features/governance/demo.js`.

## Halaman dan akses

| URL hash | Isi | Peran utama |
|---|---|---|
| `#/dashboard` | Dashboard sesuai peran: persetujuan dan ringkasan TI untuk Kajur; target IKU, verifikasi lintas unit dan memo untuk SAKIP | Pimpinan Unit, SAKIP |
| `#/dashboard-eksekutif` | Pagu makro, target IKU, antrean KPA, validasi/kembalikan terpilih | KPA; Admin baca saja |
| `#/formulir-usulan` | Item, MAK, IKU, jadwal 12 bulan, simpan draf, ajukan | Operator |
| `#/antrean-koreksi` | Jalur mundur, catatan, riwayat, snapshot, revisi | Sesuai tahap aktif |
| `#/laporan` | Pemilih L01–L11, filter, CSV, salin rekap manual, cetak/PDF contoh | Semua peran, pilihan kode sesuai SRS |
| `#/master-anggaran` | Hierarki 7 tingkat, tambah akun/subkomponen, ubah dan nonaktifkan | Admin; Operator hanya tambah |
| `#/unit-kerja` | Unit, pimpinan, klasifikasi belanja | Admin |
| `#/pagu-iku` | Pagu per sumber, validasi saldo, target 8 IKU, riwayat | Semua baca; Admin kelola |
| `#/pengguna` | Akun, peran, unit, status aktif, matriks RBAC | Admin |
| `#/audit-aktivitas` | Waktu WIB/ISO, filter modul/peran/tanggal, rincian perubahan, CSV | Admin, SPI, KPA |

Operator dan Pimpinan dibatasi pada TI. SAKIP, SPI, KPA, dan Admin membaca data lintas unit. Admin tidak memperoleh hak persetujuan. Pemilihan role login adalah simulasi, bukan otorisasi produksi.

## Skenario mencoba

- Masuk sebagai Pimpinan atau SAKIP. Dashboard Ringkasan otomatis mengikuti peran. Menu duplikat persetujuan Kajur dan verifikasi SAKIP dihapus; tautan lamanya diarahkan ke dashboard. Kajur hanya menyetujui usulan TI pada tahap Pimpinan, sedangkan SAKIP memverifikasi antrean tahap SAKIP lintas unit. Keputusan memperbarui data bersama dan audit.
- Pada dashboard SAKIP, gabungkan filter unit, sumber dana, IKU, serta pencarian navbar. Memo disimpan selama sesi aplikasi dan tercatat sebagai aktivitas contoh. Pada dashboard Kajur, Rekapitulasi Unit membuka laporan L02.
- Masuk sebagai Operator menggunakan email valid dan sembarang kata sandi pada mode demo. Antrean Koreksi → Perbaiki & Ajukan Ulang. Pilih IKU dan kontribusi setiap item, isi catatan revisi, lalu ajukan. Siklus 2 dimulai pada Pimpinan; siklus 1 tetap tersedia di detail pemeriksaan.
- Masuk sebagai SAKIP. Pilih koreksi `USL/2027/TI/010`, lalu teruskan catatan ke Pimpinan. Item tidak dapat diedit. Setelah diteruskan Pimpinan ke Operator, komitmen dilepaskan.
- Masuk sebagai KPA. Dashboard Eksekutif memiliki enam usulan contoh. Pilih usulan, tinjau, lalu validasi akhir atau kembalikan dengan catatan wajib. Keputusan memperbarui ringkasan, antrean, laporan, dan audit.
- Masuk sebagai Admin. Tambah atau ubah akun/unit/MAK, nonaktifkan referensi, ubah plafon, atau ubah target IKU. Kode duplikat ditolak. Pengurangan pagu di bawah nilai terikat ditolak. Perubahan tampil di audit.

## Batas simulasi

- Dashboard Kajur membagi plafon sub-unit secara ilustratif; total tetap mengikuti alokasi unit. Dashboard SAKIP menampilkan target tahunan contoh, bukan capaian aktual. Pemetaan IKU fixture diberi label contoh; pengajuan yang memiliki snapshot menggunakan pemetaan itemnya.
- Formulir contoh terikat kegiatan TI `2144.QMA.002` dan subkomponen `051.A`. Akun harus aktif dan sesuai subkomponen; total berasal dari volume × harga. Draf boleh belum lengkap.
- Pengajuan memeriksa saldo terbaru per unit/kegiatan/tahun/sumber, rencana IKU positif, total kontribusi terhadap target contoh, dan keseimbangan jadwal setiap item. BOPTN dan PNBP tidak disatukan.
- Definisi kontribusi persen adalah konfigurasi dummy; pemilik proses perlu mengesahkan satuan/metode produksi. Referensi awal yang belum punya pemetaan ditandai belum dipetakan.
- Dokumen PDF/ZIP hanya divalidasi ukuran/ekstensinya dan disimpan nama berkasnya. Tidak ada unggah server. SBM tetap memerlukan tinjauan manual.
- Ekspor spreadsheet berupa CSV, PDF melalui dialog cetak browser. Tidak ada SK resmi, tanda tangan digital, LDAP, ledger permanen, hash terverifikasi, atau sinkronisasi SAKTI.

## Verifikasi

`npm run lint`, `npm run build`, dan `npm test`.

Uji workflow mencakup jalur koreksi bertingkat, pelepasan komitmen di Operator, snapshot tidak ditimpa, siklus baru, pembatasan peran, saldo terpisah, jadwal/IKU/akun tidak valid, serta penguncian setelah validasi KPA.
