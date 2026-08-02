<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Notifications\Channels\SmsNotificationChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CheckInSuccessNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public Appointment $appointment;

    public function __construct(Appointment $appointment)
    {
        $this->appointment = $appointment;
    }

    public function via($notifiable): array
    {
        return ['mail', SmsNotificationChannel::class];
    }

    public function toMail($notifiable): MailMessage
    {
        $patientName = $notifiable->name ?? $this->appointment->patient->user->name ?? 'Pasien';
        $bedFormatted = $this->appointment->bed_number ? (str_starts_with($this->appointment->bed_number, 'Bed') ? $this->appointment->bed_number : "Bed {$this->appointment->bed_number}") : 'Sesuai Arahan Petugas';

        return (new MailMessage)
            ->subject("[Check-In Berhasil] Kiosk Hemodialisis - {$patientName}")
            ->greeting("Halo {$patientName},")
            ->line("Selamat! Check-In Mandiri Kiosk Anda telah berhasil dicatat oleh sistem.")
            ->line("📅 Tanggal: " . date('d M Y', strtotime($this->appointment->appointment_date)))
            ->line("⏰ Shift: " . ucfirst($this->appointment->shift))
            ->line("🛋️ Alokasi Bed: {$bedFormatted}")
            ->line("Silakan menuju ke ruang perawatan hemodialisis dan menempati Bed yang telah dialokasikan.")
            ->action('Buka Portal Pasien', url('/patient/dashboard'))
            ->line('Semoga proses hemodialisis Anda berjalan dengan lancar!');
    }

    public function toSms($notifiable): string
    {
        return "Check-In Kiosk Berhasil: Pasien {$this->appointment->patient->user->name}, Shift {$this->appointment->shift}, Bed: {$this->appointment->bed_number}. Silakan menuju ruang perawatan.";
    }
}
