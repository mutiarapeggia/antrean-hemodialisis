<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\RescheduleRequest;
use App\Models\User;
use App\Notifications\AppointmentApprovedNotification;
use App\Notifications\ClinicAnnouncementNotification;
use App\Notifications\NextPatientPromotionNotification;
use App\Notifications\RescheduleResultNotification;
use App\Services\WhatsappGatewayService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class RealtimeNotificationEngineTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $patientUser;
    protected Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'name' => 'Admin Notif',
            'email' => 'admin.notif@test.com',
            'role' => 'admin',
        ]);

        $this->patientUser = User::factory()->create([
            'name' => 'Budi Santoso',
            'email' => 'budi.santoso@test.com',
            'role' => 'patient',
        ]);

        $this->patient = Patient::create([
            'user_id' => $this->patientUser->id,
            'medical_record_number' => 'RM-NOTIF-001',
            'phone' => '081234567890',
            'address' => 'Jakarta',
            'medical_conditions' => 'GGK Stage 5',
            'is_active' => true,
            'approval_status' => 'approved',
            'notification_preference' => 'both',
            'whatsapp_number' => '081234567890',
        ]);
    }

    public function test_whatsapp_gateway_service_formats_indonesian_phone_number(): void
    {
        $waService = new WhatsappGatewayService();

        $this->assertEquals('6281234567890', $waService->formatPhoneNumber('081234567890'));
        $this->assertEquals('6281234567890', $waService->formatPhoneNumber('+6281234567890'));
        $this->assertEquals('6281234567890', $waService->formatPhoneNumber('81234567890'));
        $this->assertEquals('6281234567890', $waService->formatPhoneNumber('6281234567890'));
    }

    public function test_appointment_approved_notification_dispatches_mail_and_wa(): void
    {
        $today = Carbon::today()->toDateString();
        $app = Appointment::create([
            'patient_id' => $this->patient->id,
            'appointment_date' => $today,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => 'pagi',
            'bed_number' => 1,
            'status' => 'scheduled',
            'approval_status' => 'approved',
            'qr_token' => 'token-test',
        ]);

        $notif = new AppointmentApprovedNotification($app);
        $channels = $notif->via($this->patientUser);

        $this->assertContains('mail', $channels);
        $this->assertContains(\App\Notifications\Channels\SmsNotificationChannel::class, $channels);

        $mail = $notif->toMail($this->patientUser);
        $this->assertStringContainsString('DISETUJUI', $mail->subject);

        $waText = $notif->toWhatsApp($this->patientUser);
        $this->assertStringContainsString('RM-NOTIF-001', $waText);
    }

    public function test_next_patient_promotion_notification_formatting(): void
    {
        $today = Carbon::today()->toDateString();
        $app = Appointment::create([
            'patient_id' => $this->patient->id,
            'appointment_date' => $today,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => 'pagi',
            'bed_number' => 1,
            'status' => 'scheduled',
            'qr_token' => 'token-test-2',
        ]);

        $notif = new NextPatientPromotionNotification($app);
        $waText = $notif->toWhatsApp($this->patientUser);
        $this->assertStringContainsString('PROMOSI ANTREAN KLINIK', $waText);
    }

    public function test_reschedule_result_notification_formatting(): void
    {
        $app = Appointment::create([
            'patient_id' => $this->patient->id,
            'appointment_date' => Carbon::today()->toDateString(),
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => 'pagi',
            'bed_number' => 1,
            'status' => 'scheduled',
            'qr_token' => 'token-test-3',
        ]);

        $reschedule = RescheduleRequest::create([
            'appointment_id' => $app->id,
            'patient_id' => $this->patient->id,
            'requested_date' => Carbon::tomorrow()->toDateString(),
            'requested_shift' => 'siang',
            'reason' => 'Ada keperluan keluarga',
            'status' => 'approved',
        ]);

        $notif = new RescheduleResultNotification($reschedule);
        $waText = $notif->toWhatsApp($this->patientUser);
        $this->assertStringContainsString('STATUS RESCHEDULE DISETUJUI', $waText);
    }

    public function test_clinic_announcement_notification_formatting(): void
    {
        $announcement = Announcement::create([
            'admin_id' => $this->admin->id,
            'title' => 'Pemberitahuan Maintenance Sistem',
            'content' => 'Sistem akan mengalami pemeliharaan pada pukul 23:00 WIB.',
            'publish_date' => Carbon::today()->toDateString(),
            'is_active' => true,
        ]);

        $notif = new ClinicAnnouncementNotification($announcement);
        $waText = $notif->toWhatsApp($this->patientUser);
        $this->assertStringContainsString('PENGUMUMAN KLINIK HEMODIALISIS', $waText);
    }

    public function test_patient_can_update_notification_preference_and_phone(): void
    {
        $response = $this->actingAs($this->patientUser)->post(route('patient.notifications.update'), [
            'notification_preference' => 'wa_only',
            'whatsapp_number' => '081987654321',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('patients', [
            'id' => $this->patient->id,
            'notification_preference' => 'wa_only',
            'whatsapp_number' => '081987654321',
        ]);
    }
}
