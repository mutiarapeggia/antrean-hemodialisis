<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\Appointment;
use App\Models\Bed;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 0. Seed Master Beds 1 to 12
        for ($i = 1; $i <= 10; $i++) {
            Bed::firstOrCreate(
                ['bed_number' => "Bed {$i}"],
                ['label' => "Bed Utama {$i}", 'status' => 'available', 'notes' => 'Siap digunakan']
            );
        }
        Bed::firstOrCreate(
            ['bed_number' => 'Bed 11'],
            ['label' => 'Bed Ruang 2 #11', 'status' => 'maintenance', 'notes' => 'Kalibrasi rutin mesin HD']
        );
        Bed::firstOrCreate(
            ['bed_number' => 'Bed 12'],
            ['label' => 'Bed Ruang 2 #12', 'status' => 'damaged', 'notes' => 'Motor pengatur posisi dalam perbaikan']
        );

        // 1. Create Admin User (Kredensial: admin / admin@hemo.clinic & password: admin)
        $admin = User::create([
            'name' => 'Admin Klinik Hemodialisis',
            'email' => 'admin@hemo.clinic',
            'password' => Hash::make('admin'),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        // 2. Create Sample Patients with RM-9901 to RM-9905 and RM-9910 to RM-9912 (password: pasien)
        $patientPassword = Hash::make('pasien');

        $patientsData = [
            [
                'name' => 'Budi Santoso',
                'email' => 'budi@hemo.clinic',
                'rm' => 'RM-9901',
                'phone' => '081234567890',
                'address' => 'Jl. Merdeka No. 45, Jakarta Pusat',
                'conditions' => 'Gagal Ginjal Kronis Stage 5, Hipertensi',
            ],
            [
                'name' => 'Siti Rahmawati',
                'email' => 'siti@hemo.clinic',
                'rm' => 'RM-9902',
                'phone' => '082198765432',
                'address' => 'Jl. Sudirman No. 12, Jakarta Selatan',
                'conditions' => 'Gagal Ginjal Kronis, Diabetes Melitus Tipe 2',
            ],
            [
                'name' => 'Ahmad Hidayat',
                'email' => 'ahmad@hemo.clinic',
                'rm' => 'RM-9903',
                'phone' => '083811223344',
                'address' => 'Jl. Mawar No. 8, Depok',
                'conditions' => 'Gagal Ginjal Kronis Stage 5',
            ],
            [
                'name' => 'Dewi Lestari',
                'email' => 'dewi@hemo.clinic',
                'rm' => 'RM-9904',
                'phone' => '081298765401',
                'address' => 'Jl. Anggrek No. 15, Jakarta Barat',
                'conditions' => 'Gagal Ginjal Kronis Stage 5, Anemia',
            ],
            [
                'name' => 'Bambang Wijaya',
                'email' => 'bambang@hemo.clinic',
                'rm' => 'RM-9905',
                'phone' => '081298765402',
                'address' => 'Jl. Gatot Subroto No. 88, Jakarta Selatan',
                'conditions' => 'Gagal Ginjal Kronis, Hipertensi',
            ],
            [
                'name' => 'Agung Nugroho',
                'email' => 'agung@hemo.clinic',
                'rm' => 'RM-9910',
                'phone' => '081298765407',
                'address' => 'Jl. Margonda Raya No. 50, Depok',
                'conditions' => 'Gagal Ginjal Kronis Stage 5',
            ],
            [
                'name' => 'Sri Daryanti',
                'email' => 'sri@hemo.clinic',
                'rm' => 'RM-9911',
                'phone' => '081298765408',
                'address' => 'Jl. Cempaka Putih Tengah No. 9, Jakarta Pusat',
                'conditions' => 'Gagal Ginjal Kronis, Diabetes Melitus Tipe 2',
            ],
            [
                'name' => 'Hendra Kurniawan',
                'email' => 'hendra@hemo.clinic',
                'rm' => 'RM-9912',
                'phone' => '081298765409',
                'address' => 'Jl. Raya Serpong No. 31, Tangerang Selatan',
                'conditions' => 'Gagal Ginjal Kronis Stage 5, Anemia Berat',
            ],
        ];

        $statuses = ['scheduled', 'checked-in', 'in-progress', 'completed', 'no-show'];

        foreach ($patientsData as $index => $data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $patientPassword,
                'role' => 'patient',
                'email_verified_at' => now(),
            ]);

            $patient = Patient::create([
                'user_id' => $user->id,
                'medical_record_number' => $data['rm'],
                'phone' => $data['phone'],
                'address' => $data['address'],
                'medical_conditions' => $data['conditions'],
                'is_active' => true,
            ]);

            // Sample Appointments
            $dayOffset = ($index % 3) - 1;
            $appDate = now()->addDays($dayOffset)->format('Y-m-d');
            $shift = ($index % 2 === 0) ? 'pagi' : 'siang';
            $startTime = ($shift === 'pagi') ? '07:00:00' : '12:00:00';
            $endTime = ($shift === 'pagi') ? '11:00:00' : '16:00:00';
            $status = $statuses[$index % count($statuses)];
            $bedNum = (string) (($index % 10) + 1);

            Appointment::create([
                'patient_id' => $patient->id,
                'admin_id' => $admin->id,
                'appointment_date' => $appDate,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'shift' => $shift,
                'bed_number' => $bedNum,
                'status' => $status,
                'qr_token' => hash_hmac('sha256', "APP-{$patient->id}-{$appDate}-{$shift}", config('app.key', 'secret-key')),
                'is_recurring' => true,
                'emergency_override' => false,
            ]);
        }

        // 3. Announcements
        Announcement::create([
            'admin_id' => $admin->id,
            'title' => 'Jadwal Operasional Libur Nasional',
            'content' => 'Pusat Hemodialisis akan tetap beroperasi terbatas pada libur nasional mendatang. Pasien shift pagi dimohon hadir tepat waktu.',
            'publish_date' => now()->format('Y-m-d'),
            'is_active' => true,
        ]);

        Announcement::create([
            'admin_id' => $admin->id,
            'title' => 'Edukasi Nutrisi dan Diet Pasien Hemodialisis',
            'content' => 'Sesi konseling gizi gratis bagi pasien hemodialisis akan diadakan setiap hari Sabtu minggu kedua. Harap menghubungi perawat jaga untuk mendaftar.',
            'publish_date' => now()->format('Y-m-d'),
            'is_active' => true,
        ]);
    }
}
