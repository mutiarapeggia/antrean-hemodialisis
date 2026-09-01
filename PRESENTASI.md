# 📊 Panduan & Draft Isi Slide Presentasi Akhir (Final Presentation Deck)
## Sistem Antrean & Penjadwalan Pasien Hemodialisis (HEMOQUEUE)

Dokumen ini disusun sebagai **panduan komprehensif, padat, dan terstruktur** untuk presentasi akhir ke Mentor. Materi ini melengkapi slide yang sudah Anda buat dengan menambahkan **Latar Belakang/Masalah, Workflow Lengkap (Admin, Reschedule, Monitor), Keamanan & Pengujian, serta Kesimpulan.**

---

## 📌 Evaluasi Isi PPT Saat Ini & Rekomendasi Penambahan

### ✅ Yang Sudah Sangat Bagus di PPT Anda:
1. **Slide 1 (Cover)**: Judul & deskripsi singkat sistem sudah profesional dan jelas.
2. **Slide 2 (Tim Pengembang)**: Pembagian peran (PM, FE, BE) sudah tercantum dengan foto tim.
3. **Slide 3 (Tech Stack & Arsitektur)**: Diagram ERD relasi tabel dan poin teknologi sudah lengkap.
4. **Slide 4 (Pembagian Jobdesk)**: Detail tugas teknis masing-masing peran (PM, FE, BE) sudah sangat spesifik.
5. **Slide 5 (Workflow 1 - Pasien Kiosk)**: Visualisasi Kiosk dan penjelasan alur pasien sudah menarik.

### 💡 Yang Masih Kurang & Perlu Ditambahkan (Agar Presentasi 100% Sempurna):
1. **Latar Belakang & Masalah Operasional Unit Hemodialisis** (Menjelaskan *mengapa* aplikasi ini dibangun).
2. **Workflow Alur Admin** (Approval, Standalone Shift Bed Grid 1-10, & Emergency Override).
3. **Workflow Alur Reschedule, Auto No-Show, & TV Monitor Real-Time**.
4. **Keandalan & Proteksi Sistem** (Pengujian 89 Automated Tests, Concurrency Locking `lockForUpdate`, Enkripsi HMAC SHA-256 QR Code, & WIB Timezone).
5. **Kesimpulan & Rencana Pengembangan Masa Depan (Future Roadmap)** (Integrasi SIMRS / BPJS Antrean Online).

---

## 🖥️ Struktur Naskah & Isi Slide Presentasi (10 Slide Sempurna)

```
SLIDE 1 : Cover Project (Judul & Ringkasan Aplikasi)
SLIDE 2 : Tim Pengembang & Peran Utama (PM, FE, BE)
SLIDE 3 : Latar Belakang & Permasalahan Klinik Hemodialisis
SLIDE 4 : Solusi & Fitur-Fitur Unggulan Sistem (Value Proposition)
SLIDE 5 : Tech Stack & Arsitektur Sistem (ERD & Infrastruktur)
SLIDE 6 : Rincian Pembagian Jobdesk & Kontribusi Spesifik Tim
SLIDE 7 : Workflow Utama 1 — Alur Pasien (Check-In Mandiri Kiosk & QR Code)
SLIDE 8 : Workflow Utama 2 — Alur Admin (Approval, Standalone Shift Bed Grid & Emergency Override)
SLIDE 9 : Workflow Utama 3 — Reschedule H-1, Auto No-Show & TV Monitor Real-Time
SLIDE 10: Pengujian, Keamanan, Performa & Kesimpulan Penutup
```

---

### 📄 SLIDE 1: Cover Project
- **Judul Utama**: SISTEM ANTREAN & PENJADWALAN PASIEN HEMODIALISIS (HEMOQUEUE)
- **Sub-judul**: Internship Report & Final Project Defense
- **Deskripsi Ringkas**:  
  Aplikasi web *Smart Healthcare Queue System* yang dirancang untuk mengoptimalkan operasional Unit Hemodialisis klinik/rumah sakit melalui check-in mandiri QR Code Kiosk (< 10ms response), penjadwalan presisi 2 shift, relokasi bed darurat otomatis, serta notifikasi asinkron multi-channel (WhatsApp & Email).

---

### 📄 SLIDE 2: Tim Pengembang & Peran Utama
- **Tatacherda Zeblanov S** — *Project Manager*
  - Analisis alur klinis 2 shift, penetapan toleransi check-in 15 menit, perancangan relokasi bed darurat, dan koordinasi kebutuhan klinik.
- **Mutiara Peggia S. P** — *Frontend Developer*
  - Pembangunan SPA React 18 & Inertia.js, integrasi Html5Qrcode Scanner dengan hardware teardown, visualisasi Grid Bed, dan Monitor Antrean Real-Time.
- **Syafiqa Zahroo** — *Backend Developer*
  - Pengembangan API Laravel 11, proteksi locking concurrency (`lockForUpdate`), HMAC QR Code Generator, Async Notification Engine, dan 89 Unit/Feature Tests.

---

### 📄 SLIDE 3: Latar Belakang & Permasalahan Operasional Klinik *(TAMBAHAN BARU)*
- **Tantangan Operasional di Unit Hemodialisis**:
  1. **Penumpukan Antrean Fisik**: Pasien hemodialisis harus cuci darah 2-3 kali seminggu; antrean manual memicu kerumunan di ruang tunggu.
  2. **Batas Kapasitas Bed & Shift**: Setiap unit memiliki kapasitas bed terbatas (misal 10 Bed) dengan jadwal ketat 2 Shift (Pagi: 07.00–11.00 WIB & Siang: 12.00–16.00 WIB).
  3. **Risiko Bentrok & Pasien Darurat (Cito)**: Sering terjadi bentrok slot bed saat pasien emergency/kritis membutuhkan bed yang sudah terisi pasien reguler.
  4. **Tingkat Ketidakhadiran (No-Show)**: Pasien yang terlambat/tidak hadir tanpa konfirmasi menghambat keterisian bed untuk pasien antrean berikutnya.

---

### 📄 SLIDE 4: Solusi & Fitur-Fitur Unggulan Sistem *(TAMBAHAN BARU)*
- **Solusi Pintar HEMOQUEUE**:
  1. **Kiosk Check-In Mandiri QR Code**: Pasien scan tiket QR Code / No. RM di Kiosk tanpa perlu mengantre di loker pendaftaran.
  2. **Standalone Shift Bed Grid (Bed 1–10)**: Visualisasi ketersediaan 10 Bed secara real-time untuk Shift Pagi & Siang bagi Admin.
  3. **Emergency Override & Relokasi Bed Otomatis**: Pasien darurat medis diprioritaskan, pasien reguler otomatis dipindahkan ke Bed lain yang kosong.
  4. **Auto-Sync No-Show & Promosi Antrean**: Otomatisasi pembatalan jadwal jika terlambat >15 menit & mempromosikan pasien antrean berikutnya.
  5. **TV Monitor Antrean Real-Time (`/monitor`)**: Display antrean klinik dengan indikator status kehadiran & panggilan tindakan.

---

### 📄 SLIDE 5: Tech Stack & Arsitektur Sistem
- **Backend Framework**: Laravel 11 (PHP 8.2+) dengan ORM Eloquent & Monolith-SPA Inertia.js Bridge.
- **Frontend Framework**: React 18, Tailwind CSS, Lucide React Icons.
- **Integrasi & Hardware**: Kamera/Scanner Kiosk (Html5Qrcode API), Fonnte WhatsApp Gateway API, SMTP Mailer.
- **Keandalan & Pengujian**: 89/89 Tests Passed (100% Success) via PHPUnit/Pest, Timezone locked to `Asia/Jakarta` (WIB).
- **Basis Data & Relasi Utama**: Skema database terstruktur (`users`, `patients`, `appointments`, `check_ins`, `master_beds`, `reschedule_requests`, `announcements`, `audit_logs`).

---

### 📄 SLIDE 6: Pembagian Jobdesk & Kontribusi Spesifik Tim
- **Project Manager (Tatacherda)**:
  - Merumuskan spesifikasi operasional 2 Shift (Pagi 07.00–11.00 & Siang 12.00–16.00 WIB) dengan batas toleransi +15 menit.
  - Menyusun aturan Emergency Override dan mekanik relokasi otomatis pasien reguler ke bed kosong terdekat (Bed 1–10).
  - Menyusun kriteria restriksi tiket QR Code saat pengajuan reschedule berstatus pending approval.
- **Frontend Developer (Mutiara)**:
  - Merancang UI Kiosk Mandiri, Monitor Antrean Real-Time (`/admin/queue`), dan Shift Grid Visual (`/admin/appointments`).
  - Mengatasi masalah kamera terkunci pada Kiosk via pembersihan stream media hardware (`track.stop()`) dan proteksi mounting debounce.
  - Menyempurnakan UX filter dropdown presisi dan banner info Empty State Grid.
- **Backend Developer (Syafiqa)**:
  - Mencegah bentrok bed dengan penguncian transaksi database (`lockForUpdate`).
  - Mengamankan tiket janji temu menggunakan enkripsi QR token HMAC SHA-256.
  - Mengoptimalkan respon Kiosk (< 10ms) melalui notifikasi asinkron latar belakang.
  - Memvalidasi keandalan sistem dengan 89 automated tests (100% lulus).

---

### 📄 SLIDE 7: Workflow Utama 1 — Alur Pasien (Check-In Mandiri Kiosk)
- **Tahapan Alur**:
  1. Pasien tiba di klinik ➔ Scan Tiket QR Code di Kiosk / Ketik No. RM.
  2. Sistem memvalidasi tanggal & shift ➔ Respon layar instan < 10ms menampilkan Nomor Bed & Status Kedatangan (On-Time / Terlambat).
  3. Notifikasi bukti check-in terkirim otomatis ke WhatsApp & Email pasien.
- **Proteksi Kiosk**:
  - Restriksi *Future Ticket* (Ditolak jika scan sebelum Hari H).
  - Restriksi *Expired Ticket* (Ditolak jika scan tanggal lalu).
  - Restriksi *Shift Mismatch* & *Shift Ended* (Badge Merah jika scan di luar jam shift).
  - Proteksi *Double Check-In* (Menolak scan 2x di hari yang sama).

---

### 📄 SLIDE 8: Workflow Utama 2 — Alur Admin (Approval, Shift Grid & Emergency Override) *(TAMBAHAN BARU)*
- **Tahapan Alur Admin**:
  1. **Menu Approvals (`/admin/approvals`)**: Admin meninjau pendaftaran baru & permohonan reschedule ➔ Alokasi nomor Bed (Bed 1–10) ➔ Setujui / Tolak.
  2. **Standalone Shift Bed Grid (`/admin/appointments`)**: Tampilan visual murni Grid Bed 1–10 untuk Shift Pagi & Siang dengan filter Tanggal & Shift.
  3. **Direct Bed Card Actions**: Admin dapat mengedit ✏️, membatalkan 🚫, atau menghapus 🗑️ janji temu langsung dari kartu Bed.
  4. **Emergency Override (Kasus Darurat Medis)**:
     - Jika Bed terisi pasien reguler, centang *Emergency Override*.
     - Sistem menerima pasien darurat di Bed tersebut (Badge Merah kedip `EMERGENCY`).
     - Pasien reguler otomatis dipindahkan (*relocated*) ke Bed kosong lain.

---

### 📄 SLIDE 9: Workflow Utama 3 — Reschedule H-1, Auto No-Show & TV Monitor *(TAMBAHAN BARU)*
- **Fitur Lanjutan**:
  1. **Pengajuan Reschedule (Rule H-1)**: Pasien dapat mengajukan permohonan ubah jadwal H-1 (ditolak jika diajukan pada Hari H / tanggal lalu).
  2. **Real-time Auto-Sync No-Show**:
     - Jika jam toleransi shift sudah lewat (>15 menit / shift berakhir) dan pasien belum check-in:
     - Status janji temu di DB & portal pasien otomatis ter-sync menjadi **`NO-SHOW`** (Badge Warna Ungu).
  3. **Display TV Monitor Antrean (`/monitor`)**:
     - Menampilkan antrean aktif per perawat/bed.
     - Pasien *Emergency Override* otomatis ditempatkan pada **posisi urutan paling atas (#1 Top Priority)**.

---

### 📄 SLIDE 10: Pengujian, Keamanan & Kesimpulan Penutup *(TAMBAHAN BARU)*
- **Keandalan & Pengujian**:
  - **89/89 Tests Passed (100% Success)**: Menguji seluruh modul (Auth, Booking, Approval, Reschedule, Emergency Override, Kiosk, & Notifications).
  - **Concurrency Safety**: Transaksi check-in & booking terproteksi dari *race condition* via DB Transaction & `lockForUpdate()`.
  - **Timezone Integrity**: Penguncian zona waktu ke `Asia/Jakarta` (WIB) & format serialisasi tanggal ISO-Clean (`Y-m-d`) bebas bug date-shift.
- **Kesimpulan Akhir**:
  - Aplikasi **HEMOQUEUE** siap diimplementasikan (*Production Ready*) untuk meningkatkan efisiensi operasional Unit Hemodialisis, menghilangkan kerumunan fisik, dan mempercepat alur pelayanan medis.
- **Rencana Masa Depan (Future Roadmap)**:
  - Integrasi API SIMRS Rumah Sakit & Bridging Antrean Online BPJS Kesehatan.

---

## 🎯 Tips Presentasi di Depan Mentor:
1. **Buka dengan Percaya Diri**: Tekankan bahwa project ini bukan sekadar tugas web biasa, melainkan sistem klinis yang menyelesaikan **masalah nyata di Unit Hemodialisis**.
2. **Tunjukkan Metrik Kunci**: Sebutkan angka respon Kiosk **< 10ms**, **89 Automated Tests (100% Pass)**, dan **10 Bed 2-Shift Grid**.
3. **Demo Alur Cepat**: Tunjukkan alur Pasien Booking ➔ Admin Approve ➔ Scan QR di Kiosk ➔ Terlihat di Monitor Antrean.
