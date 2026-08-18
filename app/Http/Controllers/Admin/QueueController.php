<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\CheckIn;

use App\Notifications\CheckInSuccessNotification;
use App\Notifications\NextPatientPromotionNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class QueueController extends Controller
{
    /**
     * Public TV Display Monitor (/monitor)
     */
    public function monitorDisplay(Request $request): Response
    {
        $todayDate = Carbon::today()->toDateString();

        $appointments = Appointment::with(['patient.user', 'checkIn'])
            ->whereDate('appointment_date', $todayDate)
            ->orderBy('shift', 'asc')
            ->orderBy('bed_number', 'asc')
            ->get();

        $stats = [
            'total' => $appointments->count(),
            'checked_in' => $appointments->where('status', Appointment::STATUS_CHECKED_IN)->count(),
            'in_progress' => $appointments->where('status', Appointment::STATUS_IN_PROGRESS)->count(),
            'scheduled' => $appointments->where('status', Appointment::STATUS_SCHEDULED)->count(),
            'completed' => $appointments->where('status', Appointment::STATUS_COMPLETED)->count(),
        ];

        return Inertia::render('Monitor/Index', [
            'appointments' => $appointments,
            'stats' => $stats,
            'todayDate' => $todayDate,
        ]);
    }

    /**
     * Real-time Queue Monitor & Audit Logs Index
     */
    public function index(Request $request): Response
    {
        $selectedDate = $request->input('date', Carbon::today()->toDateString());
        $selectedShift = $request->input('shift', 'all');
        $selectedStatus = $request->input('status', 'all');

        $query = Appointment::with(['patient.user', 'checkIn', 'medications'])
            ->whereDate('appointment_date', $selectedDate);

        if ($selectedShift !== 'all') {
            $query->where('shift', $selectedShift);
        }

        if ($selectedStatus !== 'all') {
            $query->where('status', $selectedStatus);
        }

        $appointments = $query->orderBy('shift', 'asc')
            ->orderBy('bed_number', 'asc')
            ->orderBy('start_time', 'asc')
            ->get();

        // Calculate dynamic estimated waiting time & queue position for today's queue
        $queuePosition = 1;
        $formattedQueue = $appointments->map(function ($app) use (&$queuePosition) {
            $isWaiting = in_array($app->status, [Appointment::STATUS_SCHEDULED]);
            $estimatedWaitMinutes = 0;

            if ($isWaiting) {
                // Estimated waiting time: 15 minutes per position ahead in queue within shift
                $estimatedWaitMinutes = max(0, ($queuePosition - 1) * 15);
                $queuePosition++;
            }

            return array_merge($app->toArray(), [
                'estimated_wait_minutes' => $estimatedWaitMinutes,
                'queue_number' => $isWaiting ? 'A-' . str_pad($queuePosition - 1, 3, '0', STR_PAD_LEFT) : '-',
            ]);
        });

        // Audit Logs query
        $auditLogs = AuditLog::with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        // Summary Statistics for today
        $stats = [
            'total' => Appointment::whereDate('appointment_date', $selectedDate)->count(),
            'scheduled' => Appointment::whereDate('appointment_date', $selectedDate)->where('status', Appointment::STATUS_SCHEDULED)->count(),
            'checked_in' => Appointment::whereDate('appointment_date', $selectedDate)->where('status', Appointment::STATUS_CHECKED_IN)->count(),
            'in_progress' => Appointment::whereDate('appointment_date', $selectedDate)->where('status', Appointment::STATUS_IN_PROGRESS)->count(),
            'completed' => Appointment::whereDate('appointment_date', $selectedDate)->where('status', Appointment::STATUS_COMPLETED)->count(),
            'no_show' => Appointment::whereDate('appointment_date', $selectedDate)->where('status', Appointment::STATUS_NO_SHOW)->count(),
        ];

        return Inertia::render('Admin/Queue/Index', [
            'appointments' => $formattedQueue,
            'auditLogs' => $auditLogs,
            'stats' => $stats,
            'filters' => [
                'date' => $selectedDate,
                'shift' => $selectedShift,
                'status' => $selectedStatus,
            ],
        ]);
    }

    /**
     * FR-38: Admin action - Mark patient arrived / checked-in manually
     */
    public function markArrived(Request $request, Appointment $appointment): RedirectResponse
    {
        if (in_array($appointment->status, [Appointment::STATUS_COMPLETED, Appointment::STATUS_CANCELLED])) {
            return back()->with('error', 'Janji temu ini tidak dapat di-check-in (status: ' . $appointment->status . ').');
        }

        DB::transaction(function () use ($appointment, $request) {
            $appointment->update([
                'status' => Appointment::STATUS_CHECKED_IN,
            ]);

            CheckIn::updateOrCreate(
                ['appointment_id' => $appointment->id],
                [
                    'check_in_time' => now(),
                    'status' => 'on-time',
                    'source' => 'manual-admin',
                ]
            );

            // Audit log creation
            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'MANUAL_CHECK_IN',
                'description' => "Admin menandai kedatangan pasien {$appointment->patient->user->name} (Bed #{$appointment->bed_number}, Shift {$appointment->shift}) secara manual.",
                'ip_address' => $request->ip(),
                'created_at' => now(),
            ]);

            // Notify patient if email available
            if ($appointment->patient->user?->email) {
                $appointment->patient->user->notify(new CheckInSuccessNotification($appointment));
            }
        });

        return back()->with('success', "Pasien {$appointment->patient->user->name} berhasil ditandai tiba (Checked-In).");
    }

    /**
     * FR-37: Admin action - Trigger manual No-Show & promote next patient
     */
    public function triggerNoShow(Request $request, Appointment $appointment): RedirectResponse
    {
        $request->validate([
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        if (in_array($appointment->status, [Appointment::STATUS_COMPLETED, Appointment::STATUS_CANCELLED])) {
            return back()->with('error', 'Janji temu ini tidak dapat di-flag No-Show.');
        }

        $promotedPatientName = null;

        DB::transaction(function () use ($appointment, $request, &$promotedPatientName) {
            // Update status to no-show and release bed
            $appointment->update([
                'status' => Appointment::STATUS_NO_SHOW,
                'cancellation_reason' => $request->input('reason', 'Pemicu Manual No-Show oleh Admin'),
            ]);

            // Create Audit Log
            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'MANUAL_NO_SHOW',
                'description' => "Admin memicu No-Show manual untuk pasien {$appointment->patient->user->name} (Bed #{$appointment->bed_number}, Shift {$appointment->shift}). Slot dilepas.",
                'ip_address' => $request->ip(),
                'created_at' => now(),
            ]);

            // Promote next eligible patient scheduled for later today or same shift without bed
            $nextAppointment = Appointment::with(['patient.user'])
                ->whereDate('appointment_date', $appointment->appointment_date)
                ->where('shift', $appointment->shift)
                ->where('status', Appointment::STATUS_SCHEDULED)
                ->where('id', '!=', $appointment->id)
                ->orderBy('created_at', 'asc')
                ->first();

            if ($nextAppointment && $nextAppointment->patient->user?->email) {
                $nextAppointment->patient->user->notify(new NextPatientPromotionNotification($nextAppointment, $appointment));
                $promotedPatientName = $nextAppointment->patient->user->name;

                AuditLog::create([
                    'user_id' => auth()->id(),
                    'action' => 'PATIENT_PROMOTED',
                    'description' => "Pasien berikutnya {$promotedPatientName} menerima email pemberitahuan promosi jam hemodialisis lebih awal.",
                    'ip_address' => $request->ip(),
                    'created_at' => now(),
                ]);
            }
        });

        $message = "Status No-Show berhasil diterapkan untuk pasien {$appointment->patient->user->name}. Slot dilepas.";
        if ($promotedPatientName) {
            $message .= " Pasien berikutnya ({$promotedPatientName}) telah diberitahu via email untuk datang lebih awal.";
        }

        return back()->with('success', $message);
    }
}
