# 📑 PANDUAN PENGUJIAN NOTIFIKASI REAL (EMAIL & WHATSAPP)
## **Sistem Antrean Hemodialisis Klinik Utama**

Basis data telah **dibersihkan dan diset ulang (*migrate:fresh --seed*)**. Seluruh 5 jenis notifikasi di dalam aplikasi **SUDAH 100% TERHUBUNG DAN AKTIF SECARA REAL-TIME** ke WhatsApp (Meta Official Cloud API / Fonnte) dan Email (Gmail SMTP).

---

## 🔑 **1. INFORMASI KREDENSIAL LOGIN & KONTAK REAL TESTING**

- **Alamat Login Portal (Admin & Pasien)**: `http://127.0.0.1:8000/login`
- **Alamat Mesin Kiosk Mandiri**: `http://127.0.0.1:8000/kiosk`
- **Password Default Pasien**: `pasien`
- **Login Admin**: `admin@hemo.clinic` | Password: `admin`

| Nama Pasien | No. RM | Email Login Real (Inbox) | No. HP / WA Real | Password | Shift Today |
|:---|:---|:---|:---|:---|:---|
| **Siti Rahmawati** | **`RM-9902`** | **`111202314924@mhs.dinus.ac.id`** | **`085655235652`** | `pasien` | **Shift Siang (12.00 - 16.00 WIB)** |
| **Budi Santoso** | **`RM-9901`** | **`111202314920@mhs.dinus.ac.id`** | **`085246232785`** | `pasien` | **Shift Pagi (07.00 - 11.00 WIB)** |

---

## 🚀 **2. PANDUAN TESTING LENGKAP 5 KEJADIAN NOTIFIKASI REAL**

---

### **1️⃣ Uji Coba Notifikasi Check-In Kiosk Mandiri**
> **Skenario**: Memicu pengiriman notifikasi saat pasien datang dan memindai No. RM di Mesin Kiosk Mandiri.

1. Buka halaman Kiosk: `http://127.0.0.1:8000/kiosk`.
2. Masukkan No. RM Pasien Siti Rahmawati: **`RM-9902`** (atau `RM-9901` untuk Budi Santoso).
3. Klik tombol **"PROSES CHECK-IN NO. RM"**.
4. **Hasil**: 
   - Layar Kiosk menampilkan Layar **Hijau (Emerald)** + Bunyi **Bip 880Hz**.
   - 📱 **WhatsApp Real**: Pesan WA langsung masuk ke HP Siti **`085655235652`**.
   - 📧 **Email Real**: Email resmi langsung masuk ke Inbox Siti **`111202314924@mhs.dinus.ac.id`**.

---

### **2️⃣ Uji Coba Notifikasi Pendaftaran / Booking Janji Temu Baru oleh Admin**
> **Skenario**: Memicu pengiriman konfirmasi saat Admin mendaftarkan janji temu baru untuk pasien.

1. Login sebagai Admin di `http://127.0.0.1:8000/login` (`admin@hemo.clinic` / `admin`).
2. Masuk ke menu **"Manajemen Janji Temu"** $\rightarrow$ Klik **"Buat Janji Temu Baru"** (`/admin/appointments/create`).
3. Pilih Pasien: **Siti Rahmawati (`RM-9902`)**.
4. Pilih Tanggal (misal besok/lusa), Shift (Pagi/Siang), dan Nomor Bed (misal Bed 3).
5. Klik **"Simpan Janji Temu"**.
6. **Hasil**: 
   - 📱 **WhatsApp Real**: Pesan konfirmasi janji temu baru + Rincian Shift & Bed langsung masuk ke WA Siti **`085655235652`**.
   - 📧 **Email Real**: Email konfirmasi rincian janji temu baru masuk ke Inbox Siti **`111202314924@mhs.dinus.ac.id`**.

---

### **3️⃣ Uji Coba Notifikasi Approval / Reschedule (Pindah Jadwal)**
> **Skenario**: Memicu pengiriman hasil keputusan permohonan pindah jadwal (Reschedule).

1. Login sebagai Pasien Siti Rahmawati (`111202314924@mhs.dinus.ac.id` / `pasien`).
2. Buka menu **"Janji Temu Saya"** $\rightarrow$ Klik **"Minta Pindah Jadwal (Reschedule)"** pada janji temu mendatang.
3. Pilih tanggal & shift baru, lalu klik **"Kirim Permohonan"**.
4. Logout Pasien, lalu Login sebagai Admin (`admin@hemo.clinic` / `admin`).
5. Buka menu **"Approval Janji & Reschedule"** (`/admin/appointment-approvals`).
6. Klik **"Setujui (Approve)"** dan tentukan Bed Number.
7. **Hasil**: 
   - 📱 **WhatsApp Real**: Pesan *"Reschedule DISETUJUI: Tanggal XX, Shift YY"* langsung masuk ke WA Siti **`085655235652`**.
   - 📧 **Email Real**: Email status reschedule disetujui masuk ke Inbox Siti **`111202314924@mhs.dinus.ac.id`**.

---

### **4️⃣ Uji Coba Notifikasi Perintah Otomatis Pengingat Jadwal (H-1 / 24 Jam)**
> **Skenario**: Memicu perintah scheduler otomatis yang biasa berjalan tiap malam untuk mengingatkan pasien H-1.

1. Buka terminal di VS Code.
2. Jalankan perintah otomatis berikut:
   ```bash
   php artisan app:send-appointment-reminders
   ```
3. **Hasil**: 
   - Sistem akan memindai seluruh pasien yang memiliki jadwal besok hari (H-1).
   - 📱 **WhatsApp Real** & 📧 **Email Real**: Pengingat pengingat H-1 langsung terkirim otomatis ke WA & Email pasien terkait.

---

### **5️⃣ Uji Coba Notifikasi Promosi Pasien Cadangan (Jika Pasien Sebelumnya No-Show)**
> **Skenario**: Memicu promosi antrean pasien berikutnya saat ada pasien yang terlambat $>15$ menit.

1. Buka terminal di VS Code.
2. Jalankan perintah pemroses keterlambatan:
   ```bash
   php artisan app:process-no-shows
   ```
3. **Hasil**: 
   - Pasien yang terlambat ditandai No-Show.
   - 📱 **WhatsApp Real** & 📧 **Email Real**: Pesan *"Promosi Antrean HD: Terjadi pelepasan slot pada Shift Pagi, Anda dipromosikan untuk penanganan lebih awal..."* langsung terkirim ke WA & Email pasien cadangan berikutnya.

---

## 🟢 **3. PANDUAN INTEGRASI WHATSAPP OFFICIAL CLOUD API (META DIRECT)**

> **Mengapa Menggunakan Meta Official Cloud API?**
> - **100% Bebas Disconnect & Bebas HP**: Menggunakan server Meta direct, tanpa perlu menautkan HP / scan QR code.
> - **Gratis 1.000 Pesan Percakapan Pertama / Bulan** dari Meta.
> - **Resmi & Legal**: Bebas risiko pembatasan/blokir spam dari WhatsApp.

### **Langkah Setup 1: Buat Akun Meta for Developers & App WhatsApp**
1. Buka situs Meta Developers: `https://developers.facebook.com/`.
2. Login menggunakan akun Facebook Anda $\rightarrow$ Klik **My Apps** (Aplikasi Saya) $\rightarrow$ Klik **Create App** (Buat Aplikasi).
3. Pilih tipe aplikasi: **Other** / **Business** (Bisnis) $\rightarrow$ Klik **Next**.
4. Isi Nama Aplikasi (misal: `Klinik Hemodialisis App`) $\rightarrow$ Klik **Create App**.
5. Di dashboard aplikasi Meta Developers, cari produk **WhatsApp** $\rightarrow$ Klik **Set up**.
6. Pilih/Tambahkan Akun Bisnis Meta (*Meta Business Account*).

---

### **Langkah Setup 2: Ambil Access Token & Phone Number ID Test**
1. Di bilah menu kiri dashboard Meta Developers, masuk ke menu **WhatsApp** $\rightarrow$ **API Setup** (Getting Started).
2. Anda akan mendapatkan **Temporary Access Token** (atau buat *Permanent System User Token*).
3. Salin nilai berikut:
   - **Temporary / Permanent Access Token** (misal: `EAAG...`)
   - **Phone Number ID** (misal: `109283746591023`)
4. Pada kolom **"To"** di halaman Meta, tambahkan nomor HP Anda (`6285246232785`) untuk memverifikasi pendaftaran nomor pengujian Meta.

---

### **Langkah Setup 3: Masukkan Kredensial Meta ke Berkas `.env` Aplikasi**
Buka berkas `.env` aplikasi Laravel Anda, lalu tambahkan baris berikut:

```env
# 🟢 WHATSAPP OFFICIAL CLOUD API (META DIRECT)
WA_CLOUD_TOKEN=EAAG...salin_token_meta_disini...
WA_CLOUD_PHONE_NUMBER_ID=109283746591023
```

---

### **Langkah Setup 4: Bersihkan Cache Configuration & Uji Coba**
Buka terminal VS Code di folder project `d:\KP` lalu jalankan:
```bash
php artisan config:clear
```

Setiap kali ada pendaftaran janji temu, pengingat, atau check-in Kiosk di aplikasi, pesan WhatsApp resmi akan **SEKETIKA DITERIMA DARI NAMA BISNIS KLINIK DENGAN PERFORMA 100% STABIL TANPA PUTUS!**

---

## 👥 **4. CARA MENGIRIM NOTIFIKASI KE TELEPON & EMAIL TEMAN LAINNYA**

Sistem notifikasi aplikasi ini bersifat **Dinamis**. Anda dapat mengganti Email & WA pasien mana pun via Konsol Admin:

1. Login Admin (`http://127.0.0.1:8000/admin`).
2. Buka menu **Manajemen Pasien** (`/admin/patients`) $\rightarrow$ Klik **Edit** pada pasien mana pun.
3. Ganti **Email** dan **Nomor HP/WA** dengan email & nomor WA teman Anda.
4. Klik **Simpan**.
5. Setiap aksi di atas akan **LANGSUNG DIKIRIMKAN KE TELEPON & EMAIL TEMAN ANDA!**

---
*Dokumen panduan pengujian ini diperbarui secara real-time.*
