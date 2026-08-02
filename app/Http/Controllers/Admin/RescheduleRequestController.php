<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\RescheduleRequest;
use App\Notifications\RescheduleResultNotification;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Throwable;

class RescheduleRequestController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $status = $request->input('status');

        $query = RescheduleRequest::with([
            'appointment',
            'patient.user',
        ])->latest();

        if (!empty($status)) {
            $query->where('status', $status);
        }

        $rescheduleRequests = $query->paginate(15)->withQueryString();

        $stats = [
            'total' => RescheduleRequest::count(),
            'pending' => RescheduleRequest::where('status', 'pending')->count(),
            'approved' => RescheduleRequest::where('status', 'approved')->count(),
            'rejected' => RescheduleRequest::where('status', 'rejected')->count(),
        ];

        return Inertia::render('Admin/RescheduleRequests/Index', [
            'rescheduleRequests' => $rescheduleRequests,
            'stats' => $stats,
            'filters' => [
                'status' => $status ?? '',
            ],
        ]);
    }

    public function approve(Request $request, RescheduleRequest $rescheduleRequest): RedirectResponse
    {
        if ($rescheduleRequest->status !== 'pending') {
            return back()->with('error', 'Permohonan reschedule ini telah diproses sebelumnya.');
        }

        $validated = $request->validate([
            'bed_number' => 'required|string',
            'admin_notes' => 'nullable|string|max:500',
        ]);

        $requestedDateStr = Carbon::parse($rescheduleRequest->requested_date)->format('Y-m-d');
        $requestedShift = $rescheduleRequest->requested_shift;
        $bedNumber = trim($validated['bed_number']);

        // Check for Slot Conflict (Double Booking)
        $conflictingAppointment = Appointment::whereDate('appointment_date', $requestedDateStr)
            ->where('shift', $requestedShift)
            ->where('bed_number', $bedNumber)
            ->whereIn('status', [
                Appointment::STATUS_SCHEDULED,
                Appointment::STATUS_CHECKED_IN,
                Appointment::STATUS_IN_PROGRESS,
            ])
            ->where('id', '!=', $rescheduleRequest->appointment_id)
            ->first();

        if ($conflictingAppointment) {
            return back()->with('error', "Gagal! Bed {$bedNumber} sudah terisi untuk Shift " . ucfirst($requestedShift) . " pada tanggal {$requestedDateStr}. Silakan pilih bed lain.");
        }

        // Update Reschedule Request
        $rescheduleRequest->update([
            'status' => 'approved',
            'admin_notes' => $validated['admin_notes'] ?? null,
        ]);

        // Update Appointment with New Date, Shift, Bed & New HMAC QR Token
        $appointment = $rescheduleRequest->appointment;
        $newHmacToken = Appointment::generateHmacQrToken(
            $appointment->patient_id,
            $requestedDateStr,
            $requestedShift,
            $bedNumber
        );

        $appointment->update([
            'appointment_date' => $requestedDateStr,
            'shift' => $requestedShift,
            'bed_number' => $bedNumber,
            'start_time' => $requestedShift === 'pagi' ? '07:00:00' : '12:00:00',
            'end_time' => $requestedShift === 'pagi' ? '11:00:00' : '16:00:00',
            'status' => Appointment::STATUS_SCHEDULED,
            'qr_code_token' => $newHmacToken,
            'qr_token' => $newHmacToken,
        ]);

        // Notify Patient
        if ($rescheduleRequest->patient && $rescheduleRequest->patient->user) {
            try {
                $rescheduleRequest->patient->user->notify(new RescheduleResultNotification($rescheduleRequest));
            } catch (Throwable $e) {
                // Suppress email exception in local test environment
            }
        }

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'RESCHEDULE_APPROVED',
            'description' => "Admin approved reschedule #{$rescheduleRequest->id} for patient {$rescheduleRequest->patient->user->name}. New Date: {$requestedDateStr}, Shift: {$requestedShift}, Bed: {$bedNumber}.",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return back()->with('success', 'Permohonan reschedule disetujui! Slot bed berhasil dialokasikan dan notifikasi telah dikirim ke pasien.');
    }

    public function reject(Request $request, RescheduleRequest $rescheduleRequest): RedirectResponse
    {
        if ($rescheduleRequest->status !== 'pending') {
            return back()->with('error', 'Permohonan reschedule ini telah diproses sebelumnya.');
        }

        $validated = $request->validate([
            'admin_notes' => 'required|string|max:500',
        ], [
            'admin_notes.required' => 'Alasan penolakan wajib diisi untuk menginformasikan pasien.',
        ]);

        $rescheduleRequest->update([
            'status' => 'rejected',
            'admin_notes' => $validated['admin_notes'],
        ]);

        // Notify Patient
        if ($rescheduleRequest->patient && $rescheduleRequest->patient->user) {
            try {
                $rescheduleRequest->patient->user->notify(new RescheduleResultNotification($rescheduleRequest));
            } catch (Throwable $e) {
                // Suppress email exception in local test environment
            }
        }

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'RESCHEDULE_REJECTED',
            'description' => "Admin rejected reschedule #{$rescheduleRequest->id} for patient {$rescheduleRequest->patient->user->name}. Reason: {$validated['admin_notes']}.",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return back()->with('success', 'Permohonan reschedule telah ditolak dan notifikasi telah dikirim ke pasien.');
    }
}
