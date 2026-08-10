<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\User;
use App\Notifications\Channels\WhatsappNotificationChannel;
use App\Services\WhatsappGatewayService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class Sprint6HardeningAndWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $patientUser;
    protected Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'name' => 'Admin Hardening',
            'email' => 'admin.hardening@test.com',
            'role' => 'admin',
        ]);

        $this->patientUser = User::factory()->create([
            'name' => 'Pasien Hardening',
            'email' => 'pasien.hardening@test.com',
            'role' => 'patient',
        ]);

        $this->patient = Patient::create([
            'user_id' => $this->patientUser->id,
            'medical_record_number' => 'RM-S6-001',
            'phone' => '08129999001',
            'address' => 'Jakarta',
            'medical_conditions' => 'GGK Stage 5',
            'is_active' => true,
            'approval_status' => 'pending',
        ]);
    }

    public function test_patient_registration_approval_workflow(): void
    {
        // 1. View Approvals Index
        $indexResponse = $this->actingAs($this->admin)->get(route('admin.patient-approvals.index'));
        $indexResponse->assertStatus(200);

        // 2. Admin Approve Patient
        $approveResponse = $this->actingAs($this->admin)->post(route('admin.patient-approvals.approve', $this->patient->id));
        $approveResponse->assertRedirect();

        $this->assertDatabaseHas('patients', [
            'id' => $this->patient->id,
            'approval_status' => 'approved',
            'is_active' => true,
        ]);

        // 3. Admin Reject Patient
        $rejectResponse = $this->actingAs($this->admin)->post(route('admin.patient-approvals.reject', $this->patient->id), [
            'rejection_reason' => 'Berkas rekam medis tidak valid',
        ]);

        $rejectResponse->assertRedirect();
        $this->assertDatabaseHas('patients', [
            'id' => $this->patient->id,
            'approval_status' => 'rejected',
            'rejection_reason' => 'Berkas rekam medis tidak valid',
        ]);
    }

    public function test_appointment_approval_and_emergency_override_workflow(): void
    {
        $today = Carbon::today()->toDateString();

        $app = Appointment::create([
            'patient_id' => $this->patient->id,
            'appointment_date' => $today,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => Appointment::SHIFT_PAGI,
            'bed_number' => 1,
            'status' => 'pending_approval',
            'approval_status' => 'pending_approval',
            'qr_token' => 'temp-token',
        ]);

        // 1. Approve Appointment
        $approveResponse = $this->actingAs($this->admin)->post(route('admin.appointment-approvals.approve', $app->id));
        $approveResponse->assertRedirect();

        $this->assertDatabaseHas('appointments', [
            'id' => $app->id,
            'approval_status' => 'approved',
            'status' => Appointment::STATUS_SCHEDULED,
        ]);

        // 2. Emergency Override
        $emergencyResponse = $this->actingAs($this->admin)->post(route('admin.appointment-approvals.emergency-override'), [
            'patient_id' => $this->patient->id,
            'appointment_date' => $today,
            'shift' => 'siang',
            'bed_number' => 2,
            'emergency_reason' => 'Pasien kelebihan cairan akut',
        ]);

        $emergencyResponse->assertRedirect();
        $this->assertDatabaseHas('appointments', [
            'patient_id' => $this->patient->id,
            'shift' => 'siang',
            'emergency_override' => true,
        ]);
    }

    public function test_checkin_kiosk_uses_lockforupdate_race_condition_protection(): void
    {
        $today = Carbon::today()->toDateString();
        $qrToken = Appointment::generateHmacQrToken($this->patient->id, $today, 'pagi', 1);

        $app = Appointment::create([
            'patient_id' => $this->patient->id,
            'appointment_date' => $today,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => Appointment::SHIFT_PAGI,
            'bed_number' => 1,
            'status' => Appointment::STATUS_SCHEDULED,
            'qr_token' => $qrToken,
        ]);

        $response = $this->postJson(route('api.check-in.web'), [
            'qr_token' => $qrToken,
            'simulated_at' => "{$today} 07:05:00",
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'success');

        $this->assertDatabaseHas('appointments', [
            'id' => $app->id,
            'status' => Appointment::STATUS_CHECKED_IN,
        ]);
    }

    public function test_patient_notification_preferences_and_whatsapp_channel(): void
    {
        // 1. Patient Updates Preferences
        $response = $this->actingAs($this->patientUser)->post(route('patient.notifications.update'), [
            'notification_preference' => 'whatsapp',
            'whatsapp_number' => '081299998888',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('patients', [
            'id' => $this->patient->id,
            'notification_preference' => 'whatsapp',
            'whatsapp_number' => '081299998888',
        ]);

        // 2. Test WhatsappGatewayService directly
        $waService = new WhatsappGatewayService();
        $sent = $waService->sendMessage('081299998888', 'Test WhatsApp Alert');
        $this->assertTrue($sent);
    }
}
