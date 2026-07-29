<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\RescheduleRequest;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $today = now()->format('Y-m-d');

        $stats = [
            'total_patients' => Patient::where('is_active', true)->count(),
            'today_appointments' => Appointment::whereDate('appointment_date', $today)->count(),
            'today_checked_in' => Appointment::whereDate('appointment_date', $today)->where('status', 'checked-in')->count(),
            'pending_reschedules' => RescheduleRequest::where('status', 'pending')->count(),
        ];

        $todayAppointments = Appointment::with(['patient.user'])
            ->whereDate('appointment_date', $today)
            ->orderBy('start_time', 'asc')
            ->get();

        $latestAnnouncements = Announcement::where('is_active', true)
            ->orderBy('publish_date', 'desc')
            ->take(3)
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'todayAppointments' => $todayAppointments,
            'latestAnnouncements' => $latestAnnouncements,
        ]);
    }
}
