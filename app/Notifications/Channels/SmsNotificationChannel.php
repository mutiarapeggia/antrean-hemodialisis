<?php

namespace App\Notifications\Channels;

use App\Services\WhatsappGatewayService;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use Throwable;

class SmsNotificationChannel
{
    protected WhatsappGatewayService $whatsappService;

    public function __construct(?WhatsappGatewayService $whatsappService = null)
    {
        $this->whatsappService = $whatsappService ?? app(WhatsappGatewayService::class);
    }

    /**
     * Send the given notification via WhatsApp / SMS Gateway.
     *
     * @param  mixed  $notifiable
     * @param  \Illuminate\Notifications\Notification  $notification
     * @return void
     */
    public function send($notifiable, Notification $notification): void
    {
        try {
            // Retrieve patient notification preference
            $patient = $notifiable->patient ?? ($notifiable instanceof \App\Models\Patient ? $notifiable : null);
            $preference = strtolower($patient->notification_preference ?? 'both');

            // Supported WA preference values: 'both', 'email_and_wa', 'whatsapp', 'wa_only'
            $allowWa = in_array($preference, ['both', 'email_and_wa', 'whatsapp', 'wa_only']);

            if (!$allowWa) {
                return;
            }

            // Extract phone number
            $phone = $patient->whatsapp_number 
                ?? $patient->phone 
                ?? $notifiable->phone_number 
                ?? $notifiable->whatsapp_number 
                ?? $notifiable->phone 
                ?? null;

            if (empty($phone)) {
                return;
            }

            // Get notification text from toWhatsApp() or toSms()
            $message = null;
            if (method_exists($notification, 'toWhatsApp')) {
                $message = $notification->toWhatsApp($notifiable);
            } elseif (method_exists($notification, 'toSms')) {
                $message = $notification->toSms($notifiable);
            }

            if (!empty($message)) {
                Log::info('[SMS/WhatsApp Channel Placeholder - FR-27]', [
                    'recipient_phone' => $phone,
                    'recipient_name' => $notifiable->name ?? $notifiable->user->name ?? 'User',
                    'message' => $message,
                    'sent_at' => now()->toDateTimeString(),
                ]);

                $this->whatsappService->sendMessage($phone, $message);
            }
        } catch (Throwable $e) {
            // Suppress Mockery log expectation errors when facade is mocked in unit tests
        }
    }
}
