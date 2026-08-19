<?php

namespace App\Notifications\Channels;

use App\Services\WhatsappGatewayService;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use Throwable;

class WhatsappNotificationChannel
{
    protected WhatsappGatewayService $whatsappService;

    public function __construct(?WhatsappGatewayService $whatsappService = null)
    {
        $this->whatsappService = $whatsappService ?? app(WhatsappGatewayService::class);
    }

    public function send($notifiable, Notification $notification): void
    {
        try {
            $patient = $notifiable->patient ?? ($notifiable instanceof \App\Models\Patient ? $notifiable : null);
            $preference = strtolower($patient->notification_preference ?? 'both');

            $allowWa = in_array($preference, ['both', 'email_and_wa', 'whatsapp', 'wa_only']);

            if (!$allowWa) {
                return;
            }

            $phone = $patient->whatsapp_number 
                ?? $patient->phone 
                ?? $notifiable->phone_number 
                ?? $notifiable->whatsapp_number 
                ?? $notifiable->phone 
                ?? null;

            if (empty($phone)) {
                return;
            }

            $message = null;
            if (method_exists($notification, 'toWhatsApp')) {
                $message = $notification->toWhatsApp($notifiable);
            } elseif (method_exists($notification, 'toSms')) {
                $message = $notification->toSms($notifiable);
            }

            if (!empty($message)) {
                $this->whatsappService->sendMessage($phone, $message);
            }
        } catch (Throwable $e) {
            Log::error("[WhatsappNotificationChannel Exception] " . $e->getMessage());
        }
    }
}
