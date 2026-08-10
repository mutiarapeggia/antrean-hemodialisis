# Release Notes — Antrean Hemodialisis v1.0 (Production Ready)

**Tanggal Rilis**: 2026-08-10  
**Versi**: v1.0.0-final  
**Platform**: Laravel 12 Monolith + Inertia.js (React) + Tailwind CSS + PostgreSQL / SQLite  

---

## 🚀 Fitur Utama Rilis v1.0

### 1. Fondasi Sistem & Keamanan (Sprint 0 & 1)
- **Role-Based Access Control (RBAC)**: Pemisahan portal Admin (`/admin/dashboard`) dan Pasien (`/patient/dashboard`) dengan middleware `EnsureUserHasRole`.
- **Manajemen Pasien Complete**: CRUD profil pasien, filter pencarian (Nama, No RM, Phone), toggle status aktif, impor CSV bulk, dan ekspor CSV.

### 2. Penjadwalan Janji Temu & Kode QR (Sprint 2)
- **Grid Kalender Shift**: Penjadwalan Shift Pagi (07:00-11:00) dan Shift Siang (12:00-16:00) dengan alokasi nomor bed.
- **Deteksi Konflik Slot**: Pencegahan otomatis double booking bed pada shift dan tanggal yang sama.
- **Override Slot Darurat**: Fasilitas penanganan pasien darurat oleh admin.
- **Opsi Janji Temu Berulang (Recurring)**: Pembuatan otomatis jadwal mingguan untuk pasien hemodialisis reguler.
- **Kode QR HMAC SHA-256**: Generasi token unik berenkripsi HMAC untuk setiap janji temu.

### 3. Kiosk Touchscreen Check-In & Aturan No-Show (Sprint 3)
- **Antarmuka Kiosk Touchscreen**: Desain aksesibel (font besar, target sentuh ≥48px, WCAG 2.1 AA) di `/kiosk`.
- **Aturan Keterlambatan ≤15 Menit**: Validasi timestamp otomatis. Tepat waktu ≤15 menit -> status `checked-in`. Terlambat >15 menit -> status `no-show`, slot dilepas, dan promosi otomatis ke pasien berikutnya.

### 4. Mesin Pengingat Email & Permintaan Reschedule H-1 (Sprint 4)
- **Command Artisan Scheduler**: Automated cron pengiriman email pengingat 24 jam & 1 jam sebelum jadwal (`hemo:send-reminders`).
- **Command Artisan Processing No-Show**: Automated cron pemroses keterlambatan no-show (`hemo:process-noshows`).
- **Permintaan Reschedule Pasien (H-1)**: Pasien dapat mengajukan ubah jadwal hingga H-1 dengan review persetujuan/penolakan oleh Admin.

### 5. Monitor Antrean Real-Time, Pengumuman & Obat (Sprint 5)
- **Real-Time Queue Monitor**: Tampilan antrean real-time hari ini dengan estimasi waktu tunggu dinamis per pasien.
- **Aksi Admin Manual**: Tombol "Tandai Pasien Tiba" dan "Trigger No-Show Manual" dengan alur promosi otomatis.
- **Pencatatan Audit Log Event**: Audit trail lengkap untuk seluruh aktivitas sistem.
- **CRUD Pengumuman Klinik**: Manajemen informasi operasional klinik & feed pengumuman pasien.
- **CRUD Obat Pasien & Pengaitan Janji Temu**: Pengelolaan resep obat rutin & pengaitan ke janji temu hemodialisis.

---

## 🧪 Hasil Pengujian & Quality Assurance

- **Unit & Feature Tests**: **63/63 PASS (100% SUCCESS RATE)**
- **Code Coverage**: Modul Auth, Pasien, Penjadwalan, Kiosk, Reschedule, Notifikasi, Queue, Pengumuman, dan Obat teruji secara otomatis.

---

## 🛠️ Langkah Deployment VPS Staging / Production

1. Clone repository ke VPS Ubuntu 22.04:
   ```bash
   git clone <repo_url> /var/www/antrean-hemodialisis
   cd /var/www/antrean-hemodialisis
   ```

2. Configuration & Dependencies:
   ```bash
   composer install --no-dev --optimize-autoloader
   npm ci && npm run build
   cp .env.example .env
   php artisan key:generate
   ```

3. Database & Supervisor Worker Setup:
   ```bash
   php artisan migrate --force
   php artisan db:seed --force
   ```

4. Setup Cron Job (`crontab -e`):
   ```cron
   * * * * * cd /var/www/antrean-hemodialisis && php artisan schedule:run >> /dev/null 2>&1
   ```
