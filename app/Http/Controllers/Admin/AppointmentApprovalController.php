<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\Patient;
use App\Models\RescheduleRequest;
use App\Notifications\RescheduleResultNotification;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class AppointmentApprovalController extends Controller
{
    public function index(Request $request): Response
    {
        $type = $request->input('type', 'all'); // 'all', 'new_appointment', 'reschedule'
        $status = $request->input('status', 'pending'); // 'pending', 'approved', 'rejected', 'all'

        // 1. Fetch New Appointments
        $appQuery = Appointment::with(['patient.user', 'approvedBy'])->latest();

        if ($status === 'pending') {
            $appQuery->where('approval_status', 'pending_approval');
        } elseif ($status === 'approved') {
            $appQuery->where('approval_status', 'approved');
        } elseif ($status === 'rejected') {
            $appQuery->where('approval_status', 'rejected');
        }

        $appointments = $appQuery->paginate(15, ['*'], 'new_page')->withQueryString();

        // 2. Fetch Reschedule Requests
        $rescheduleQuery = RescheduleRequest::with(['appointment', 'patient.user'])->latest();

        if ($status === 'pending') {
            $rescheduleQuery->where('status', 'pending');
        } elseif ($status === 'approved') {
            $rescheduleQuery->where('status', 'approved');
        } elseif ($status === 'rejected') {
            $rescheduleQuery->where('status', 'rejected');
        }

        $rescheduleRequests = $rescheduleQuery->paginate(15, ['*'], 'reschedule_page')->withQueryString();

        // 3. Patients list for emergency override creation modal
        $patients = Patient::with('user')->where('is_active', true)->get();

        // 4. Combined Statistics
        $stats = [
            'total_pending' => Appointment::where('approval_status', 'pending_approval')->count() + RescheduleRequest::where('status', 'pending')->count(),
            'new_pending' => Appointment::where('approval_status', 'pending_approval')->count(),
            'reschedule_pending' => RescheduleRequest::where('status', 'pending')->count(),
            'approved_count' => Appointment::where('approval_status', 'approved')->count() + RescheduleRequest::where('status', 'approved')->count(),
            'rejected_count' => Appointment::where('approval_status', 'rejected')->count() + RescheduleRequest::where('status', 'rejected')->count(),
        ];

        $availableBeds = \App\Models\Bed::where('status', \App\Models\Bed::STATUS_AVAILABLE)->get()->sortBy(fn($b) => (int) preg_replace('/\D/', '', $b->bed_number))->values();

        return Inertia::render('Admin/Appointments/Approvals', [
            'appointments' => $appointments,
            'rescheduleRequests' => $rescheduleRequests,
            'patients' => $patients,
            'availableBeds' => $availableBeds,
            'stats' => $stats,
            'filters' => [
                'type' => $type,
                'status' => $status,
            ],
        ]);
    }

    public function approve(Request $request, Appointment $appointment): RedirectResponse
    {
        $validated = $request->validate([
            'bed_number' => 'nullable|string',
            'emergency_override' => 'nullable|boolean',
            'admin_notes' => 'nullable|string|max:500',
        ]);

        $bedNumber = trim($validated['bed_number'] ?? $appointment->bed_number ?? '1');
        $emergencyOverride = (bool) ($validated['emergency_override'] ?? false);
        $dateStr = $appointment->appointment_date->toDateString();

        // Validate bed conflict if emergency_override is NOT checked
        if (!$emergencyOverride) {
            $conflict = Appointment::whereDate('appointment_date', $dateStr)
                ->where('shift', $appointment->shift)
                ->where('bed_number', $bedNumber)
                ->whereIn('status', [
                    Appointment::STATUS_SCHEDULED,
                    Appointment::STATUS_CHECKED_IN,
                    Appointment::STATUS_IN_PROGRESS,
                ])
                ->where('id', '!=', $appointment->id)
                ->first();

            if ($conflict) {
                return back()->with('error', "Gagal! Slot Bed {$bedNumber} pada Shift " . ucfirst($appointment->shift) . " tanggal {$dateStr} sudah terisi. Gunakan Emergency Override jika ini adalah kondisi darurat medis.");
            }
        }

        DB::transaction(function () use ($appointment, $bedNumber, $emergencyOverride) {
            $lockedAppointment = Appointment::where('id', $appointment->id)->lockForUpdate()->first();

            $qrToken = Appointment::generateHmacQrToken(
                $lockedAppointment->patient_id,
                $lockedAppointment->appointment_date->toDateString(),
                $lockedAppointment->shift,
                $bedNumber
            );

            $lockedAppointment->update([
                'bed_number' => $bedNumber,
                'approval_status' => 'approved',
                'approved_by' => auth()->id(),
                'status' => Appointment::STATUS_SCHEDULED,
                'emergency_override' => $emergencyOverride,
                'qr_token' => $qrToken,
            ]);

            AuditLog::log(
                'APPOINTMENT_APPROVED',
                "Janji temu #{$lockedAppointment->id} pasien {$lockedAppointment->patient->user->name} disetujui oleh admin. Bed: #{$bedNumber} (Emergency: " . ($emergencyOverride ? 'YA' : 'TIDAK') . ").",
                auth()->id()
            );

            // Send Realtime Notification (Email & WA)
            if ($lockedAppointment->patient && $lockedAppointment->patient->user) {
                try {
                    $lockedAppointment->patient->user->notify(new \App\Notifications\AppointmentApprovedNotification($lockedAppointment));
                } catch (Throwable $e) {
                    // Suppress notification dispatch error in transaction
                }
            }
        });

        return back()->with('success', 'Janji temu berhasil disetujui dan slot bed dialokasikan!');
    }

    public function reject(Request $request, Appointment $appointment): RedirectResponse
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ], [
            'reason.required' => 'Alasan penolakan wajib diisi untuk diinformasikan kepada pasien.',
        ]);

        $appointment->update([
            'approval_status' => 'rejected',
            'status' => Appointment::STATUS_CANCELLED,
            'cancellation_reason' => $request->reason,
            'approved_by' => auth()->id(),
        ]);

        AuditLog::log(
            'APPOINTMENT_REJECTED',
            "Janji temu #{$appointment->id} ditolak. Alasan: {$request->reason}",
            auth()->id()
        );

        return back()->with('success', 'Janji temu telah ditolak dan status diperbarui.');
    }

    public function emergencyOverride(Request $request): RedirectResponse
    {
        $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'appointment_date' => 'required|date',
            'shift' => 'required|in:pagi,siang',
            'bed_number' => 'required',
            'emergency_reason' => 'required|string|max:500',
        ]);

        $times = Appointment::getShiftTimes($request->shift);
        $bedNumber = trim($request->bed_number);

        DB::transaction(function () use ($request, $times, $bedNumber) {
            $qrToken = Appointment::generateHmacQrToken(
                $request->patient_id,
                $request->appointment_date,
                $request->shift,
                $bedNumber
            );

            Appointment::create([
                'patient_id' => $request->patient_id,
                'admin_id' => auth()->id(),
                'appointment_date' => $request->appointment_date,
                'start_time' => $times['start_time'],
                'end_time' => $times['end_time'],
                'shift' => $request->shift,
                'bed_number' => $bedNumber,
                'status' => Appointment::STATUS_SCHEDULED,
                'approval_status' => 'approved',
                'approved_by' => auth()->id(),
                'emergency_override' => true,
                'qr_token' => $qrToken,
            ]);

            AuditLog::log(
                'EMERGENCY_OVERRIDE_APPOINTMENT',
                "Emergency Override Janji Temu Bed #{$bedNumber} ({$request->shift}) oleh Admin. Alasan: {$request->emergency_reason}",
                auth()->id()
            );
        });

        return back()->with('success', 'Janji temu Darurat (Emergency Override) berhasil didaftarkan!');
    }
}
