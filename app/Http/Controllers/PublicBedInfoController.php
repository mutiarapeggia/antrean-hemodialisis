<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Bed;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class PublicBedInfoController extends Controller
{
    public function __invoke(): Response
    {
        $todayStr = Carbon::today()->toDateString();

        // All master beds
        $beds = Bed::orderBy('id', 'asc')->get();

        // Appointments scheduled for today
        $todayAppointments = Appointment::with(['patient.user'])
            ->whereDate('appointment_date', $todayStr)
            ->whereIn('status', [
                Appointment::STATUS_SCHEDULED,
                Appointment::STATUS_CHECKED_IN,
                Appointment::STATUS_COMPLETED,
            ])
            ->get();

        // Calculate statistics
        $totalBeds = $beds->count() > 0 ? $beds->count() : 10;
        $maintenanceCount = $beds->whereIn('status', [Bed::STATUS_MAINTENANCE, Bed::STATUS_DAMAGED])->count();
        
        $checkedInCount = $todayAppointments->where('status', Appointment::STATUS_CHECKED_IN)->count();
        $scheduledCount = $todayAppointments->where('status', Appointment::STATUS_SCHEDULED)->count();

        $occupiedCount = $beds->where('status', Bed::STATUS_OCCUPIED)->count() ?: $checkedInCount;
        $availableCount = max(0, $totalBeds - $occupiedCount - $maintenanceCount);

        return Inertia::render('Public/BedInformation', [
            'beds' => $beds,
            'stats' => [
                'total' => $totalBeds,
                'available' => $availableCount,
                'occupied' => $occupiedCount,
                'maintenance' => $maintenanceCount,
                'checked_in' => $checkedInCount,
                'scheduled' => $scheduledCount,
            ],
            'todayAppointments' => $todayAppointments,
            'todayDate' => Carbon::now('Asia/Jakarta')->translatedFormat('l, d F Y'),
            'currentTime' => Carbon::now('Asia/Jakarta')->format('H:i'),
        ]);
    }
}
