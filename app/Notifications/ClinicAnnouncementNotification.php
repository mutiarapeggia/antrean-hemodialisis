<?php

namespace App\Notifications;

use App\Models\Announcement;
use App\Notifications\Channels\SmsNotificationChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ClinicAnnouncementNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public Announcement $announcement;

    public function __construct(Announcement $announcement)
    {
        $this->announcement = $announcement;
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
        return (new MailMessage)
            ->subject("Pengumuman Klinik: {$this->announcement->title}")
            ->greeting("Halo {$notifiable->name},")
            ->line("Klinik Hemodialisis mempublikasikan pengumuman penting:")
            ->line("📌 Judul: {$this->announcement->title}")
            ->line("📅 Tanggal: {$this->announcement->publish_date}")
            ->line("Pesan:")
            ->line($this->announcement->content)
            ->action('Lihat Pengumuman di Portal', route('patient.announcements.index'))
            ->line('Terima kasih atas perhatian Anda.');
    }

    public function toWhatsApp($notifiable): string
    {
        return "PENGUMUMAN KLINIK HEMODIALISIS: {$this->announcement->title}\n\n" .
               "{$this->announcement->content}\n\n" .
               "Tanggal: {$this->announcement->publish_date}";
    }

    public function toSms($notifiable): string
    {
        return $this->toWhatsApp($notifiable);
    }
}
