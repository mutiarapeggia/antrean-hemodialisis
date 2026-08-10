<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsappGatewayService
{
    /**
     * Send a WhatsApp message to a target phone number using configured WA Gateway.
     */
    public function sendMessage(string $targetPhone, string $message): bool
    {
        $gatewayUrl = config('services.whatsapp.url', 'https://api.fonnte.com/send');
        $apiKey = config('services.whatsapp.token', 'dummy-token');

        // Log formatted output for audit & local development
        Log::info("[WhatsApp Gateway] Dispatching message to {$targetPhone}: {$message}");

        if (empty($targetPhone)) {
            return false;
        }

        try {
            // Send request if API key is configured
            if ($apiKey !== 'dummy-token') {
                $response = Http::withHeaders([
                    'Authorization' => $apiKey,
                ])->post($gatewayUrl, [
                    'target' => $targetPhone,
                    'message' => $message,
                ]);

                return $response->successful();
            }
            
            return true;
        } catch (\Throwable $e) {
            Log::error("[WhatsApp Gateway Error] " . $e->getMessage());
            return false;
        }
    }
}
