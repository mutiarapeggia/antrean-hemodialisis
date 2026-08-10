<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\Patient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentApprovalController extends Controller
{
    public function index(Request $request): Response
    {
        $appointments = Appointment::with(['patient.user', 'approvedBy'])
            ->where('approval_status', 'pending_approval')
            ->latest()
            ->paginate(10);

        return Inertia::render('Admin/Appointments/Approvals', [
            'appointments' => $appointments,
        ]);
    }

    public function approve(Appointment $appointment): RedirectResponse
    {
        DB::transaction(function () use ($appointment) {
            // Pessimistic Locking to ensure slot integrity
            $lockedAppointment = Appointment::where('id', $appointment->id)->lockForUpdate()->first();

            $qrToken = Appointment::generateHmacQrToken(
                $lockedAppointment->patient_id,
                $lockedAppointment->appointment_date->toDateString(),
                $lockedAppointment->shift,
                $lockedAppointment->bed_number
            );

            $lockedAppointment->update([
                'approval_status' => 'approved',
                'approved_by' => auth()->id(),
                'status' => Appointment::STATUS_SCHEDULED,
                'qr_token' => $qrToken,
            ]);

            AuditLog::log(
                'APPOINTMENT_APPROVED',
                "Janji temu #{$lockedAppointment->id} untuk pasien {$lockedAppointment->patient->user->name} disetujui oleh admin.",
                auth()->id()
            );
        });

        return back()->with('success', 'Janji temu berhasil disetujui.');
    }

    public function reject(Request $request, Appointment $appointment): RedirectResponse
    {
        $request->validate([
            'reason' => 'required|string|max:500',
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

        return back()->with('success', 'Janji temu ditolak.');
    }

    public function emergencyOverride(Request $request): RedirectResponse
    {
        $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'appointment_date' => 'required|date',
            'shift' => 'required|in:pagi,siang',
            'bed_number' => 'required|integer|min:1|max:20',
            'emergency_reason' => 'required|string|max:500',
        ]);

        $times = Appointment::getShiftTimes($request->shift);

        $appointment = DB::transaction(function () use ($request, $times) {
            $qrToken = Appointment::generateHmacQrToken(
                $request->patient_id,
                $request->appointment_date,
                $request->shift,
                $request->bed_number
            );

            $app = Appointment::create([
                'patient_id' => $request->patient_id,
                'admin_id' => auth()->id(),
                'appointment_date' => $request->appointment_date,
                'start_time' => $times['start_time'],
                'end_time' => $times['end_time'],
                'shift' => $request->shift,
                'bed_number' => $request->bed_number,
                'status' => Appointment::STATUS_SCHEDULED,
                'approval_status' => 'approved',
                'approved_by' => auth()->id(),
                'emergency_override' => true,
                'qr_token' => $qrToken,
            ]);

            AuditLog::log(
                'EMERGENCY_OVERRIDE_APPOINTMENT',
                "Emergency Override Janji Temu Bed #{$request->bed_number} ({$request->shift}) oleh Admin. Alasan: {$request->emergency_reason}",
                auth()->id()
            );

            return $app;
        });

        return back()->with('success', 'Janji temu Darurat (Emergency Override) berhasil didaftarkan.');
    }
}
