<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Patient;
use App\Notifications\AppointmentConfirmationNotification;
use App\Services\QrCodeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $patient = Patient::where('user_id', $user->id)->firstOrFail();

        $appointments = Appointment::with(['latestRescheduleRequest'])
            ->where('patient_id', $patient->id)
            ->orderBy('appointment_date', 'desc')
            ->orderBy('start_time', 'asc')
            ->get()
            ->map(function ($app) use ($patient) {
                $app->qr_svg = QrCodeService::generateSvg($patient->medical_record_number, 180);
                return $app;
            });

        return Inertia::render('Patient/Appointments/Index', [
            'appointments' => $appointments,
            'patient' => $patient,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $patient = Patient::where('user_id', $user->id)->firstOrFail();

        $validated = $request->validate([
            'appointment_date' => 'required|date|after_or_equal:today',
            'shift' => 'required|in:pagi,siang',
            'bed_number' => 'nullable|string',
        ]);

        $date = $validated['appointment_date'];
        $shift = $validated['shift'];
        $bedNumber = $validated['bed_number'] ?? null;

        // Check if patient already has active appointment on date + shift
        $patientConflict = Appointment::where('patient_id', $patient->id)
            ->whereDate('appointment_date', $date)
            ->where('shift', $shift)
            ->where('status', '!=', Appointment::STATUS_CANCELLED)
            ->exists();

        if ($patientConflict) {
            throw ValidationException::withMessages([
                'appointment_date' => 'Anda sudah memiliki janji temu pada tanggal dan shift tersebut.',
            ]);
        }

        // Check bed conflict if bed requested
        if ($bedNumber) {
            $bedConflict = Appointment::whereDate('appointment_date', $date)
                ->where('shift', $shift)
                ->where('bed_number', $bedNumber)
                ->where('status', '!=', Appointment::STATUS_CANCELLED)
                ->exists();

            if ($bedConflict) {
                throw ValidationException::withMessages([
                    'bed_number' => "Slot Bed {$bedNumber} pada shift ini telah terisi. Silakan pilih bed lain.",
                ]);
            }
        }

        $shiftTimes = Appointment::getShiftTimes($shift);
        $qrToken = Appointment::generateHmacQrToken($patient->id, $date, $shift, $bedNumber);

        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'admin_id' => null,
            'appointment_date' => $date,
            'start_time' => $shiftTimes['start_time'],
            'end_time' => $shiftTimes['end_time'],
            'shift' => $shift,
            'bed_number' => $bedNumber,
            'status' => 'pending_approval',
            'approval_status' => 'pending_approval',
            'qr_token' => $qrToken,
            'is_recurring' => false,
            'emergency_override' => false,
        ]);

        try {
            $user->notify(new AppointmentConfirmationNotification($appointment));
        } catch (\Exception $e) {
            // Ignore email errors during local dev/tests
        }

        return back()->with('success', 'Pendaftaran janji temu Anda berhasil dilakukan!');
    }

    public function cancel(Request $request, Appointment $appointment): RedirectResponse
    {
        $user = $request->user();
        $patient = Patient::where('user_id', $user->id)->firstOrFail();

        if ($appointment->patient_id !== $patient->id) {
            abort(403, 'Akses tidak diizinkan.');
        }

        $validated = $request->validate([
            'cancellation_reason' => 'required|string|max:500',
        ]);

        $appointment->update([
            'status' => Appointment::STATUS_CANCELLED,
            'cancellation_reason' => $validated['cancellation_reason'],
        ]);

        return back()->with('success', 'Janji temu berhasil dibatalkan.');
    }
}
