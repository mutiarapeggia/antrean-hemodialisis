<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Notifications\Channels\SmsNotificationChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NextPatientPromotionNotification extends Notification implements ShouldQueue
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
        $bedStr = $this->appointment->bed_number ? "Bed {$this->appointment->bed_number}" : 'Bed Utama';

        return (new MailMessage)
            ->subject("Promosi Antrean & Slot Kosong Hemodialisis - {$date}")
            ->greeting("Halo, {$patientName}!")
            ->line("Pemberitahuan penting: Terjadi pelepasan slot janji temu pada shift {$shiftLabel} hari ini.")
            ->line("Anda dipromosikan untuk dapat melakukan penanganan lebih awal jika diinginkan.")
            ->line("Detail Antrean Anda:")
            ->line("• No. RM: {$rm}")
            ->line("• Tanggal: {$date}")
            ->line("• Shift: {$shiftLabel} ({$timeStr})")
            ->line("• Slot Bed: {$bedStr}")
            ->line("Silakan melakukan check-in di kiosk klinik menggunakan Kode QR milik Anda.")
            ->action('Lihat Janji Temu Saya', url('/patient/appointments'))
            ->line('Terima kasih atas perhatian Anda.');
    }

    public function toWhatsApp(object $notifiable): string
    {
        $patientName = $this->appointment->patient->user->name ?? $notifiable->name ?? 'Pasien';
        $date = $this->appointment->appointment_date ? $this->appointment->appointment_date->format('d-m-Y') : '';
        $shiftLabel = ucfirst($this->appointment->shift);
        $bedStr = $this->appointment->bed_number ? "Bed #{$this->appointment->bed_number}" : 'Bed Utama';

        return "PROMOSI ANTREAN KLINIK: Halo {$patientName}, terdapat slot Bed kosong pada Shift {$shiftLabel} ({$date}) di {$bedStr}.\n\n" .
               "Anda berkesempatan untuk maju dan ditangani lebih awal. Silakan datang ke klinik dan scan Kode QR/No. RM Anda di Kiosk.";
    }

    public function toSms(object $notifiable): string
    {
        return $this->toWhatsApp($notifiable);
    }
}
