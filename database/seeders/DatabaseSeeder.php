<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\Appointment;
use App\Models\Medication;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Admin User
        $admin = User::create([
            'name' => 'Admin Klinik Hemodialisis',
            'email' => 'admin@hemo.clinic',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        // 2. Create Sample Patients (with linked User accounts)
        $patientsData = [
            [
                'name' => 'Budi Santoso',
                'email' => 'budi.santoso@example.com',
                'rm' => 'RM-202607-001',
                'phone' => '081234567890',
                'address' => 'Jl. Merdeka No. 45, Jakarta Pusat',
                'conditions' => 'Gagal Ginjal Kronis Stage 5, Hipertensi',
            ],
            [
                'name' => 'Siti Rahmawati',
                'email' => 'siti.rahma@example.com',
                'rm' => 'RM-202607-002',
                'phone' => '082198765432',
                'address' => 'Jl. Sudirman No. 12, Jakarta Selatan',
                'conditions' => 'Gagal Ginjal Kronis, Diabetes Melitus Tipe 2',
            ],
            [
                'name' => 'Ahmad Hidayat',
                'email' => 'ahmad.hidayat@example.com',
                'rm' => 'RM-202607-003',
                'phone' => '083811223344',
                'address' => 'Jl. Mawar No. 8, Depok',
                'conditions' => 'Gagal Ginjal Kronis Stage 5',
            ],
        ];

        foreach ($patientsData as $index => $data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make('password123'),
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

            // Sample Medication
            Medication::create([
                'patient_id' => $patient->id,
                'name' => 'Erythropoietin (EPO)',
                'dosage' => '4000 IU',
                'frequency' => '2x seminggu pasca hemodialisis',
                'notes' => 'Disuntikkan secara subkutan',
            ]);

            Medication::create([
                'patient_id' => $patient->id,
                'name' => 'Calcium Carbonate (CaCO3)',
                'dosage' => '500 mg',
                'frequency' => '3x sehari bersama makan',
                'notes' => 'Pengikat fosfat',
            ]);

            // Sample Appointments for Today & Tomorrow
            $appDate = now()->addDays($index)->format('Y-m-d');
            $shift = ($index % 2 === 0) ? 'pagi' : 'siang';
            $startTime = ($shift === 'pagi') ? '07:00:00' : '12:00:00';
            $endTime = ($shift === 'pagi') ? '11:00:00' : '16:00:00';

            Appointment::create([
                'patient_id' => $patient->id,
                'admin_id' => $admin->id,
                'appointment_date' => $appDate,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'shift' => $shift,
                'status' => 'scheduled',
                'qr_token' => hash_hmac('sha256', "APP-{$patient->id}-{$appDate}-{$shift}", config('app.key', 'secret-key')),
                'is_recurring' => true,
                'emergency_override' => false,
            ]);
        }

        // 3. Create Sample Announcement
        Announcement::create([
            'admin_id' => $admin->id,
            'title' => 'Jadwal Operasional Libur Nasional',
            'content' => 'Pusat Hemodialisis akan tetap beroperasi terbatas pada libur nasional mendatang. Pasien shift pagi dimohon hadir tepat waktu.',
            'publish_date' => now()->format('Y-m-d'),
            'is_active' => true,
        ]);

        // 4. Create Additional Patients (15 new patients with linked User accounts)
        $password = Hash::make('password123');

        $additionalPatientsData = [
            [
                'name' => 'Dewi Lestari',
                'email' => 'dewi.lestari@example.com',
                'rm' => 'RM-202607-004',
                'phone' => '081298765401',
                'address' => 'Jl. Anggrek No. 15, Jakarta Barat',
                'conditions' => 'Gagal Ginjal Kronis Stage 5, Anemia',
            ],
            [
                'name' => 'Bambang Wijaya',
                'email' => 'bambang.wijaya@example.com',
                'rm' => 'RM-202607-005',
                'phone' => '081298765402',
                'address' => 'Jl. Gatot Subroto No. 88, Jakarta Selatan',
                'conditions' => 'Gagal Ginjal Kronis, Hipertensi',
            ],
            [
                'name' => 'Tri Wahyuni',
                'email' => 'tri.wahyuni@example.com',
                'rm' => 'RM-202607-006',
                'phone' => '081298765403',
                'address' => 'Jl. Pemuda No. 23, Rawamangun, Jakarta Timur',
                'conditions' => 'Gagal Ginjal Kronis Stage 4, Diabetes Melitus',
            ],
            [
                'name' => 'Eko Prasetyo',
                'email' => 'eko.prasetyo@example.com',
                'rm' => 'RM-202607-007',
                'phone' => '081298765404',
                'address' => 'Jl. Pajajaran No. 4, Bogor',
                'conditions' => 'Gagal Ginjal Kronis Stage 5',
            ],
            [
                'name' => 'Rudi Hermawan',
                'email' => 'rudi.hermawan@example.com',
                'rm' => 'RM-202607-008',
                'phone' => '081298765405',
                'address' => 'Jl. Ahmad Yani No. 102, Bekasi',
                'conditions' => 'Gagal Ginjal Kronis, Asam Urat Tinggi',
            ],
            [
                'name' => 'Nana Suryana',
                'email' => 'nana.suryana@example.com',
                'rm' => 'RM-202607-009',
                'phone' => '081298765406',
                'address' => 'Jl. Raden Fatah No. 17, Tangerang',
                'conditions' => 'Gagal Ginjal Kronis Stage 5, Hipertensi Heart Disease',
            ],
            [
                'name' => 'Agung Nugroho',
                'email' => 'agung.nugroho@example.com',
                'rm' => 'RM-202607-010',
                'phone' => '081298765407',
                'address' => 'Jl. Margonda Raya No. 50, Depok',
                'conditions' => 'Gagal Ginjal Kronis Stage 5',
            ],
            [
                'name' => 'Sri Daryanti',
                'email' => 'sri.daryanti@example.com',
                'rm' => 'RM-202607-011',
                'phone' => '081298765408',
                'address' => 'Jl. Cempaka Putih Tengah No. 9, Jakarta Pusat',
                'conditions' => 'Gagal Ginjal Kronis, Diabetes Melitus Tipe 2',
            ],
            [
                'name' => 'Hendra Kurniawan',
                'email' => 'hendra.kurniawan@example.com',
                'rm' => 'RM-202607-012',
                'phone' => '081298765409',
                'address' => 'Jl. Raya Serpong No. 31, Tangerang Selatan',
                'conditions' => 'Gagal Ginjal Kronis Stage 5, Anemia Berat',
            ],
            [
                'name' => 'Ratna Sari',
                'email' => 'ratna.sari@example.com',
                'rm' => 'RM-202607-013',
                'phone' => '081298765410',
                'address' => 'Jl. Kebon Jeruk Raya No. 11, Jakarta Barat',
                'conditions' => 'Gagal Ginjal Kronis Stage 4, Hipertensi',
            ],
            [
                'name' => 'Andi Wibowo',
                'email' => 'andi.wibowo@example.com',
                'rm' => 'RM-202607-014',
                'phone' => '081298765411',
                'address' => 'Jl. Raya Bogor Km 28, Jakarta Timur',
                'conditions' => 'Gagal Ginjal Kronis Stage 5',
            ],
            [
                'name' => 'Yuni Astuti',
                'email' => 'yuni.astuti@example.com',
                'rm' => 'RM-202607-015',
                'phone' => '081298765412',
                'address' => 'Jl. Kartini No. 5, Bekasi Barat',
                'conditions' => 'Gagal Ginjal Kronis Stage 5, Diabetes Melitus',
            ],
            [
                'name' => 'Farhan Hidayat',
                'email' => 'farhan.hidayat@example.com',
                'rm' => 'RM-202607-016',
                'phone' => '081298765413',
                'address' => 'Jl. Cinere Raya No. 20, Depok',
                'conditions' => 'Gagal Ginjal Kronis Stage 4',
            ],
            [
                'name' => 'Maya Indriani',
                'email' => 'maya.indriani@example.com',
                'rm' => 'RM-202607-017',
                'phone' => '081298765414',
                'address' => 'Jl. Daan Mogot No. 64, Jakarta Barat',
                'conditions' => 'Gagal Ginjal Kronis Stage 5, Hipertensi',
            ],
            [
                'name' => 'Dani Setiawan',
                'email' => 'dani.setiawan@example.com',
                'rm' => 'RM-202607-018',
                'phone' => '081298765415',
                'address' => 'Jl. Bintaro Utama 3, Tangerang Selatan',
                'conditions' => 'Gagal Ginjal Kronis Stage 5',
            ],
        ];

        $statuses = ['scheduled', 'checked-in', 'in-progress', 'completed', 'no-show'];

        foreach ($additionalPatientsData as $idx => $data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $password,
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

            // Sample Medication per patient
            $medicationsList = [
                [
                    'name' => 'Furosemide',
                    'dosage' => '40 mg',
                    'frequency' => '1x sehari pagi hari',
                    'notes' => 'Diuretik untuk mengurangi penumpukan cairan',
                ],
                [
                    'name' => 'Erythropoietin (EPO)',
                    'dosage' => '4000 IU',
                    'frequency' => '2x seminggu pasca hemodialisis',
                    'notes' => 'Disuntikkan secara subkutan',
                ],
                [
                    'name' => 'Calcium Carbonate (CaCO3)',
                    'dosage' => '500 mg',
                    'frequency' => '3x sehari bersama makan',
                    'notes' => 'Pengikat fosfat',
                ],
                [
                    'name' => 'Asam Folat',
                    'dosage' => '5 mg',
                    'frequency' => '1x sehari',
                    'notes' => 'Suplemen vitamin B9',
                ],
                [
                    'name' => 'Amlodipine',
                    'dosage' => '10 mg',
                    'frequency' => '1x sehari malam hari',
                    'notes' => 'Kontrol tekanan darah',
                ],
            ];

            $med1 = $medicationsList[$idx % count($medicationsList)];
            $med2 = $medicationsList[($idx + 2) % count($medicationsList)];

            Medication::create([
                'patient_id' => $patient->id,
                'name' => $med1['name'],
                'dosage' => $med1['dosage'],
                'frequency' => $med1['frequency'],
                'notes' => $med1['notes'],
            ]);

            Medication::create([
                'patient_id' => $patient->id,
                'name' => $med2['name'],
                'dosage' => $med2['dosage'],
                'frequency' => $med2['frequency'],
                'notes' => $med2['notes'],
            ]);

            // Varied Appointments
            $dayOffset = ($idx % 5) * 2 - 3;
            $appDate = now()->addDays($dayOffset)->format('Y-m-d');
            $shift = ($idx % 2 === 0) ? 'pagi' : 'siang';
            $startTime = ($shift === 'pagi') ? '07:00:00' : '12:00:00';
            $endTime = ($shift === 'pagi') ? '11:00:00' : '16:00:00';
            $status = $statuses[$idx % count($statuses)];

            Appointment::create([
                'patient_id' => $patient->id,
                'admin_id' => $admin->id,
                'appointment_date' => $appDate,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'shift' => $shift,
                'status' => $status,
                'qr_token' => hash_hmac('sha256', "APP-{$patient->id}-{$appDate}-{$shift}", config('app.key', 'secret-key')),
                'is_recurring' => true,
                'emergency_override' => false,
            ]);
        }

        // 5. Additional Announcements
        Announcement::create([
            'admin_id' => $admin->id,
            'title' => 'Edukasi Nutrisi dan Diet Pasien Hemodialisis',
            'content' => 'Sesi konseling gizi gratis bagi pasien hemodialisis akan diadakan setiap hari Sabtu minggu kedua. Harap menghubungi perawat jaga untuk mendaftar.',
            'publish_date' => now()->format('Y-m-d'),
            'is_active' => true,
        ]);

        Announcement::create([
            'admin_id' => $admin->id,
            'title' => 'Pemeriksaan Laboratorium Rutin Bulanan',
            'content' => 'Pemeriksaan darah lengkap dan ureum-kreatinin rutin akan dilaksanakan pada awal minggu depan. Dimohon pasien puasa sesuai arahan perawat.',
            'publish_date' => now()->addDays(2)->format('Y-m-d'),
            'is_active' => true,
        ]);
    }
}
