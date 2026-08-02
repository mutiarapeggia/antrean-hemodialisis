<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

class SmsNotificationChannel
{
    /**
     * Send the given notification via SMS/WhatsApp placeholder log.
     *
     * @param  mixed  $notifiable
     * @param  \Illuminate\Notifications\Notification  $notification
     * @return void
     */
    public function send($notifiable, Notification $notification): void
    {
        if (method_exists($notification, 'toSms')) {
            $message = $notification->toSms($notifiable);
            
            Log::info('[SMS/WhatsApp Channel Placeholder - FR-27]', [
                'recipient_phone' => $notifiable->phone ?? $notifiable->user->phone ?? 'N/A',
                'recipient_name' => $notifiable->name ?? $notifiable->user->name ?? 'User',
                'message' => $message,
                'sent_at' => now()->toDateTimeString(),
            ]);
        }
    }
}
