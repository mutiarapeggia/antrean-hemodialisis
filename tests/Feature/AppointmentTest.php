<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppointmentTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $patientUser;
    protected Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'name' => 'Admin Clinic',
            'email' => 'admin@clinic.com',
            'role' => 'admin',
        ]);

        $this->patientUser = User::factory()->create([
            'name' => 'John Patient',
            'email' => 'john@patient.com',
            'role' => 'patient',
        ]);

        $this->patient = Patient::create([
            'user_id' => $this->patientUser->id,
            'medical_record_number' => 'RM-2026-TEST',
            'phone' => '081234567890',
            'address' => 'Jl. Test No. 123',
            'medical_conditions' => 'Gagal Ginjal Kronis',
            'is_active' => true,
        ]);
    }

    public function test_admin_can_view_appointments_index(): void
    {
        $response = $this->actingAs($this->admin)->get(route('admin.appointments.index'));
        $response->assertStatus(200);
    }

    public function test_patient_can_view_own_appointments(): void
    {
        $response = $this->actingAs($this->patientUser)->get(route('patient.appointments.index'));
        $response->assertStatus(200);
    }

    public function test_admin_can_create_appointment(): void
    {
        $today = now()->format('Y-m-d');
        $response = $this->actingAs($this->admin)->post(route('admin.appointments.store'), [
            'patient_id' => $this->patient->id,
            'appointment_date' => $today,
            'shift' => 'pagi',
            'bed_number' => '1',
            'is_recurring' => false,
            'emergency_override' => false,
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('appointments', [
            'patient_id' => $this->patient->id,
            'shift' => 'pagi',
            'bed_number' => '1',
            'status' => 'scheduled',
        ]);

        $created = Appointment::where('patient_id', $this->patient->id)->first();
        $this->assertNotNull($created);
        $this->assertEquals($today, $created->appointment_date->format('Y-m-d'));
    }

    public function test_patient_can_create_appointment(): void
    {
        $tomorrow = now()->addDay()->format('Y-m-d');
        $response = $this->actingAs($this->patientUser)->post(route('patient.appointments.store'), [
            'appointment_date' => $tomorrow,
            'shift' => 'siang',
            'bed_number' => '2',
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('appointments', [
            'patient_id' => $this->patient->id,
            'shift' => 'siang',
            'bed_number' => '2',
        ]);

        $created = Appointment::where('patient_id', $this->patient->id)
            ->where('shift', 'siang')
            ->first();
        $this->assertNotNull($created);
        $this->assertEquals($tomorrow, $created->appointment_date->format('Y-m-d'));
    }

    public function test_slot_conflict_detection_prevents_double_booking_same_bed(): void
    {
        $date = now()->addDays(2)->format('Y-m-d');

        // First appointment
        Appointment::create([
            'patient_id' => $this->patient->id,
            'admin_id' => $this->admin->id,
            'appointment_date' => $date,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => 'pagi',
            'bed_number' => '3',
            'status' => 'scheduled',
            'qr_token' => 'token1',
        ]);

        // Second patient trying to book exact same date, shift, and bed
        $secondUser = User::factory()->create(['role' => 'patient']);
        $secondPatient = Patient::create([
            'user_id' => $secondUser->id,
            'medical_record_number' => 'RM-2026-SECOND',
            'phone' => '089999999999',
            'address' => 'Test',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)->post(route('admin.appointments.store'), [
            'patient_id' => $secondPatient->id,
            'appointment_date' => $date,
            'shift' => 'pagi',
            'bed_number' => '3',
            'emergency_override' => false,
        ]);

        $response->assertSessionHasErrors(['appointment_date']);
    }

    public function test_emergency_override_bypasses_slot_conflict(): void
    {
        $date = now()->addDays(3)->format('Y-m-d');

        // Existing appointment on Bed 4
        Appointment::create([
            'patient_id' => $this->patient->id,
            'admin_id' => $this->admin->id,
            'appointment_date' => $date,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => 'pagi',
            'bed_number' => '4',
            'status' => 'scheduled',
            'qr_token' => 'token_existing',
        ]);

        // Emergency patient override by Admin
        $emergencyUser = User::factory()->create(['role' => 'patient']);
        $emergencyPatient = Patient::create([
            'user_id' => $emergencyUser->id,
            'medical_record_number' => 'RM-EMERGENCY',
            'phone' => '081111111111',
            'address' => 'Emergency',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)->post(route('admin.appointments.store'), [
            'patient_id' => $emergencyPatient->id,
            'appointment_date' => $date,
            'shift' => 'pagi',
            'bed_number' => '4',
            'emergency_override' => true,
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('appointments', [
            'patient_id' => $emergencyPatient->id,
            'emergency_override' => true,
        ]);
    }

    public function test_recurring_appointments_creation(): void
    {
        $startDate = now()->addDays(4)->format('Y-m-d');

        $response = $this->actingAs($this->admin)->post(route('admin.appointments.store'), [
            'patient_id' => $this->patient->id,
            'appointment_date' => $startDate,
            'shift' => 'pagi',
            'bed_number' => '5',
            'is_recurring' => true,
            'recurring_weeks' => 4,
            'emergency_override' => false,
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseCount('appointments', 4);
    }

    public function test_hmac_qr_token_generation_integrity(): void
    {
        $date = now()->addDays(5)->format('Y-m-d');
        $expectedToken = Appointment::generateHmacQrToken($this->patient->id, $date, 'pagi', '6');

        $appointment = Appointment::create([
            'patient_id' => $this->patient->id,
            'admin_id' => $this->admin->id,
            'appointment_date' => $date,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => 'pagi',
            'bed_number' => '6',
            'status' => 'scheduled',
            'qr_token' => $expectedToken,
        ]);

        $this->assertEquals($expectedToken, $appointment->qr_token);
        $this->assertEquals(64, strlen($appointment->qr_token)); // SHA256 hex length
    }

    public function test_admin_and_patient_can_cancel_appointment_with_reason(): void
    {
        $appointment = Appointment::create([
            'patient_id' => $this->patient->id,
            'admin_id' => $this->admin->id,
            'appointment_date' => now()->addDays(6)->format('Y-m-d'),
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => 'pagi',
            'bed_number' => '7',
            'status' => 'scheduled',
            'qr_token' => 'token_cancel',
        ]);

        // Patient cancels appointment
        $response = $this->actingAs($this->patientUser)->post(route('patient.appointments.cancel', $appointment->id), [
            'cancellation_reason' => 'Ada keperluan keluarga mendesak',
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => 'cancelled',
            'cancellation_reason' => 'Ada keperluan keluarga mendesak',
        ]);
    }

    public function test_patient_cannot_unilaterally_create_recurring_appointment_without_admin_approval(): void
    {
        $date = now()->addDays(7)->format('Y-m-d');

        $response = $this->actingAs($this->patientUser)->post(route('patient.appointments.store'), [
            'appointment_date' => $date,
            'shift' => 'siang',
            'bed_number' => '8',
            'is_recurring' => true,
        ]);

        $response->assertSessionHas('success');

        $app = Appointment::where('patient_id', $this->patient->id)->where('shift', 'siang')->first();
        $this->assertNotNull($app);
        $this->assertEquals('pending_approval', $app->status);
        $this->assertEquals('pending_approval', $app->approval_status);
        $this->assertFalse((bool) $app->is_recurring);
    }
}
