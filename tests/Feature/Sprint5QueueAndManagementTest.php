<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\Medication;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class Sprint5QueueAndManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $patientUser1;
    protected User $patientUser2;
    protected Patient $patient1;
    protected Patient $patient2;
    protected Appointment $app1;
    protected Appointment $app2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'name' => 'Admin Queue',
            'email' => 'admin.queue@test.com',
            'role' => 'admin',
        ]);

        $this->patientUser1 = User::factory()->create([
            'name' => 'Pasien Queue 1',
            'email' => 'pasien1.queue@test.com',
            'role' => 'patient',
        ]);

        $this->patient1 = Patient::create([
            'user_id' => $this->patientUser1->id,
            'medical_record_number' => 'RM-S5-001',
            'phone' => '08123456701',
            'address' => 'Jakarta',
            'medical_conditions' => 'GGK Stage 5',
            'is_active' => true,
        ]);

        $this->patientUser2 = User::factory()->create([
            'name' => 'Pasien Queue 2',
            'email' => 'pasien2.queue@test.com',
            'role' => 'patient',
        ]);

        $this->patient2 = Patient::create([
            'user_id' => $this->patientUser2->id,
            'medical_record_number' => 'RM-S5-002',
            'phone' => '08123456702',
            'address' => 'Jakarta',
            'medical_conditions' => 'GGK Stage 5',
            'is_active' => true,
        ]);

        $today = Carbon::today()->toDateString();

        $this->app1 = Appointment::create([
            'patient_id' => $this->patient1->id,
            'admin_id' => $this->admin->id,
            'appointment_date' => $today,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => Appointment::SHIFT_PAGI,
            'bed_number' => 1,
            'status' => Appointment::STATUS_SCHEDULED,
            'qr_token' => Appointment::generateHmacQrToken($this->patient1->id, $today, 'pagi', 1),
        ]);

        $this->app2 = Appointment::create([
            'patient_id' => $this->patient2->id,
            'admin_id' => $this->admin->id,
            'appointment_date' => $today,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => Appointment::SHIFT_PAGI,
            'bed_number' => 2,
            'status' => Appointment::STATUS_SCHEDULED,
            'qr_token' => Appointment::generateHmacQrToken($this->patient2->id, $today, 'pagi', 2),
        ]);
    }

    public function test_admin_can_view_real_time_queue_and_estimated_wait_time(): void
    {
        $response = $this->actingAs($this->admin)->get(route('admin.queue.index'));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Queue/Index')
            ->has('appointments')
            ->has('stats')
        );
    }

    public function test_admin_can_mark_patient_arrived_manually(): void
    {
        $response = $this->actingAs($this->admin)->post(route('admin.queue.mark-arrived', $this->app1->id));

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('appointments', [
            'id' => $this->app1->id,
            'status' => Appointment::STATUS_CHECKED_IN,
        ]);

        $this->assertDatabaseHas('check_ins', [
            'appointment_id' => $this->app1->id,
            'source' => 'manual-admin',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'MANUAL_CHECK_IN',
        ]);
    }

    public function test_admin_can_trigger_manual_noshow_and_promote_next_patient(): void
    {
        $response = $this->actingAs($this->admin)->post(route('admin.queue.trigger-noshow', $this->app1->id), [
            'reason' => 'Pasien tidak datang setelah dihubungi',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('appointments', [
            'id' => $this->app1->id,
            'status' => Appointment::STATUS_NO_SHOW,
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'MANUAL_NO_SHOW',
        ]);
    }

    public function test_admin_can_crud_announcements(): void
    {
        // 1. Create Announcement
        $createResponse = $this->actingAs($this->admin)->post(route('admin.announcements.store'), [
            'title' => 'Pengumuman Libur Idul Fitri',
            'content' => 'Klinik akan beroperasi terbatas pada tanggal 10 April.',
            'publish_date' => Carbon::today()->toDateString(),
            'is_active' => true,
        ]);

        $createResponse->assertRedirect();
        $this->assertDatabaseHas('announcements', ['title' => 'Pengumuman Libur Idul Fitri']);

        $ann = Announcement::where('title', 'Pengumuman Libur Idul Fitri')->first();

        // 2. Toggle Status
        $toggleResponse = $this->actingAs($this->admin)->post(route('admin.announcements.toggle-status', $ann->id));
        $toggleResponse->assertRedirect();
        $this->assertDatabaseHas('announcements', ['id' => $ann->id, 'is_active' => false]);

        // 3. Delete Announcement
        $deleteResponse = $this->actingAs($this->admin)->delete(route('admin.announcements.destroy', $ann->id));
        $deleteResponse->assertRedirect();
        $this->assertDatabaseMissing('announcements', ['id' => $ann->id]);
    }

    public function test_patient_can_view_clinic_announcements(): void
    {
        Announcement::create([
            'admin_id' => $this->admin->id,
            'title' => 'Pengumuman Pasien',
            'content' => 'Konten pengumuman khusus pasien.',
            'publish_date' => Carbon::today()->toDateString(),
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->patientUser1)->get(route('patient.announcements.index'));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Patient/Announcements/Index'));
    }

    public function test_admin_can_crud_medications(): void
    {
        // 1. Create Medication
        $createResponse = $this->actingAs($this->admin)->post(route('admin.medications.store'), [
            'patient_id' => $this->patient1->id,
            'name' => 'Erythropoietin (EPO)',
            'dosage' => '4000 IU',
            'frequency' => '2x seminggu',
            'notes' => 'Pasca HD',
        ]);

        $createResponse->assertRedirect();
        $this->assertDatabaseHas('medications', [
            'patient_id' => $this->patient1->id,
            'name' => 'Erythropoietin (EPO)',
        ]);

        $med = Medication::where('name', 'Erythropoietin (EPO)')->first();

        // 2. Update Medication
        $updateResponse = $this->actingAs($this->admin)->put(route('admin.medications.update', $med->id), [
            'name' => 'Erythropoietin (EPO)',
            'dosage' => '5000 IU',
            'frequency' => '2x seminggu',
            'notes' => 'Dosis dinaikkan',
        ]);
        $updateResponse->assertRedirect();
        $this->assertDatabaseHas('medications', ['id' => $med->id, 'dosage' => '5000 IU']);

        // 3. Attach medication to appointment (FR-44)
        $attachResponse = $this->actingAs($this->admin)->post(route('admin.appointments.attach-medication', $this->app1->id), [
            'medication_id' => $med->id,
            'dosage_given' => '5000 IU',
            'notes' => 'Disuntikkan di bed #1',
        ]);
        $attachResponse->assertRedirect();
        $this->assertDatabaseHas('appointment_medications', [
            'appointment_id' => $this->app1->id,
            'medication_id' => $med->id,
        ]);

        // 4. Detach medication from appointment
        $detachResponse = $this->actingAs($this->admin)->delete(route('admin.appointments.detach-medication', [$this->app1->id, $med->id]));
        $detachResponse->assertRedirect();
        $this->assertDatabaseMissing('appointment_medications', [
            'appointment_id' => $this->app1->id,
            'medication_id' => $med->id,
        ]);
    }
}
