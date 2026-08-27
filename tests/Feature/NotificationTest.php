<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\User;
use App\Notifications\AppointmentReminderNotification;
use App\Notifications\CheckInSuccessNotification;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    protected User $patientUser;
    protected Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();

        $this->patientUser = User::factory()->create([
            'role' => 'patient',
        ]);

        $this->patient = Patient::create([
            'user_id' => $this->patientUser->id,
            'medical_record_number' => 'RM-202607-777',
            'phone' => '085555555555',
            'status' => 'active',
        ]);
    }

    public function test_artisan_command_sends_24h_and_1h_reminders(): void
    {
        Notification::fake();

        $tomorrowDate = now()->addDay()->format('Y-m-d');
        $todayDate = now()->format('Y-m-d');

        // Tomorrow appointment (24h)
        $app24h = Appointment::create([
            'patient_id' => $this->patient->id,
            'appointment_date' => $tomorrowDate,
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => 'pagi',
            'bed_number' => '1',
            'status' => Appointment::STATUS_SCHEDULED,
            'qr_token' => 'HMAC-REMINDER-24H',
        ]);

        // Today appointment starting in 30 mins (1h)
        $shiftStart = now()->addMinutes(30)->format('H:i:s');
        $shiftEnd = now()->addHours(4)->format('H:i:s');

        $app1h = Appointment::create([
            'patient_id' => $this->patient->id,
            'appointment_date' => $todayDate,
            'start_time' => $shiftStart,
            'end_time' => $shiftEnd,
            'shift' => 'pagi',
            'bed_number' => '2',
            'status' => Appointment::STATUS_SCHEDULED,
            'qr_token' => 'HMAC-REMINDER-1H',
        ]);

        $this->artisan('app:send-appointment-reminders')
            ->expectsOutputToContain('Sent')
            ->assertExitCode(0);

        Notification::assertSentTo(
            $this->patientUser,
            AppointmentReminderNotification::class
        );
    }

    public function test_check_in_kiosk_sends_check_in_success_notification(): void
    {
        Notification::fake();

        $todayStr = now()->format('Y-m-d');
        $token = Appointment::generateHmacQrToken($this->patient->id, $todayStr, 'pagi', '1');

        $appointment = Appointment::create([
            'patient_id' => $this->patient->id,
            'appointment_date' => $todayStr,
            'start_time' => now()->subMinutes(5)->format('H:i:s'),
            'end_time' => now()->addHours(4)->format('H:i:s'),
            'shift' => 'pagi',
            'bed_number' => '1',
            'status' => Appointment::STATUS_SCHEDULED,
            'qr_token' => $token,
        ]);

        $response = $this->postJson(route('api.check-in.web'), [
            'qr_token' => $token,
            'simulated_at' => "{$todayStr} 07:05:00",
        ]);

        $response->assertStatus(200);

        Notification::assertSentTo(
            $this->patientUser,
            CheckInSuccessNotification::class
        );
    }

    public function test_sms_notification_channel_placeholder_logs_message(): void
    {
        Log::shouldReceive('info')
            ->once()
            ->withArgs(function ($message, $context) {
                return str_contains($message, '[SMS/WhatsApp Channel Placeholder - FR-27]')
                    && isset($context['recipient_phone']);
            });

        $channel = new \App\Notifications\Channels\SmsNotificationChannel();
        
        $appointment = Appointment::create([
            'patient_id' => $this->patient->id,
            'appointment_date' => now()->format('Y-m-d'),
            'start_time' => '07:00:00',
            'end_time' => '11:00:00',
            'shift' => 'pagi',
            'bed_number' => '1',
            'status' => Appointment::STATUS_SCHEDULED,
            'qr_token' => 'HMAC-SMS-CHANNEL-TEST',
        ]);

        $notification = new CheckInSuccessNotification($appointment);
        $channel->send($this->patientUser, $notification);
    }
}
