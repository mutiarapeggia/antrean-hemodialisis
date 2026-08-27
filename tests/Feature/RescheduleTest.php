<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\RescheduleRequest;
use App\Models\User;
use App\Notifications\RescheduleResultNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class RescheduleTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $patientUser;
    protected Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->patientUser = User::factory()->create([
            'role' => 'patient',
        ]);

        $this->patient = Patient::create([
            'user_id' => $this->patientUser->id,
            'medical_record_number' => 'RM-202607-999',
            'phone' => '081234567890',
            'status' => 'active',
        ]);
    }

    public function test_patient_can_submit_h_minus_1_reschedule_request(): void
    {
        $futureDate = now()->addDays(3)->format('Y-m-d');
        $requestedDate = now()->addDays(5)->format('Y-m-d');

        $appointment = Appointment::create([
            'patient_id' => $this->patient->id,
            'appointment_date' => $futureDate,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => 'pagi',
            'bed_number' => '1',
            'status' => Appointment::STATUS_SCHEDULED,
            'qr_token' => 'HMAC-TOKEN-TEST-1',
        ]);

        $response = $this->actingAs($this->patientUser)
            ->post(route('patient.reschedule.store'), [
                'appointment_id' => $appointment->id,
                'requested_date' => $requestedDate,
                'requested_shift' => 'siang',
                'reason' => 'Ada keperluan keluarga mendesak',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('reschedule_requests', [
            'appointment_id' => $appointment->id,
            'patient_id' => $this->patient->id,
            'requested_shift' => 'siang',
            'status' => 'pending',
            'reason' => 'Ada keperluan keluarga mendesak',
        ]);
    }

    public function test_patient_cannot_submit_reschedule_for_today_or_past_date(): void
    {
        $futureDate = now()->addDays(3)->format('Y-m-d');
        $todayDate = now()->format('Y-m-d');

        $appointment = Appointment::create([
            'patient_id' => $this->patient->id,
            'appointment_date' => $futureDate,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => 'pagi',
            'bed_number' => '1',
            'status' => Appointment::STATUS_SCHEDULED,
            'qr_token' => 'HMAC-TOKEN-TEST-2',
        ]);

        $response = $this->actingAs($this->patientUser)
            ->post(route('patient.reschedule.store'), [
                'appointment_id' => $appointment->id,
                'requested_date' => $todayDate, // H-0 (same day)
                'requested_shift' => 'siang',
            ]);

        $response->assertSessionHasErrors('requested_date');
        $this->assertDatabaseCount('reschedule_requests', 0);
    }

    public function test_patient_cannot_submit_duplicate_pending_reschedule_request(): void
    {
        $futureDate = now()->addDays(3)->format('Y-m-d');
        $requestedDate = now()->addDays(5)->format('Y-m-d');

        $appointment = Appointment::create([
            'patient_id' => $this->patient->id,
            'appointment_date' => $futureDate,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => 'pagi',
            'bed_number' => '1',
            'status' => Appointment::STATUS_SCHEDULED,
            'qr_token' => 'HMAC-TOKEN-TEST-3',
        ]);

        RescheduleRequest::create([
            'appointment_id' => $appointment->id,
            'patient_id' => $this->patient->id,
            'requested_date' => $requestedDate,
            'requested_shift' => 'siang',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->patientUser)
            ->post(route('patient.reschedule.store'), [
                'appointment_id' => $appointment->id,
                'requested_date' => now()->addDays(6)->format('Y-m-d'),
                'requested_shift' => 'pagi',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertDatabaseCount('reschedule_requests', 1);
    }

    public function test_admin_can_view_reschedule_requests_index(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->get(route('admin.reschedule-requests.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Admin/RescheduleRequests/Index'));
    }

    public function test_admin_can_approve_reschedule_request_and_allocate_bed(): void
    {
        Notification::fake();

        $originalDate = now()->addDays(3)->format('Y-m-d');
        $requestedDate = now()->addDays(5)->format('Y-m-d');

        $appointment = Appointment::create([
            'patient_id' => $this->patient->id,
            'appointment_date' => $originalDate,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => 'pagi',
            'bed_number' => '1',
            'status' => Appointment::STATUS_SCHEDULED,
            'qr_token' => 'HMAC-TOKEN-TEST-ORIGINAL',
        ]);

        $reschedule = RescheduleRequest::create([
            'appointment_id' => $appointment->id,
            'patient_id' => $this->patient->id,
            'requested_date' => $requestedDate,
            'requested_shift' => 'siang',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->post(route('admin.reschedule-requests.approve', $reschedule->id), [
                'bed_number' => '3',
                'admin_notes' => 'Disetujui untuk Bed 3',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('reschedule_requests', [
            'id' => $reschedule->id,
            'status' => 'approved',
            'admin_notes' => 'Disetujui untuk Bed 3',
        ]);

        $appointment->refresh();
        $this->assertEquals($requestedDate, $appointment->appointment_date->format('Y-m-d'));
        $this->assertEquals('siang', $appointment->shift);
        $this->assertEquals('3', $appointment->bed_number);
        $this->assertEquals('12:00:00', $appointment->start_time);
        $this->assertNotEquals('HMAC-TOKEN-TEST-ORIGINAL', $appointment->qr_token);

        Notification::assertSentTo(
            $this->patientUser,
            RescheduleResultNotification::class
        );
    }

    public function test_admin_approval_detects_slot_conflict_double_booking(): void
    {
        $originalDate = now()->addDays(3)->format('Y-m-d');
        $requestedDate = now()->addDays(5)->format('Y-m-d');

        // Existing conflicting appointment on requestedDate, shift siang, bed 2
        $otherPatientUser = User::factory()->create(['role' => 'patient']);
        $otherPatient = Patient::create([
            'user_id' => $otherPatientUser->id,
            'medical_record_number' => 'RM-202607-888',
            'phone' => '089999999999',
            'status' => 'active',
        ]);

        Appointment::create([
            'patient_id' => $otherPatient->id,
            'appointment_date' => $requestedDate,
            'start_time' => '12:00:00',
            'end_time' => '16:00:00',
            'shift' => 'siang',
            'bed_number' => '2',
            'status' => Appointment::STATUS_SCHEDULED,
            'qr_token' => 'HMAC-TOKEN-CONFLICT',
        ]);

        $appointment = Appointment::create([
            'patient_id' => $this->patient->id,
            'appointment_date' => $originalDate,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => 'pagi',
            'bed_number' => '1',
            'status' => Appointment::STATUS_SCHEDULED,
            'qr_token' => 'HMAC-TOKEN-PATIENT-1',
        ]);

        $reschedule = RescheduleRequest::create([
            'appointment_id' => $appointment->id,
            'patient_id' => $this->patient->id,
            'requested_date' => $requestedDate,
            'requested_shift' => 'siang',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->post(route('admin.reschedule-requests.approve', $reschedule->id), [
                'bed_number' => '2', // Bed 2 is occupied!
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');

        $this->assertDatabaseHas('reschedule_requests', [
            'id' => $reschedule->id,
            'status' => 'pending',
        ]);
    }

    public function test_admin_can_reject_reschedule_request_with_reason(): void
    {
        Notification::fake();

        $originalDate = now()->addDays(3)->format('Y-m-d');
        $requestedDate = now()->addDays(5)->format('Y-m-d');

        $appointment = Appointment::create([
            'patient_id' => $this->patient->id,
            'appointment_date' => $originalDate,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => 'pagi',
            'bed_number' => '1',
            'status' => Appointment::STATUS_SCHEDULED,
            'qr_token' => 'HMAC-TOKEN-ORIGINAL-2',
        ]);

        $reschedule = RescheduleRequest::create([
            'appointment_id' => $appointment->id,
            'patient_id' => $this->patient->id,
            'requested_date' => $requestedDate,
            'requested_shift' => 'siang',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->post(route('admin.reschedule-requests.reject', $reschedule->id), [
                'admin_notes' => 'Kuota bed shift siang pada tanggal tersebut sudah penuh.',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('reschedule_requests', [
            'id' => $reschedule->id,
            'status' => 'rejected',
            'admin_notes' => 'Kuota bed shift siang pada tanggal tersebut sudah penuh.',
        ]);

        $appointment->refresh();
        $this->assertEquals($originalDate, $appointment->appointment_date->format('Y-m-d'));

        Notification::assertSentTo(
            $this->patientUser,
            RescheduleResultNotification::class
        );
    }
}
