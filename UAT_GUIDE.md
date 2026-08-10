# User Acceptance Test (UAT) Guide — Antrean Hemodialisis

Panduan pengujian penerimaan pengguna (UAT) untuk sistem Smart Hemodialysis Appointment & Queue Management.

---

## Kredensial Pengujian UAT

### Role Admin / Staf Klinik
- **URL Login**: `/login`
- **Email**: `admin@hemo.clinic`
- **Password**: `password123`

### Role Pasien
- **Pasien 1**: `budi.santoso@example.com` | Password: `password123` | RM: `RM-202607-001`
- **Pasien 2**: `siti.rahma@example.com` | Password: `password123` | RM: `RM-202607-002`
- **Pasien 3**: `ahmad.hidayat@example.com` | Password: `password123` | RM: `RM-202607-003`

---

## Skenario Pengujian UAT

### Skenario 1: Manajemen Pasien & Impor/Ekspor CSV
1. Login sebagai Admin.
2. Navigasi ke menu **Manajemen Pasien**.
3. Cari pasien dengan kata kunci `Budi` atau No RM `RM-202607-001`.
4. Klik **Tambah Pasien** dan isi data pasien baru.
5. Uji tombol **Ekspor CSV** untuk mengunduh daftar pasien.
6. Uji modal **Impor CSV** dengan memilih file CSV sampel.

### Skenario 2: Penjadwalan & Konflik Bed/Shift
1. Navigasi ke **Janji Temu & Shift Grid**.
2. Pilih tanggal besok, Shift Pagi, Bed #1.
3. Buat janji temu untuk Budi Santoso.
4. Coba buat janji temu kedua pada tanggal, shift, dan Bed #1 yang sama tanpa centang Darurat. Sistem harus menolak karena konflik double-booking.
5. Centang **Slot Darurat Override**, buat ulang. Sistem mengizinkan override slot darurat.

### Skenario 3: Check-In Kiosk & Penanganan No-Show
1. Buka URL Kiosk di `/kiosk`.
2. Masukkan kode QR token atau No RM `RM-202607-001`.
3. Jika waktu ≤15 menit dari jadwal mulai → Layar menampilkan **Check-In Berhasil** (Hijau) & status berubah menjadi `checked-in`.
4. Jika waktu >15 menit keterlambatan → Layar menampilkan **Terlambat / No-Show** (Merah), slot dilepas, dan pasien berikutnya dalam antrean dipromosikan via email.

### Skenario 4: Permintaan Reschedule (H-1) Pasien & Persetujuan Admin
1. Login sebagai Pasien (`budi.santoso@example.com`).
2. Masuk ke **Janji Temu Saya** → Klik **Minta Reschedule**.
3. Pilih tanggal H+2 dan Shift Siang, isi alasan reschedule.
4. Login kembali sebagai Admin → Masuk ke **Permintaan Reschedule**.
5. Klik **Setujui**. Sistem memindahkan jadwal ke tanggal baru & melepaskan slot lama.

### Skenario 5: Antrean Real-Time, Manual Action & Audit Log (Sprint 5)
1. Login sebagai Admin → Navigasi ke **Monitor Antrean**.
2. Lihat daftar antrean real-time hari ini beserta perhitungan estimasi waktu tunggu (`~15 menit`, `~30 menit`).
3. Uji tombol **Tandai Tiba** untuk pasien `scheduled`. Status berubah menjadi `checked-in` dan log audit tercatat.
4. Uji tombol **Trigger No-Show** untuk pasien terdaftar. Slot dilepas, pasien berikutnya menerima email promosi, dan log audit tercatat.
5. Pindah ke tab **Log Audit Event Sistem** untuk melihat riwayat aktivitas.

### Skenario 6: Pengumuman Klinik & Obat Pasien
1. Admin membuka menu **Pengumuman Klinik** → Buat pengumuman baru (contoh: "Operasional Hari Libur").
2. Pasien login dan mengecek halaman **Pengumuman Klinik** → Pengumuman baru tampil di feed.
3. Admin membuka menu **Manajemen Obat** → Tambah resep obat `Erythropoietin (EPO) 4000 IU` untuk Budi Santoso.
