<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Patient;
use App\Notifications\AppointmentConfirmationNotification;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    public function index(Request $request): Response
    {
        $selectedDate = $request->input('date', now()->format('Y-m-d'));
        $selectedShift = $request->input('shift');
        $selectedStatus = $request->input('status');
        $search = $request->input('search');

        $query = Appointment::with(['patient.user', 'admin']);

        if ($selectedDate) {
            $query->whereDate('appointment_date', $selectedDate);
        }

        if ($selectedShift) {
            $query->where('shift', $selectedShift);
        }

        if ($selectedStatus) {
            if ($selectedStatus === 'checked-in') {
                $query->whereIn('status', [Appointment::STATUS_CHECKED_IN, 'arrived']);
            } elseif ($selectedStatus === 'in-progress') {
                $query->whereIn('status', [Appointment::STATUS_IN_PROGRESS, 'in_progress']);
            } else {
                $query->where('status', $selectedStatus);
            }
        }

        if ($search) {
            $query->whereHas('patient', function ($q) use ($search) {
                $q->where('medical_record_number', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $appointments = $query->orderBy('start_time', 'asc')->get();

        // Get Shift Grid Data for Bed 1 to Bed 10 according to current filters
        $shiftGrid = $this->buildShiftGrid($selectedDate, $selectedShift, $selectedStatus, $search);

        $patients = Patient::with('user')
            ->where('is_active', true)
            ->orderBy('medical_record_number')
            ->get();

        $stats = [
            'total_today' => Appointment::whereDate('appointment_date', $selectedDate)->where('status', '!=', Appointment::STATUS_CANCELLED)->count(),
            'pagi_count' => Appointment::whereDate('appointment_date', $selectedDate)->where('shift', 'pagi')->where('status', '!=', Appointment::STATUS_CANCELLED)->count(),
            'siang_count' => Appointment::whereDate('appointment_date', $selectedDate)->where('shift', 'siang')->where('status', '!=', Appointment::STATUS_CANCELLED)->count(),
            'cancelled_count' => Appointment::whereDate('appointment_date', $selectedDate)->where('status', Appointment::STATUS_CANCELLED)->count(),
        ];

        $availableBeds = \App\Models\Bed::where('status', \App\Models\Bed::STATUS_AVAILABLE)->get();

        return Inertia::render('Admin/Appointments/Index', [
            'appointments' => $appointments,
            'patients' => $patients,
            'availableBeds' => $availableBeds,
            'shiftGrid' => $shiftGrid,
            'stats' => $stats,
            'filters' => [
                'date' => $selectedDate,
                'shift' => $selectedShift ?? '',
                'status' => $selectedStatus ?? '',
                'search' => $search ?? '',
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'appointment_date' => 'required|date',
            'shift' => 'required|in:pagi,siang',
            'bed_number' => 'nullable|string',
            'is_recurring' => 'nullable|boolean',
            'recurring_weeks' => 'nullable|integer|min:1|max:12',
            'emergency_override' => 'nullable|boolean',
        ]);

        $adminId = $request->user()->id;
        $isEmergency = !empty($validated['emergency_override']);
        $isRecurring = !empty($validated['is_recurring']);
        $recurringWeeks = $validated['recurring_weeks'] ?? 1;

        $startDate = Carbon::parse($validated['appointment_date']);
        $shiftTimes = Appointment::getShiftTimes($validated['shift']);

        $createdAppointments = [];
        $conflicts = [];

        $totalOccurrences = $isRecurring ? $recurringWeeks : 1;

        for ($i = 0; $i < $totalOccurrences; $i++) {
            $currentDate = $startDate->copy()->addWeeks($i)->format('Y-m-d');
            $bedNumber = $validated['bed_number'] ?? null;

            // Check conflict unless emergency override is active
            if (!$isEmergency) {
                // Check if patient has appointment on this date & shift
                $patientConflict = Appointment::where('patient_id', $validated['patient_id'])
                    ->whereDate('appointment_date', $currentDate)
                    ->where('shift', $validated['shift'])
                    ->where('status', '!=', Appointment::STATUS_CANCELLED)
                    ->exists();

                if ($patientConflict) {
                    $conflicts[] = "Pasien sudah memiliki janji temu pada tanggal {$currentDate} shift {$validated['shift']}.";
                    continue;
                }

                // Check if bed is already occupied
                if ($bedNumber) {
                    $bedConflict = Appointment::whereDate('appointment_date', $currentDate)
                        ->where('shift', $validated['shift'])
                        ->where('bed_number', $bedNumber)
                        ->where('status', '!=', Appointment::STATUS_CANCELLED)
                        ->exists();

                    if ($bedConflict) {
                        $conflicts[] = "Slot Bed {$bedNumber} pada tanggal {$currentDate} shift {$validated['shift']} sudah terisi.";
                        continue;
                    }
                }
            }

            if ($isEmergency && $bedNumber) {
                Appointment::relocateRegularPatientIfOccupied(
                    $currentDate,
                    $validated['shift'],
                    $bedNumber
                );
            }

            $qrToken = Appointment::generateHmacQrToken(
                $validated['patient_id'],
                $currentDate,
                $validated['shift'],
                $bedNumber
            );

            $appointment = Appointment::create([
                'patient_id' => $validated['patient_id'],
                'admin_id' => $adminId,
                'appointment_date' => $currentDate,
                'start_time' => $shiftTimes['start_time'],
                'end_time' => $shiftTimes['end_time'],
                'shift' => $validated['shift'],
                'bed_number' => $bedNumber,
                'status' => Appointment::STATUS_SCHEDULED,
                'qr_token' => $qrToken,
                'is_recurring' => $isRecurring,
                'emergency_override' => $isEmergency,
            ]);

            $createdAppointments[] = $appointment;

            // Send notification
            $patient = Patient::with('user')->find($validated['patient_id']);
            if ($patient && $patient->user) {
                try {
                    $patient->user->notify(new AppointmentConfirmationNotification($appointment));
                } catch (\Exception $e) {
                    // Suppress mail error in local test if mailer unconfigured
                }
            }
        }

        if (empty($createdAppointments) && !empty($conflicts)) {
            throw ValidationException::withMessages([
                'appointment_date' => implode(' ', $conflicts),
            ]);
        }

        $msg = count($createdAppointments) . ' janji temu berhasil dibuat.';
        if (!empty($conflicts)) {
            $msg .= ' Beberapa tanggal tidak dapat dipesan karena konflik: ' . implode(' ', $conflicts);
        }

        return back()->with('success', $msg);
    }

    public function update(Request $request, Appointment $appointment): RedirectResponse
    {
        $validated = $request->validate([
            'appointment_date' => 'required|date',
            'shift' => 'required|in:pagi,siang',
            'bed_number' => 'nullable|string',
            'status' => 'required|string',
            'emergency_override' => 'nullable|boolean',
        ]);

        $isEmergency = !empty($validated['emergency_override']);
        $shiftTimes = Appointment::getShiftTimes($validated['shift']);

        // Check slot conflict if date/shift/bed changed and not emergency
        if (!$isEmergency && $validated['status'] !== Appointment::STATUS_CANCELLED) {
            if ($validated['bed_number']) {
                $bedConflict = Appointment::where('id', '!=', $appointment->id)
                    ->whereDate('appointment_date', $validated['appointment_date'])
                    ->where('shift', $validated['shift'])
                    ->where('bed_number', $validated['bed_number'])
                    ->where('status', '!=', Appointment::STATUS_CANCELLED)
                    ->exists();

                if ($bedConflict) {
                    throw ValidationException::withMessages([
                        'bed_number' => "Slot Bed {$validated['bed_number']} pada shift dan tanggal ini sudah terisi.",
                    ]);
                }
            }
        }

        $appointment->update([
            'appointment_date' => $validated['appointment_date'],
            'shift' => $validated['shift'],
            'start_time' => $shiftTimes['start_time'],
            'end_time' => $shiftTimes['end_time'],
            'bed_number' => $validated['bed_number'] ?? $appointment->bed_number,
            'status' => $validated['status'],
            'emergency_override' => $isEmergency,
        ]);

        return back()->with('success', 'Janji temu berhasil diperbarui.');
    }

    public function cancel(Request $request, Appointment $appointment): RedirectResponse
    {
        $validated = $request->validate([
            'cancellation_reason' => 'required|string|max:500',
        ]);

        $appointment->update([
            'status' => Appointment::STATUS_CANCELLED,
            'cancellation_reason' => $validated['cancellation_reason'],
        ]);

        return back()->with('success', 'Janji temu telah dibatalkan.');
    }

    public function destroy(Appointment $appointment): RedirectResponse
    {
        $appointment->delete();
        return back()->with('success', 'Janji temu berhasil dihapus.');
    }

    private function buildShiftGrid(string $date, ?string $selectedShift = null, ?string $selectedStatus = null, ?string $search = null): array
    {
        $beds = range(1, 10);
        $query = Appointment::with(['patient.user'])
            ->whereDate('appointment_date', $date);

        if ($selectedShift) {
            $query->where('shift', $selectedShift);
        }

        if ($selectedStatus) {
            if ($selectedStatus === 'checked-in') {
                $query->whereIn('status', [Appointment::STATUS_CHECKED_IN, 'arrived']);
            } elseif ($selectedStatus === 'in-progress') {
                $query->whereIn('status', [Appointment::STATUS_IN_PROGRESS, 'in_progress']);
            } else {
                $query->where('status', $selectedStatus);
            }
        } else {
            $query->where('status', '!=', Appointment::STATUS_CANCELLED);
        }

        if ($search) {
            $query->whereHas('patient', function ($q) use ($search) {
                $q->where('medical_record_number', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $appointments = $query->orderBy('emergency_override', 'desc')->get();

        $grid = [
            'pagi' => [],
            'siang' => [],
        ];

        foreach (['pagi', 'siang'] as $shift) {
            foreach ($beds as $bedNum) {
                $bedStr = (string)$bedNum;
                $app = $appointments->first(function ($a) use ($shift, $bedStr) {
                    return $a->shift === $shift && ((string)$a->bed_number === $bedStr || $a->bed_number === "Bed {$bedStr}");
                });

                $grid[$shift][] = [
                    'bed_number' => $bedStr,
                    'is_occupied' => !is_null($app),
                    'appointment' => $app ? [
                        'id' => $app->id,
                        'patient_name' => $app->patient->user->name ?? 'Pasien',
                        'medical_record_number' => $app->patient->medical_record_number ?? '',
                        'status' => $app->status,
                        'emergency_override' => $app->emergency_override,
                    ] : null,
                ];
            }
        }

        return $grid;
    }
}
