<?php

namespace App\Notifications\Channels;

use App\Services\WhatsappGatewayService;
use Illuminate\Notifications\Notification;

class WhatsappNotificationChannel
{
    protected WhatsappGatewayService $whatsappService;

    public function __construct(WhatsappGatewayService $whatsappService)
    {
        $this->whatsappService = $whatsappService;
    }

    public function send($notifiable, Notification $notification): void
    {
        if (!method_exists($notification, 'toWhatsapp')) {
            return;
        }

        // Check patient notification preference
        $patient = $notifiable->patient ?? null;
        $preference = $patient ? $patient->notification_preference : 'both';

        if (in_array($preference, ['whatsapp', 'both'])) {
            $phone = $patient->whatsapp_number ?? $patient->phone ?? $notifiable->phone ?? null;
            if ($phone) {
                $message = $notification->toWhatsapp($notifiable);
                if (!empty($message)) {
                    $this->whatsappService->sendMessage($phone, $message);
                }
            }
        }
    }
}
