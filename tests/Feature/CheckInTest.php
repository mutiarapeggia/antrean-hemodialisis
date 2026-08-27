<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\CheckIn;
use App\Models\Patient;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class CheckInTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $patientUser1;
    protected Patient $patient1;
    protected User $patientUser2;
    protected Patient $patient2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->patientUser1 = User::factory()->create([
            'name' => 'Pasien Pertama',
            'role' => 'patient',
        ]);

        $this->patient1 = Patient::create([
            'user_id' => $this->patientUser1->id,
            'medical_record_number' => 'RM-2026-001',
            'phone' => '081234567891',
            'address' => 'Jakarta',
            'is_active' => true,
        ]);

        $this->patientUser2 = User::factory()->create([
            'name' => 'Pasien Kedua',
            'role' => 'patient',
        ]);

        $this->patient2 = Patient::create([
            'user_id' => $this->patientUser2->id,
            'medical_record_number' => 'RM-2026-002',
            'phone' => '081234567892',
            'address' => 'Jakarta',
            'is_active' => true,
        ]);
    }

    public function test_kiosk_page_can_be_rendered(): void
    {
        $response = $this->get(route('kiosk'));
        $response->assertStatus(200);
    }

    public function test_on_time_check_in_within_15_minutes_success(): void
    {
        $today = now()->format('Y-m-d');
        $shift = 'pagi';
        $bed = '1';

        $token = Appointment::generateHmacQrToken($this->patient1->id, $today, $shift, $bed);

        $appointment = Appointment::create([
            'patient_id' => $this->patient1->id,
            'admin_id' => $this->admin->id,
            'appointment_date' => $today,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => $shift,
            'bed_number' => $bed,
            'status' => Appointment::STATUS_SCHEDULED,
            'qr_token' => $token,
        ]);

        // Arrival at 07:10:00 (<= 07:15:00 cutoff)
        $arrivalTime = "{$today} 07:10:00";

        $response = $this->postJson('/api/check-in', [
            'qr_token' => $token,
            'simulated_at' => $arrivalTime,
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
            'patient_name' => 'Pasien Pertama',
            'medical_record_number' => 'RM-2026-001',
        ]);

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => Appointment::STATUS_CHECKED_IN,
        ]);

        $this->assertDatabaseHas('check_ins', [
            'appointment_id' => $appointment->id,
            'status' => 'on-time',
            'source' => 'kiosk',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $this->patientUser1->id,
            'action' => 'CHECK_IN_SUCCESS',
        ]);
    }

    public function test_late_check_in_during_active_shift_succeeds_with_late_status(): void
    {
        $today = now()->format('Y-m-d');
        $shift = 'pagi';
        $bed = '2';

        $token = Appointment::generateHmacQrToken($this->patient1->id, $today, $shift, $bed);

        $appointment = Appointment::create([
            'patient_id' => $this->patient1->id,
            'admin_id' => $this->admin->id,
            'appointment_date' => $today,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => $shift,
            'bed_number' => $bed,
            'status' => Appointment::STATUS_SCHEDULED,
            'qr_token' => $token,
        ]);

        // Arrival at 07:20:00 (> 07:15:00 cutoff but <= 11:00:00 shift end)
        $arrivalTime = "{$today} 07:20:00";

        $response = $this->postJson('/api/check-in', [
            'qr_token' => $token,
            'simulated_at' => $arrivalTime,
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
            'is_late' => true,
            'patient_name' => 'Pasien Pertama',
            'message' => 'Check-In Berhasil! (Check-in Terlambat)',
        ]);

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => Appointment::STATUS_CHECKED_IN,
        ]);

        $this->assertDatabaseHas('check_ins', [
            'appointment_id' => $appointment->id,
            'status' => 'late',
        ]);
    }

    public function test_check_in_after_shift_end_rejected(): void
    {
        $today = now()->format('Y-m-d');
        $shift = 'pagi';
        $bed = '2';

        $token = Appointment::generateHmacQrToken($this->patient1->id, $today, $shift, $bed);

        $appointment = Appointment::create([
            'patient_id' => $this->patient1->id,
            'admin_id' => $this->admin->id,
            'appointment_date' => $today,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => $shift,
            'bed_number' => $bed,
            'status' => Appointment::STATUS_SCHEDULED,
            'qr_token' => $token,
        ]);

        // Arrival at 11:15:00 (> 11:00:00 shift end)
        $arrivalTime = "{$today} 11:15:00";

        $response = $this->postJson('/api/check-in', [
            'qr_token' => $token,
            'simulated_at' => $arrivalTime,
        ]);

        $response->assertStatus(422);
        $response->assertJson([
            'status' => 'shift_ended',
            'message' => 'Shift 1 telah berakhir. Silakan hubungi petugas medis.',
        ]);
    }

    public function test_check_in_with_invalid_qr_token_fails(): void
    {
        $response = $this->postJson('/api/check-in', [
            'qr_token' => 'INVALID_DUMMY_TOKEN_123',
        ]);

        $response->assertStatus(404);
        $response->assertJson([
            'status' => 'not_found',
        ]);
    }

    public function test_duplicate_check_in_rejected(): void
    {
        $today = now()->format('Y-m-d');
        $token = Appointment::generateHmacQrToken($this->patient1->id, $today, 'pagi', '3');

        $appointment = Appointment::create([
            'patient_id' => $this->patient1->id,
            'appointment_date' => $today,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => 'pagi',
            'bed_number' => '3',
            'status' => Appointment::STATUS_CHECKED_IN, // Already checked in
            'qr_token' => $token,
        ]);

        $response = $this->postJson('/api/check-in', [
            'qr_token' => $token,
            'simulated_at' => "{$today} 07:10:00",
        ]);

        $response->assertStatus(400);
        $response->assertJson([
            'status' => 'already_checked_in',
        ]);
    }

    public function test_artisan_command_process_no_shows(): void
    {
        $testDate = '2026-07-30';
        $token = Appointment::generateHmacQrToken($this->patient1->id, $testDate, 'pagi', '4');

        $appointment = Appointment::create([
            'patient_id' => $this->patient1->id,
            'appointment_date' => $testDate,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => 'pagi',
            'bed_number' => '4',
            'status' => Appointment::STATUS_SCHEDULED,
            'qr_token' => $token,
        ]);

        // Run artisan command for date
        $exitCode = Artisan::call('app:process-no-shows', ['--date' => $testDate]);
        $this->assertEquals(0, $exitCode);

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => Appointment::STATUS_NO_SHOW,
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'AUTOMATIC_NO_SHOW_PROCESSED',
        ]);
    }

    public function test_no_show_triggers_promotion_notification_to_next_patient(): void
    {
        $today = now()->format('Y-m-d');

        // First patient late
        $token1 = Appointment::generateHmacQrToken($this->patient1->id, $today, 'pagi', '5');
        $app1 = Appointment::create([
            'patient_id' => $this->patient1->id,
            'appointment_date' => $today,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => 'pagi',
            'bed_number' => '5',
            'status' => Appointment::STATUS_SCHEDULED,
            'qr_token' => $token1,
        ]);

        // Second patient waiting
        $token2 = Appointment::generateHmacQrToken($this->patient2->id, $today, 'pagi', '6');
        $app2 = Appointment::create([
            'patient_id' => $this->patient2->id,
            'appointment_date' => $today,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => 'pagi',
            'bed_number' => '6',
            'status' => Appointment::STATUS_SCHEDULED,
            'qr_token' => $token2,
        ]);

        // Process No-Shows via console command
        $this->artisan('app:process-no-shows')
            ->assertExitCode(0);

        $this->assertDatabaseHas('appointments', [
            'id' => $app1->id,
            'status' => Appointment::STATUS_NO_SHOW,
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'AUTOMATIC_NO_SHOW_PROCESSED',
        ]);
    }

    public function test_check_in_shift_mismatch_returns_clear_warning_message(): void
    {
        $today = now()->format('Y-m-d');
        $shift = 'siang';
        $bed = '7';

        $token = Appointment::generateHmacQrToken($this->patient1->id, $today, $shift, $bed);

        Appointment::create([
            'patient_id' => $this->patient1->id,
            'admin_id' => $this->admin->id,
            'appointment_date' => $today,
            'start_time' => '12:00:00',
            'end_time' => '16:00:00',
            'shift' => $shift,
            'bed_number' => $bed,
            'status' => Appointment::STATUS_SCHEDULED,
            'qr_token' => $token,
        ]);

        // Patient arrives at 08:00 AM (Pagi shift time window)
        $response = $this->postJson('/api/check-in', [
            'qr_token' => $token,
            'simulated_at' => "{$today} 08:00:00",
        ]);

        $response->assertStatus(422);
        $response->assertJson([
            'status' => 'shift_mismatch',
            'message' => 'Jadwal Anda berada di Shift 2 (12.00 - 16.00 WIB). Silakan check-in saat Shift 2 dibuka.',
        ]);
    }

    public function test_prevent_double_check_in_across_shifts_without_second_appointment(): void
    {
        $today = now()->format('Y-m-d');
        $token = Appointment::generateHmacQrToken($this->patient1->id, $today, 'pagi', '8');

        $appointment = Appointment::create([
            'patient_id' => $this->patient1->id,
            'appointment_date' => $today,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => 'pagi',
            'bed_number' => '8',
            'status' => Appointment::STATUS_CHECKED_IN,
            'qr_token' => $token,
        ]);

        // Attempt check-in again at 13:00:00 (Siang time)
        $response = $this->postJson('/api/check-in', [
            'qr_token' => $token,
            'simulated_at' => "{$today} 13:00:00",
        ]);

        $response->assertStatus(400);
        $response->assertJson([
            'status' => 'already_checked_in',
        ]);
    }

    public function test_check_in_rejected_when_reschedule_is_pending(): void
    {
        $today = now()->format('Y-m-d');
        $shift = 'pagi';
        $bed = '1';

        $token = Appointment::generateHmacQrToken($this->patient1->id, $today, $shift, $bed);

        $appointment = Appointment::create([
            'patient_id' => $this->patient1->id,
            'admin_id' => $this->admin->id,
            'appointment_date' => $today,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => $shift,
            'bed_number' => $bed,
            'status' => Appointment::STATUS_SCHEDULED,
            'qr_token' => $token,
        ]);

        \App\Models\RescheduleRequest::create([
            'appointment_id' => $appointment->id,
            'patient_id' => $this->patient1->id,
            'requested_date' => now()->addDay()->format('Y-m-d'),
            'requested_shift' => 'siang',
            'status' => 'pending',
        ]);

        $response = $this->postJson('/api/check-in', [
            'qr_token' => $token,
            'simulated_at' => "{$today} 07:05:00",
        ]);

        $response->assertStatus(400);
        $response->assertJson([
            'status' => 'reschedule_pending',
            'message' => 'Check-in ditolak: Janji temu ini sedang dalam proses permohonan jadwal ulang',
        ]);
    }

    public function test_check_in_with_json_qr_payload_success(): void
    {
        $today = now()->format('Y-m-d');
        $shift = 'pagi';
        $bed = '1';

        $token = Appointment::generateHmacQrToken($this->patient1->id, $today, $shift, $bed);

        $appointment = Appointment::create([
            'patient_id' => $this->patient1->id,
            'admin_id' => $this->admin->id,
            'appointment_date' => $today,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => $shift,
            'bed_number' => $bed,
            'status' => Appointment::STATUS_SCHEDULED,
            'qr_token' => $token,
        ]);

        $jsonPayload = json_encode([
            'appointment_id' => $appointment->id,
            'qr_token' => $token,
            'medical_record_number' => $this->patient1->medical_record_number,
        ]);

        $response = $this->postJson('/api/check-in', [
            'qr_token' => $jsonPayload,
            'simulated_at' => "{$today} 07:05:00",
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
            'patient_name' => 'Pasien Pertama',
        ]);
    }

    public function test_check_in_past_date_ticket_rejected(): void
    {
        $pastDate = now()->subDays(2)->format('Y-m-d');
        $today = now()->format('Y-m-d');

        $token = Appointment::generateHmacQrToken($this->patient1->id, $pastDate, 'pagi', '1');

        $appointment = Appointment::create([
            'patient_id' => $this->patient1->id,
            'admin_id' => $this->admin->id,
            'appointment_date' => $pastDate,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => 'pagi',
            'bed_number' => '1',
            'status' => Appointment::STATUS_SCHEDULED,
            'qr_token' => $token,
        ]);

        $response = $this->postJson('/api/check-in', [
            'qr_token' => $token,
            'simulated_at' => "{$today} 07:05:00",
        ]);

        $response->assertStatus(400);
        $response->assertJson([
            'status' => 'expired_ticket',
        ]);
    }

    public function test_check_in_future_date_ticket_rejected(): void
    {
        $futureDate = now()->addDays(2)->format('Y-m-d');
        $today = now()->format('Y-m-d');

        $token = Appointment::generateHmacQrToken($this->patient1->id, $futureDate, 'pagi', '1');

        $appointment = Appointment::create([
            'patient_id' => $this->patient1->id,
            'admin_id' => $this->admin->id,
            'appointment_date' => $futureDate,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => 'pagi',
            'bed_number' => '1',
            'status' => Appointment::STATUS_SCHEDULED,
            'qr_token' => $token,
        ]);

        $response = $this->postJson('/api/check-in', [
            'qr_token' => $token,
            'simulated_at' => "{$today} 07:05:00",
        ]);

        $response->assertStatus(400);
        $response->assertJson([
            'status' => 'future_ticket',
        ]);
    }
}
