<?php

namespace App\Console\Commands;

use App\Services\WhatsappGatewayService;
use Illuminate\Console\Command;

class SendWaTestCommand extends Command
{
    protected $signature = 'wa:send {phone : Nomor HP penerima, misal 085246232785} {message=Tes pengiriman pesan WhatsApp dari Klinik Hemodialisis}';
    protected $description = 'Kirim pesan tes WhatsApp secara langsung menggunakan Fonnte API Gateway';

    public function handle(WhatsappGatewayService $gateway): int
    {
        $phone = $this->argument('phone');
        $message = $this->argument('message');

        $this->info("Mengirim pesan tes WA ke {$phone} via Fonnte Gateway...");

        $success = $gateway->sendMessage($phone, $message);

        if ($success) {
            $this->info("✅ BERHASIL: Pesan WhatsApp berhasil dikirim ke {$phone}.");
            return Command::SUCCESS;
        }

        $this->error("❌ GAGAL: Pesan WhatsApp tidak terkirim. Periksa storage/logs/laravel.log untuk detail kendala koneksi perangkat Fonnte.");
        return Command::FAILURE;
    }
}
