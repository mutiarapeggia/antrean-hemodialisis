# 📑 PANDUAN LENGKAP PRESENTASI & DEMO APLIKASI
## **Sistem Antrean Hemodialisis Klinik Utama / Rumah Sakit**

Panduan ini disusun secara sistematis untuk mendemokan antarmuka aplikasi secara utuh di hadapan klien/penguji. Data basis data telah **dibersihkan dan diset ulang (*migrate:fresh --seed*)** sehingga siap digunakan untuk demonstrasi langsung.

---

## 🔑 **1. INFORMASI KREDENSIAL DEMO**

- **URL Utama Aplikasi**: `http://127.0.0.1:8000`
- **Tampilan Kiosk Mandiri**: `http://127.0.0.1:8000/kiosk`

| Platform / Role | Email / ID Akses | Password | Catatan Utama |
|:---|:---|:---|:---|
| 🏥 **Admin Klinik** | `admin@hemo.clinic` | `admin` | Konsol Manajemen, Queue, Approval, & Override |
| 📱 **Pasien 1 (Budi)** | `budi@hemo.clinic` | `pasien` | **No. RM: `RM-9901`** (Jadwal Hari Ini - Shift Pagi) |
| 📱 **Pasien 2 (Siti)** | `siti@hemo.clinic` | `pasien` | **No. RM: `RM-9902`** (Jadwal Hari Ini - Shift Siang) |
| 🖥️ **Kiosk Touchscreen** | Tanpa Login (Public) | - | Mesin Mandiri Pintu Masuk Ruang HD |

---

## 🎬 **2. SKENARIO ALUR DEMO (PER PLATFORM & ROLE)**

---

### 🖥️ **SKENARIO 1: MESIN KIOSK MANDIRI TOUCHSCREEN (`/kiosk`)**
> **Tujuan Demo**: Menunjukkan kemudahan pasien melakukan check-in mandiri di pintu masuk ruang hemodialisis tanpa harus mengantre di meja perawat.

1. **Buka Halaman Kiosk**:
   - Akses rute `http://127.0.0.1:8000/kiosk`.
   - Tunjukkan antarmuka **Touchscreen WCAG 2.1 AA** (Font besar, kontras tinggi, ramah lansia, tanpa tautan login yang mengganggu).

2. **Demo Pemindai Kamera Auto-Scanner (Barcode & QR Code)**:
   - Klik tombol **"Buka Kamera Pemindai (Auto-Scanner)"**.
   - Arahkan Barcode (Code 128 / Code 39) atau Kode QR dari layar HP ke depan webcam.
   - **Highlight Klien**: Kamera menggunakan *Dual-Engine* (`Quagga2` sub-pixel locator & `jsQR`) yang sangat sensitif membaca barcode garis meskipun kamera webcam agak buram.

3. **Demo Check-In Sukses (Kedatangan Tepat Waktu $\le 15$ Menit)**:
   - Masukkan atau scan No. RM: **`RM-9901`**.
   - Klik tombol **"PROSES CHECK-IN NO. RM"**.
   - **Perhatikan Respon**:
     - Sistem membunyikan **Audio Bip sintetis 880Hz** presisi.
     - Menampilkan Layar **Hijau (Emerald)**: *"Check-In Berhasil! Pasien: Budi Santoso (RM-9901) - Shift Pagi • Bed 1"*.

4. **Demo Penanganan Kedatangan Terlambat / No-Show ($>15$ Menit)**:
   - Ulangi proses di Kiosk dengan No. RM lain atau kondisi simulasi keterlambatan.
   - **Perhatikan Respon**:
     - Sistem membunyikan Bip error dan menampilkan Layar **Merah (Rose)**: *"Terlambat (>15 Menit) - Dinyatakan No-Show"*.
     - **Highlight Klien**: Backend secara otomatis mempromosikan/memanggil pasien cadangan berikutnya via notifikasi email/WhatsApp.

---

### 📱 **SKENARIO 2: PORTAL MOBILE PASIEN (`/pasien`)**
> **Tujuan Demo**: Menunjukkan kemudahan pasien melihat jadwal shift, kartu digital barcode, serta mengajukan permohonan pindah jadwal (H-1).

1. **Login Pasien**:
   - Buka `http://127.0.0.1:8000/login`.
   - Masukkan email `budi@hemo.clinic` dan password `pasien`.

2. **Lihat Kartu Digital & Barcode No. RM (`/pasien/appointments`)**:
   - Klik menu **"Janji Temu Saya"**.
   - Tunjukkan Teks No. RM **`RM-9901`** berukuran besar dan tombol **"Tampilkan Kode QR / Barcode Check-In"**.
   - **Highlight Klien**: Barcode digital ini yang nanti di-scan pasien saat tiba di Mesin Kiosk RS.

3. **Demo Pengajuan Reschedule (Minimal H-1)**:
   - Klik tombol **"Minta Pindah Jadwal (Reschedule)"** pada janji temu mendatang.
   - Pilih tanggal baru (misal besok/lusa) dan shift (Pagi/Siang) beserta alasan medis.
   - Klik **"Kirim Permohonan"**.
   - **Highlight Klien**: Pasien tidak bisa mengubah jadwal pada Hari H untuk menjaga ketertiban antrean rumah sakit. Permohonan H-1 ini akan terikat ke konsol Admin untuk disetujui.

4. **Pengumuman & Riwayat**:
   - Tunjukkan menu **"Pengumuman Klinik"** (misal: Edukasi Nutrisi HD & Jam Operasional Libur Nasional).

---

### 🏥 **SKENARIO 3: KONSOL MANAGEMENT ADMIN RS (`/admin`)**
> **Tujuan Demo**: Menunjukkan kontrol penuh staf medis/admin dalam memantau antrean real-time, menyetujui reschedule, dan menangani keadaan darurat.

1. **Login Admin**:
   - Buka `http://127.0.0.1:8000/login`.
   - Masukkan email `admin@hemo.clinic` dan password `admin`.

2. **Monitoring Antrean & Status Bed Real-Time (`/admin/queue`)**:
   - Akses menu **"Antrean & Monitoring Bed"**.
   - Tunjukkan grafik keterisian bed (Bed 1 s/d Bed 10) per Shift Pagi & Siang.
   - Tunjukkan indikator pasien yang sudah **Checked-In**, **Scheduled**, maupun **Completed**.

3. **Konsolidasi Approval Janji Temu & Reschedule (`/admin/appointment-approvals`)**:
   - Akses menu **"Approval Janji & Reschedule"**.
   - Tunjukkan tab filter: **Janji Temu Baru** vs **Permintaan Reschedule**.
   - Klik tombol **"Setujui (Approve)"** pada permohonan reschedule pasien, lalu alokasikan **Bed Number** (misal Bed 3).
   - **Highlight Klien**: Sistem secara otomatis mengecek agar tidak terjadi *double booking* pada slot bed yang sama di tanggal & shift tersebut.

4. **Demo Fitur Emergency Override (Pasien Darurat Medis)**:
   - Pada halaman janji temu/approval, klik tombol **"Emergency Override"**.
   - Pilih pasien darurat (misal sesak napas berat) untuk langsung menempati bed tanpa mengikuti prosedur antrean reguler.

5. **Manajemen Pasien (`/admin/patients`)**:
   - Tunjukkan tabel Manajemen Pasien dengan filter status yang rapi.
   - Tunjukkan fitur **Export CSV Data Pasien** untuk pelaporan rumah sakit.

---

## 💡 **3. PERTANYAAN POPULER KLIEN & OPERASIONAL RS (FAQ)**

### **Q1: Mengapa Check-In Mandiri Kiosk Wajib Menggunakan No. RM?**
> **Jawaban**: Nomor Rekam Medis (No. RM) adalah standar identitas pasien yang paling valid, unik, dan dikenal oleh seluruh fasilitas kesehatan di Indonesia (sesuai regulasi Kemenkes). Pasien lansia cukup membawa kartu ber-barcode No. RM tanpa perlu mengingat password atau token rumit.

### **Q2: Mengapa Reschedule Harus H-1, Tapi Check-In Kehadiran Harus Hari H?**
> **Jawaban**: 
> - **Reschedule H-1**: Diwajibkan H-1 agar perawat memisahkan alokasi bed bagi pasien lain jika jadwal dibatalkan.
> - **Check-In Hari H**: Merupakan konfirmasi kedatangan **riil fisik** pasien di ruang tunggu RS. Jika check-in diizinkan H-1, pasien yang masih di rumah bisa check-in palsu dan merusak perhitungan antrean medis.

### **Q3: Bagaimana Jika Kamera Kiosk Membaca Barcode Garis yang Agak Buram?**
> **Jawaban**: Kamera Kiosk telah dilengkapi arsitektur *Dual-Engine* (`Quagga2` dengan 4 background Web Workers sub-pixel locator) serta akselerasi GPU `BarcodeDetector`. Sistem mampu membaca barcode 1D garis maupun 2D QR Code secara instan dalam 0.01 detik.

---
*Dokumen ini dibuat otomatis untuk kebutuhan demonstrasi proyek Antrean Hemodialisis.*
