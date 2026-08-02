<?php

namespace App\Notifications;

use App\Models\RescheduleRequest;
use App\Notifications\Channels\SmsNotificationChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RescheduleResultNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public RescheduleRequest $rescheduleRequest;

    public function __construct(RescheduleRequest $rescheduleRequest)
    {
        $this->rescheduleRequest = $rescheduleRequest;
    }

    public function via($notifiable): array
    {
        return ['mail', SmsNotificationChannel::class];
    }

    public function toMail($notifiable): MailMessage
    {
        $patientName = $notifiable->name ?? $this->rescheduleRequest->patient->user->name ?? 'Pasien';
        $isApproved = $this->rescheduleRequest->status === 'approved';
        $statusText = $isApproved ? 'DISETUJUI' : 'DITOLAK';

        $mail = (new MailMessage)
            ->subject("[Status Reschedule {$statusText}] Jadwal Hemodialisis - {$patientName}")
            ->greeting("Halo {$patientName},")
            ->line("Permohonan reschedule janji temu hemodialisis Anda telah diproses oleh admin:");

        if ($isApproved) {
            $appointment = $this->rescheduleRequest->appointment;
            $dateFormatted = date('d M Y', strtotime($this->rescheduleRequest->requested_date));
            $shiftFormatted = ucfirst($this->rescheduleRequest->requested_shift);
            $bedFormatted = $appointment->bed_number ? (str_starts_with($appointment->bed_number, 'Bed') ? $appointment->bed_number : "Bed {$appointment->bed_number}") : 'Utama';

            $mail->line("✅ STATUS: DISETUJUI")
                ->line("📅 Tanggal Baru: {$dateFormatted}")
                ->line("⏰ Shift Baru: {$shiftFormatted}")
                ->line("🛋️ Bed Alokasi: {$bedFormatted}")
                ->line("🔑 Token QR Check-In Baru: {$appointment->qr_code_token}")
                ->action('Lihat Jadwal Baru Saya', url('/patient/appointments'));
        } else {
            $mail->line("❌ STATUS: DITOLAK")
                ->line("Catatan Admin: " . ($this->rescheduleRequest->admin_notes ?? 'Tidak ada catatan tambahan.'))
                ->line("Jadwal janji temu Anda sebelumnya tetap berlaku.")
                ->action('Lihat Detail Janji Temu', url('/patient/appointments'));
        }

        return $mail->line('Terima kasih.');
    }

    public function toSms($notifiable): string
    {
        $isApproved = $this->rescheduleRequest->status === 'approved';
        if ($isApproved) {
            return "Reschedule DISETUJUI: Tanggal {$this->rescheduleRequest->requested_date}, Shift {$this->rescheduleRequest->requested_shift}. Silakan cek portal pasien.";
        }
        return "Reschedule DITOLAK: " . ($this->rescheduleRequest->admin_notes ?? 'Jadwal lama tetap berlaku') . ". Silakan cek portal pasien.";
    }
}
