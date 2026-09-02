<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Notifications\Channels\SmsNotificationChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PatientBedRelocatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public Appointment $appointment;
    public string $oldBed;
    public string $newBed;

    public function __construct(Appointment $appointment, string $oldBed, string $newBed)
    {
        $this->appointment = $appointment->loadMissing('patient.user');
        $this->oldBed = $oldBed;
        $this->newBed = $newBed;
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

        return (new MailMessage)
            ->subject("Pemberitahuan Pembaruan Nomor Bed Hemodialisis - {$date}")
            ->greeting("Halo, {$patientName}!")
            ->line("Terdapat penyesuaian alokasi bed otomatis untuk jadwal hemodialisis Anda pada tanggal {$date} (Shift {$shiftLabel}).")
            ->line("Detail Perubahan Bed:")
            ->line("• Bed Lama: Bed #{$this->oldBed}")
            ->line("• Bed Baru: Bed #{$this->newBed}")
            ->line("• No. RM: {$rm}")
            ->line("• Token QR Tiket Baru: {$this->appointment->qr_token}")
            ->line("Penyesuaian ini dilakukan untuk mendukung penanganan medis darurat. Silakan tunjukkan Kode QR terbaru saat check-in di Kiosk.")
            ->action('Lihat Tiket Terbaru', url('/patient/appointments'))
            ->line('Terima kasih atas perhatian dan kerja sama Anda.');
    }

    public function toSms(object $notifiable): string
    {
        $patientName = $this->appointment->patient->user->name ?? 'Pasien';
        $date = $this->appointment->appointment_date ? $this->appointment->appointment_date->format('d-m-Y') : '';
        $shiftLabel = ucfirst($this->appointment->shift);

        return "HEMOQUEUE INFO: Yth. {$patientName}, lokasi Bed janji temu Anda tgl {$date} (Shift {$shiftLabel}) dipindahkan dari Bed #{$this->oldBed} ke Bed #{$this->newBed} untuk penyesuaian medis. Tiket QR Code baru telah diperbarui.";
    }
}
