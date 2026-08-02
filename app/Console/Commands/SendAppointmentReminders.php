<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Notifications\AppointmentReminderNotification;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Throwable;

class SendAppointmentReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:send-appointment-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send 24-hour (H-1) and 1-hour appointment reminder notifications to patients';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $now = now();
        $tomorrowDate = $now->copy()->addDay()->format('Y-m-d');
        $todayDate = $now->format('Y-m-d');

        $this->info("Checking appointment reminders at {$now->toDateTimeString()}...");

        // 1. Send 24-Hour (H-1) Reminders
        $tomorrowAppointments = Appointment::with(['patient.user'])
            ->whereDate('appointment_date', $tomorrowDate)
            ->where('status', Appointment::STATUS_SCHEDULED)
            ->get();

        $count24h = 0;
        foreach ($tomorrowAppointments as $app) {
            if ($app->patient && $app->patient->user) {
                try {
                    $app->patient->user->notify(new AppointmentReminderNotification($app, '24h'));
                    $count24h++;
                } catch (Throwable $e) {
                    $this->error("Failed to send 24h reminder to {$app->patient->user->name}: " . $e->getMessage());
                }
            }
        }
        $this->info("Sent {$count24h} 24-hour (H-1) reminder notifications.");

        // 2. Send 1-Hour Reminders
        $todayAppointments = Appointment::with(['patient.user'])
            ->whereDate('appointment_date', $todayDate)
            ->where('status', Appointment::STATUS_SCHEDULED)
            ->get();

        $count1h = 0;
        foreach ($todayAppointments as $app) {
            $shiftStart = Carbon::parse("{$todayDate} {$app->start_time}");
            $diffInMinutes = $now->diffInMinutes($shiftStart, false);

            // If shift starts in 0 to 90 minutes from now
            if ($diffInMinutes >= 0 && $diffInMinutes <= 90) {
                if ($app->patient && $app->patient->user) {
                    try {
                        $app->patient->user->notify(new AppointmentReminderNotification($app, '1h'));
                        $count1h++;
                    } catch (Throwable $e) {
                        $this->error("Failed to send 1h reminder to {$app->patient->user->name}: " . $e->getMessage());
                    }
                }
            }
        }
        $this->info("Sent {$count1h} 1-hour reminder notifications.");

        return Command::SUCCESS;
    }
}
