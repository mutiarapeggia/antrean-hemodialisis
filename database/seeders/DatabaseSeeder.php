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
    }
}
