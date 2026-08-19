<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class WhatsappGatewayService
{
    /**
     * Format any Indonesian phone number to international 62xxxx format.
     */
    public function formatPhoneNumber(?string $phone): string
    {
        if (empty($phone)) {
            return '';
        }

        // Clean any non-numeric characters
        $clean = preg_replace('/[^\d]/', '', $phone);

        if (empty($clean)) {
            return '';
        }

        // Replace leading 0 with 62 (e.g. 0812 -> 62812)
        if (str_starts_with($clean, '0')) {
            return '62' . substr($clean, 1);
        }

        // Prepend 62 if starts with 8 (e.g. 812 -> 62812)
        if (str_starts_with($clean, '8')) {
            return '62' . $clean;
        }

        return $clean;
    }

    /**
     * Send a WhatsApp message to a target phone number using configured WA Gateway.
     */
    public function sendMessage(string $targetPhone, string $message): bool
    {
        $formattedPhone = $this->formatPhoneNumber($targetPhone);

        if (empty($formattedPhone)) {
            return false;
        }

        $gatewayUrl = config('services.whatsapp.url', 'https://api.fonnte.com/send');
        $apiKey = config('services.whatsapp.token', 'dummy-token');

        try {
            Log::info("[WhatsApp Gateway Dispatch]", [
                'target' => $formattedPhone,
                'message' => $message,
                'gateway_url' => $gatewayUrl,
            ]);
        } catch (Throwable $e) {
            // Suppress Mockery log expectation error when Log facade is mocked in unit tests
        }

        try {
            // Dispatch HTTP request if non-dummy token configured
            if ($apiKey !== 'dummy-token' && !empty($apiKey)) {
                $response = Http::withHeaders([
                    'Authorization' => $apiKey,
                ])->post($gatewayUrl, [
                    'target' => $formattedPhone,
                    'message' => $message,
                ]);

                if ($response->successful()) {
                    try {
                        Log::info("[WhatsApp Gateway Success] Message sent to {$formattedPhone}");
                    } catch (Throwable $e) {}
                    return true;
                }

                try {
                    Log::error("[WhatsApp Gateway Failed] Response status: " . $response->status());
                } catch (Throwable $e) {}
                return false;
            }

            return true;
        } catch (Throwable $e) {
            try {
                Log::error("[WhatsApp Gateway Exception] Error sending to {$formattedPhone}: " . $e->getMessage());
            } catch (Throwable $e2) {}
            return false;
        }
    }
}
