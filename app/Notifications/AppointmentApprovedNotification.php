<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Notifications\Channels\SmsNotificationChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentApprovedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public Appointment $appointment;

    public function __construct(Appointment $appointment)
    {
        $this->appointment = $appointment;
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
        $patient = $this->appointment->patient;
        $rm = $patient->medical_record_number ?? '-';
        $date = $this->appointment->appointment_date->format('d-m-Y');
        $shift = ucfirst($this->appointment->shift);
        $bed = $this->appointment->bed_number ? "Bed #{$this->appointment->bed_number}" : 'Bed Utama';

        return (new MailMessage)
            ->subject('Konfirmasi Persetujuan (DISETUJUI) Janji Temu Hemodialisis')
            ->greeting("Halo {$notifiable->name},")
            ->line("Permohonan janji temu hemodialisis Anda telah DISETUJUI oleh admin klinik.")
            ->line("Detail Janji Temu:")
            ->line("• No. Rekam Medis: {$rm}")
            ->line("• Tanggal: {$date}")
            ->line("• Shift Operasional: {$shift} (Jam 07:00 / 12:00 WIB)")
            ->line("• Alokasi Tempat Tidur: {$bed}")
            ->line("Instruksi: Tunjukkan Kode QR atau No. RM Anda pada mesin Kiosk saat tiba di klinik untuk melakukan check-in tepat waktu.")
            ->action('Lihat Detail & Kode QR', route('patient.appointments.index'))
            ->line('Terima kasih telah mempercayai layanan klinik kami.');
    }

    public function toWhatsApp($notifiable): string
    {
        $patient = $this->appointment->patient;
        $rm = $patient->medical_record_number ?? '-';
        $date = $this->appointment->appointment_date->format('d-m-Y');
        $shift = ucfirst($this->appointment->shift);
        $bed = $this->appointment->bed_number ? "Bed #{$this->appointment->bed_number}" : 'Bed Utama';

        return "HEMODIALISIS KLINIK: Halo {$notifiable->name}, janji temu Anda telah DISETUJUI.\n\n" .
               "• No. RM: {$rm}\n" .
               "• Tanggal: {$date}\n" .
               "• Shift: {$shift}\n" .
               "• Alokasi: {$bed}\n\n" .
               "Silakan scan Kode QR / No. RM Anda di mesin Kiosk saat tiba di klinik. Terima kasih.";
    }

    public function toSms($notifiable): string
    {
        return $this->toWhatsApp($notifiable);
    }
}
