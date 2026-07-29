<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Appointment;
use App\Models\Medication;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $patient = $request->user()->patient;

        if (! $patient) {
            return Inertia::render('Patient/Dashboard', [
                'patient' => null,
                'upcomingAppointments' => [],
                'medications' => [],
                'announcements' => [],
            ]);
        }

        $upcomingAppointments = Appointment::where('patient_id', $patient->id)
            ->whereDate('appointment_date', '>=', now()->format('Y-m-d'))
            ->orderBy('appointment_date', 'asc')
            ->orderBy('start_time', 'asc')
            ->get();

        $medications = Medication::where('patient_id', $patient->id)->get();

        $announcements = Announcement::where('is_active', true)
            ->orderBy('publish_date', 'desc')
            ->take(5)
            ->get();

        return Inertia::render('Patient/Dashboard', [
            'patient' => $patient,
            'upcomingAppointments' => $upcomingAppointments,
            'medications' => $medications,
            'announcements' => $announcements,
        ]);
    }
}
