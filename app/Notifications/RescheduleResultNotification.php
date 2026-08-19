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
        $patient = $notifiable->patient ?? ($notifiable instanceof \App\Models\Patient ? $notifiable : null);
        $pref = strtolower($patient->notification_preference ?? 'both');

        $channels = [];
        if (in_array($pref, ['both', 'email_and_wa', 'email', 'email_only'])) {
            $channels[] = 'mail';
        }
        if (in_array($pref, ['both', 'email_and_wa', 'whatsapp', 'wa_only'])) {
            $channels[] = SmsNotificationChannel::class;
        }

        return !empty($channels) ? $channels : ['mail', SmsNotificationChannel::class];
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
            $bedFormatted = $appointment ? ($appointment->bed_number ? "Bed #{$appointment->bed_number}" : 'Bed Utama') : 'Bed Utama';

            $mail->line("✅ STATUS: DISETUJUI")
                ->line("📅 Tanggal Baru: {$dateFormatted}")
                ->line("⏰ Shift Baru: {$shiftFormatted}")
                ->line("🛋️ Bed Alokasi: {$bedFormatted}")
                ->action('Lihat Jadwal Baru Saya', url('/patient/appointments'));
        } else {
            $mail->line("❌ STATUS: DITOLAK")
                ->line("Catatan Admin: " . ($this->rescheduleRequest->admin_notes ?? 'Tidak ada catatan tambahan.'))
                ->line("Jadwal janji temu Anda sebelumnya tetap berlaku.")
                ->action('Lihat Detail Janji Temu', url('/patient/appointments'));
        }

        return $mail->line('Terima kasih.');
    }

    public function toWhatsApp($notifiable): string
    {
        $patientName = $notifiable->name ?? $this->rescheduleRequest->patient->user->name ?? 'Pasien';
        $isApproved = $this->rescheduleRequest->status === 'approved';

        if ($isApproved) {
            $dateFormatted = date('d M Y', strtotime($this->rescheduleRequest->requested_date));
            $shiftFormatted = ucfirst($this->rescheduleRequest->requested_shift);
            return "STATUS RESCHEDULE DISETUJUI: Halo {$patientName}, permohonan reschedule Anda telah DISETUJUI.\n\n" .
                   "• Tanggal Baru: {$dateFormatted}\n" .
                   "• Shift Baru: {$shiftFormatted}\n\n" .
                   "Silakan cek portal pasien untuk melihat detail jadwal baru Anda.";
        }

        return "STATUS RESCHEDULE DITOLAK: Halo {$patientName}, permohonan reschedule Anda DITOLAK.\n\n" .
               "• Catatan: " . ($this->rescheduleRequest->admin_notes ?? 'Jadwal lama tetap berlaku') . "\n\n" .
               "Jadwal lama Anda tetap berlaku.";
    }

    public function toSms($notifiable): string
    {
        return $this->toWhatsApp($notifiable);
    }
}
