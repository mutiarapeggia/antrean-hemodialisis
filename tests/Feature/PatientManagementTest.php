<?php

namespace Tests\Feature;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class PatientManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $patientUser;
    protected Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'name' => 'Admin Test',
            'email' => 'admin@test.com',
            'role' => 'admin',
        ]);

        $this->patientUser = User::factory()->create([
            'name' => 'Patient Test',
            'email' => 'patient@test.com',
            'role' => 'patient',
        ]);

        $this->patient = Patient::create([
            'user_id' => $this->patientUser->id,
            'medical_record_number' => 'RM-2026-001',
            'phone' => '08123456789',
            'address' => 'Jakarta',
            'medical_conditions' => 'Gagal Ginjal Kronis',
            'is_active' => true,
        ]);
    }

    public function test_admin_can_view_patients_index(): void
    {
        $response = $this->actingAs($this->admin)->get(route('admin.patients.index'));
        $response->assertStatus(200);
    }

    public function test_patient_cannot_view_admin_patients_index(): void
    {
        $response = $this->actingAs($this->patientUser)->get(route('admin.patients.index'));
        $response->assertRedirect(route('patient.dashboard'));
    }

    public function test_admin_can_create_patient(): void
    {
        $response = $this->actingAs($this->admin)->post(route('admin.patients.store'), [
            'name' => 'Pasien Baru',
            'email' => 'pasienbaru@test.com',
            'phone' => '08987654321',
            'medical_record_number' => 'RM-2026-002',
            'address' => 'Bandung',
            'medical_conditions' => 'Diabetes',
            'password' => 'password123',
        ]);

        $response->assertRedirect(route('admin.patients.index'));
        $this->assertDatabaseHas('users', ['email' => 'pasienbaru@test.com']);
        $this->assertDatabaseHas('patients', ['medical_record_number' => 'RM-2026-002']);
    }

    public function test_admin_can_update_patient(): void
    {
        $response = $this->actingAs($this->admin)->put(route('admin.patients.update', $this->patient->id), [
            'name' => 'Patient Updated',
            'email' => 'patient@test.com',
            'phone' => '08111111111',
            'medical_record_number' => 'RM-2026-001',
            'address' => 'Surakarta',
            'medical_conditions' => 'Gagal Ginjal',
            'is_active' => true,
        ]);

        $response->assertRedirect(route('admin.patients.index'));
        $this->assertDatabaseHas('patients', ['phone' => '08111111111']);
    }

    public function test_admin_can_toggle_patient_status(): void
    {
        $response = $this->actingAs($this->admin)->post(route('admin.patients.toggle-status', $this->patient->id));
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('patients', ['id' => $this->patient->id, 'is_active' => false]);
    }

    public function test_admin_can_export_csv(): void
    {
        $response = $this->actingAs($this->admin)->get(route('admin.patients.export'));
        $response->assertStatus(200);
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
    }
}
