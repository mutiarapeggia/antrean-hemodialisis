<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\CheckIn;
use App\Notifications\NextPatientPromotionNotification;
use Carbon\Carbon;
use Illuminate\Console\Command;

class ProcessNoShowAppointments extends Command
{
    protected $signature = 'app:process-no-shows {--date= : Custom date Y-m-d for processing}';
    protected $description = 'Proses otomatis janji temu yang belum check-in setelah 15 menit shift berjalan';

    public function handle(): int
    {
        $dateStr = $this->option('date') ?: now()->format('Y-m-d');
        $currentTime = now();

        $processedCount = 0;

        $shifts = [
            'pagi' => '07:00:00',
            'siang' => '12:00:00',
        ];

        foreach ($shifts as $shiftKey => $startTime) {
            $shiftStart = Carbon::parse("{$dateStr} {$startTime}");
            $cutoffTime = $shiftStart->copy()->addMinutes(15);

            // If processing for today, only run if cutoff has passed. If processing for past date, always run.
            if ($currentTime->gt($cutoffTime) || $this->option('date')) {
                $pendingAppointments = Appointment::with(['patient.user'])
                    ->whereDate('appointment_date', $dateStr)
                    ->where('shift', $shiftKey)
                    ->where('status', Appointment::STATUS_SCHEDULED)
                    ->get();

                foreach ($pendingAppointments as $app) {
                    $app->update([
                        'status' => Appointment::STATUS_NO_SHOW,
                    ]);

                    CheckIn::create([
                        'appointment_id' => $app->id,
                        'check_in_time' => now(),
                        'status' => 'late',
                        'source' => 'system',
                    ]);

                    $patientName = $app->patient->user->name ?? 'Pasien';
                    $rm = $app->patient->medical_record_number ?? '-';

                    AuditLog::create([
                        'user_id' => $app->patient->user->id ?? null,
                        'action' => 'AUTOMATIC_NO_SHOW_PROCESSED',
                        'description' => "System processed automatic No-Show for {$patientName} ({$rm}) after 15-min tolerance window expired.",
                        'ip_address' => '127.0.0.1',
                        'created_at' => now(),
                    ]);

                    // Promote next waiting patient
                    $this->promoteNextPatient($dateStr, $shiftKey, $app->id);

                    $processedCount++;
                }
            }
        }

        $this->info("Proses No-Show selesai. Total {$processedCount} janji temu ditandai sebagai No-Show.");
        return Command::SUCCESS;
    }

    private function promoteNextPatient(string $date, string $shift, int $currentAppointmentId): void
    {
        $nextAppointment = Appointment::with('patient.user')
            ->whereDate('appointment_date', $date)
            ->where('shift', $shift)
            ->where('id', '!=', $currentAppointmentId)
            ->where('status', Appointment::STATUS_SCHEDULED)
            ->orderBy('id', 'asc')
            ->first();

        if ($nextAppointment && $nextAppointment->patient && $nextAppointment->patient->user) {
            try {
                $nextAppointment->patient->user->notify(new NextPatientPromotionNotification($nextAppointment));
            } catch (\Exception $e) {
                // Suppress email exception in console command
            }
        }
    }
}
