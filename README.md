# Antrean Hemodialisis — Smart Hemodialysis Appointment & Queue Management System

Smart Hemodialysis Appointment & Queue Management System berbasis Laravel monolith dengan React + Inertia dan PostgreSQL.

## Fitur Utama
- **Manajemen Pasien**: CRUD profil pasien, riwayat medis, dan impor/ekspor CSV.
- **Penjadwalan Janji Temu**: Kalender shift (Pagi/Siang), deteksi konflik double booking, dan QR HMAC.
- **Kiosk QR Check-in**: Interface layar sentuh ramah lansia (WCAG 2.1 AA, target sentuh >= 48px). Aturan waktu: <= 15 menit on-time, > 15 menit No Show + promosi pasien berikutnya via email SMTP.
- **Permintaan Reschedule (H-1)**: Pasien dapat mengajukan jadwal ulang hingga 1 hari sebelumnya dengan persetujuan admin.
- **Pengumuman & Obat**: Manajemen daftar obat pasien & informasi pengumuman klinik.

## Persyaratan Sistem
- PHP >= 8.2 (extensions: pdo, pdo_pgsql / pdo_sqlite)
- Node.js >= 18
- Composer >= 2.5
- PostgreSQL / SQLite

## Panduan Instalasi Lokal

```bash
# 1. Clone repository
git clone <repo_url> antrean-hemodialisis
cd antrean-hemodialisis

# 2. Install PHP & Node dependencies
composer install
npm install

# 3. Environment configuration
cp .env.example .env
php artisan key:generate

# 4. Run database migrations & seeders
php artisan migrate:fresh --seed

# 5. Run development servers
npm run dev
php artisan serve
```

## Akun Demo Default (Seeder)

- **Admin**: `admin@hemo.clinic` | Password: `password123`
- **Pasien 1**: `budi.santoso@example.com` | Password: `password123`
- **Pasien 2**: `siti.rahma@example.com` | Password: `password123`
- **Pasien 3**: `ahmad.hidayat@example.com` | Password: `password123`

## Pengujian Otomatis

```bash
php artisan test
```
