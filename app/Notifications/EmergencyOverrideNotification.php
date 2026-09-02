<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Notifications\Channels\SmsNotificationChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EmergencyOverrideNotification extends Notification implements ShouldQueue
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
        $bedStr = $this->appointment->bed_number ? "Bed #{$this->appointment->bed_number}" : 'Sesuai Arahan Petugas';

        return (new MailMessage)
            ->subject("Konfirmasi Janji Temu DARURAT (Emergency) - {$date}")
            ->greeting("Halo, {$patientName}!")
            ->line("Janji temu Darurat (Emergency Override) Anda telah disetujui dan dialokasikan oleh Admin Medis.")
            ->line("Detail Janji Temu Darurat:")
            ->line("• No. RM: {$rm}")
            ->line("• Tanggal: {$date}")
            ->line("• Shift: {$shiftLabel}")
            ->line("• Posisi Bed Darurat: {$bedStr}")
            ->line("• Token QR: {$this->appointment->qr_token}")
            ->line("Silakan tunjukkan Kode QR ini saat tiba di unit hemodialisis klinik.")
            ->action('Lihat Tiket Darurat', url('/patient/appointments'))
            ->line('Terima kasih.');
    }

    public function toSms(object $notifiable): string
    {
        $patientName = $this->appointment->patient->user->name ?? 'Pasien';
        $date = $this->appointment->appointment_date ? $this->appointment->appointment_date->format('d-m-Y') : '';
        $shiftLabel = ucfirst($this->appointment->shift);
        $bedStr = $this->appointment->bed_number ? "Bed #{$this->appointment->bed_number}" : 'Sesuai Arahan';

        return "HEMOQUEUE URGENT: Yth. {$patientName}, Janji temu Darurat (Emergency) Anda tgl {$date} (Shift {$shiftLabel}) telah DISETUJUI pada {$bedStr}. Silakan tunjukkan QR Code Anda di Kiosk.";
    }
}
