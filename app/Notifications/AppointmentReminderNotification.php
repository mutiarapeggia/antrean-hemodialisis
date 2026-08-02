<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Notifications\Channels\SmsNotificationChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public Appointment $appointment;
    public string $type; // '24h' or '1h'

    public function __construct(Appointment $appointment, string $type = '24h')
    {
        $this->appointment = $appointment;
        $this->type = $type;
    }

    public function via($notifiable): array
    {
        return ['mail', SmsNotificationChannel::class];
    }

    public function toMail($notifiable): MailMessage
    {
        $patientName = $notifiable->name ?? $this->appointment->patient->user->name ?? 'Pasien';
        $timeInfo = $this->type === '24h' ? 'Besok' : '1 Jam Lagi';
        $dateFormatted = $this->appointment->appointment_date ? date('d M Y', strtotime($this->appointment->appointment_date)) : '-';
        $shiftFormatted = ucfirst($this->appointment->shift);
        $bedFormatted = $this->appointment->bed_number ? (str_starts_with($this->appointment->bed_number, 'Bed') ? $this->appointment->bed_number : "Bed {$this->appointment->bed_number}") : 'Sesuai Arahan Petugas';

        return (new MailMessage)
            ->subject("[Pengingat {$timeInfo}] Jadwal Hemodialisis - {$patientName}")
            ->greeting("Halo {$patientName},")
            ->line("Ini adalah pengingat otomatis untuk jadwal hemodialisis Anda ({$timeInfo}):")
            ->line("📅 Tanggal: {$dateFormatted}")
            ->line("⏰ Shift: {$shiftFormatted} ({$this->appointment->start_time} - {$this->appointment->end_time} WIB)")
            ->line("🛋️ Bed: {$bedFormatted}")
            ->line("🔑 Token QR Check-In: {$this->appointment->qr_code_token}")
            ->line("Mohon hadir tepat waktu di klinik. Gunakan Kiosk Check-In Mandiri saat tiba.")
            ->action('Lihat Jadwal Saya', url('/patient/appointments'))
            ->line('Terima kasih telah mempercayakan layanan kesehatan Anda di Klinik Hemodialisis.');
    }

    public function toSms($notifiable): string
    {
        $timeInfo = $this->type === '24h' ? 'besok' : '1 jam lagi';
        return "Pengingat Hemodialisis ({$timeInfo}): Tanggal {$this->appointment->appointment_date}, Shift {$this->appointment->shift}, Token: {$this->appointment->qr_code_token}. Mohon hadir tepat waktu.";
    }
}
