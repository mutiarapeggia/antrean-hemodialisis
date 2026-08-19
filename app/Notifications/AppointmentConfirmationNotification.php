<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Notifications\Channels\SmsNotificationChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentConfirmationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public Appointment $appointment;

    public function __construct(Appointment $appointment)
    {
        $this->appointment = $appointment->loadMissing('patient.user');
    }

    public function via(object $notifiable): array
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

    public function toMail(object $notifiable): MailMessage
    {
        $patientName = $this->appointment->patient->user->name ?? $notifiable->name ?? 'Pasien';
        $rm = $this->appointment->patient->medical_record_number ?? '-';
        $date = $this->appointment->appointment_date ? $this->appointment->appointment_date->format('d-m-Y') : '';
        $shiftLabel = ucfirst($this->appointment->shift);
        $timeStr = "{$this->appointment->start_time} - {$this->appointment->end_time}";
        $bedStr = $this->appointment->bed_number ? "Bed {$this->appointment->bed_number}" : 'Sesuai Arahan Petugas';

        return (new MailMessage)
            ->subject("Konfirmasi Janji Temu Hemodialisis - {$date}")
            ->greeting("Halo, {$patientName}!")
            ->line("Pendaftaran janji temu hemodialisis Anda telah berhasil dikonfirmasi.")
            ->line("Detail Janji Temu:")
            ->line("• No. RM: {$rm}")
            ->line("• Tanggal: {$date}")
            ->line("• Shift: {$shiftLabel} ({$timeStr})")
            ->line("• Posisi Bed: {$bedStr}")
            ->line("• Token QR: {$this->appointment->qr_token}")
            ->line("Silakan tunjukkan Kode QR saat melakukan check-in di kiosk klinik.")
            ->action('Lihat Janji Temu', url('/patient/appointments'))
            ->line('Terima kasih telah mempercayakan layanan kesehatan Anda pada Klinik Hemodialisis.');
    }

    public function toWhatsApp(object $notifiable): string
    {
        $patientName = $this->appointment->patient->user->name ?? $notifiable->name ?? 'Pasien';
        $rm = $this->appointment->patient->medical_record_number ?? '-';
        $date = $this->appointment->appointment_date ? $this->appointment->appointment_date->format('d-m-Y') : '';
        $shiftLabel = ucfirst($this->appointment->shift);

        return "KONFIRMASI JANJI TEMU: Halo {$patientName}, pendaftaran janji temu Anda telah dikonfirmasi.\n\n" .
               "• No. RM: {$rm}\n" .
               "• Tanggal: {$date}\n" .
               "• Shift: {$shiftLabel}\n\n" .
               "Silakan scan Kode QR / No. RM Anda pada mesin Kiosk saat tiba di klinik.";
    }

    public function toSms(object $notifiable): string
    {
        return $this->toWhatsApp($notifiable);
    }
}
