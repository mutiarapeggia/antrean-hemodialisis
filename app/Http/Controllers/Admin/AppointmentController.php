<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Bed;
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

        // Get Dynamic Shift Grid Data from master_beds table
        $shiftGrid = $this->buildShiftGrid($selectedDate, $selectedShift, $selectedStatus, $search);

        $patients = Patient::with('user')
            ->where('is_active', true)
            ->orderBy('medical_record_number')
            ->get();

        $totalBedsCount = Bed::count();

        $stats = [
            'total_today' => Appointment::whereDate('appointment_date', $selectedDate)->where('status', '!=', Appointment::STATUS_CANCELLED)->count(),
            'pagi_count' => Appointment::whereDate('appointment_date', $selectedDate)->where('shift', 'pagi')->where('status', '!=', Appointment::STATUS_CANCELLED)->count(),
            'siang_count' => Appointment::whereDate('appointment_date', $selectedDate)->where('shift', 'siang')->where('status', '!=', Appointment::STATUS_CANCELLED)->count(),
            'cancelled_count' => Appointment::whereDate('appointment_date', $selectedDate)->where('status', Appointment::STATUS_CANCELLED)->count(),
            'total_beds' => $totalBedsCount > 0 ? $totalBedsCount : 12,
        ];

        $availableBeds = Bed::all()->sortBy(fn($b) => (int) preg_replace('/\D/', '', $b->bed_number))->values();

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

        $adminId = auth()->id() ?? $request->user()->id;
        $isEmergency = !empty($validated['emergency_override']);
        $isRecurring = !empty($validated['is_recurring']);
        $weeks = $isRecurring ? ($validated['recurring_weeks'] ?? 4) : 1;

        $startDate = Carbon::parse($validated['appointment_date']);
        $shiftTimes = Appointment::getShiftTimes($validated['shift']);
        $bedNumber = !empty($validated['bed_number']) ? trim(str_replace('Bed ', '', $validated['bed_number'])) : null;

        $createdAppointments = [];
        $conflicts = [];

        for ($i = 0; $i < $weeks; $i++) {
            $currentDate = $startDate->copy()->addWeeks($i)->format('Y-m-d');

            if (!$isEmergency) {
                // Check if patient already has an appointment on this date & shift
                $patientConflict = Appointment::where('patient_id', $validated['patient_id'])
                    ->whereDate('appointment_date', $currentDate)
                    ->where('shift', $validated['shift'])
                    ->where('status', '!=', Appointment::STATUS_CANCELLED)
                    ->exists();

                if ($patientConflict) {
                    $conflicts[] = "Pasien sudah memiliki janji temu pada tanggal {$currentDate} shift {$validated['shift']}.";
                    continue;
                }

                // Check if target bed is unusable or occupied
                if ($bedNumber) {
                    $masterBed = Bed::where('bed_number', $bedNumber)
                        ->orWhere('bed_number', "Bed {$bedNumber}")
                        ->first();

                    if ($masterBed && in_array($masterBed->status, [Bed::STATUS_MAINTENANCE, Bed::STATUS_DAMAGED, 'rusak', 'maintenance'])) {
                        $conflicts[] = "Bed {$bedNumber} sedang dalam status " . strtoupper($masterBed->status) . " (tidak dapat digunakan).";
                        continue;
                    }

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

            // Dispatch notification asynchronously
            $patient = Patient::with('user')->find($validated['patient_id']);
            if ($patient && $patient->user) {
                $appToNotify = $appointment->fresh();
                dispatch(function () use ($patient, $appToNotify, $isEmergency) {
                    try {
                        if ($isEmergency) {
                            $patient->user->notify(new \App\Notifications\EmergencyOverrideNotification($appToNotify));
                        } else {
                            $patient->user->notify(new AppointmentConfirmationNotification($appToNotify));
                        }
                    } catch (\Exception $e) {
                        \Illuminate\Support\Facades\Log::warning('[ASYNC NOTIF WARN] Appointment confirmation notify failed: ' . $e->getMessage());
                    }
                })->afterResponse();
            }
        }

        if (empty($createdAppointments) && !empty($conflicts)) {
            throw ValidationException::withMessages([
                'appointment_date' => implode(' ', $conflicts),
            ]);
        }

        $count = count($createdAppointments);
        $message = "Berhasil membuat {$count} janji temu.";
        if (!empty($conflicts)) {
            $message .= " Beberapa konflik terdeteksi: " . implode(' ', $conflicts);
        }

        return back()->with('success', $message);
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
        $bedNumber = !empty($validated['bed_number']) ? trim(str_replace('Bed ', '', $validated['bed_number'])) : $appointment->bed_number;

        // Check slot conflict if date/shift/bed changed and not emergency
        if (!$isEmergency && $validated['status'] !== Appointment::STATUS_CANCELLED) {
            if ($bedNumber) {
                $masterBed = Bed::where('bed_number', $bedNumber)
                    ->orWhere('bed_number', "Bed {$bedNumber}")
                    ->first();

                if ($masterBed && in_array($masterBed->status, [Bed::STATUS_MAINTENANCE, Bed::STATUS_DAMAGED, 'rusak', 'maintenance'])) {
                    throw ValidationException::withMessages([
                        'bed_number' => "Bed {$bedNumber} sedang dalam status " . strtoupper($masterBed->status) . " (tidak dapat digunakan).",
                    ]);
                }

                $bedConflict = Appointment::where('id', '!=', $appointment->id)
                    ->whereDate('appointment_date', $validated['appointment_date'])
                    ->where('shift', $validated['shift'])
                    ->where('bed_number', $bedNumber)
                    ->where('status', '!=', Appointment::STATUS_CANCELLED)
                    ->exists();

                if ($bedConflict) {
                    throw ValidationException::withMessages([
                        'bed_number' => "Slot Bed {$bedNumber} pada shift dan tanggal ini sudah terisi.",
                    ]);
                }
            }
        }

        $appointment->update([
            'appointment_date' => $validated['appointment_date'],
            'shift' => $validated['shift'],
            'start_time' => $shiftTimes['start_time'],
            'end_time' => $shiftTimes['end_time'],
            'bed_number' => $bedNumber,
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
        // Fetch all master beds dynamically from database sorted by bed number
        $allBeds = Bed::all()->sortBy(fn($b) => (int) preg_replace('/\D/', '', $b->bed_number))->values();

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
            'total_beds' => $allBeds->count(),
        ];

        foreach (['pagi', 'siang'] as $shift) {
            foreach ($allBeds as $bed) {
                $cleanNum = (string) preg_replace('/\D/', '', $bed->bed_number);
                if (empty($cleanNum)) {
                    $cleanNum = (string) $bed->bed_number;
                }

                $app = $appointments->first(function ($a) use ($shift, $cleanNum, $bed) {
                    if ($a->shift !== $shift) return false;
                    $aBedStr = (string) $a->bed_number;
                    $aBedClean = (string) preg_replace('/\D/', '', $aBedStr);
                    return $aBedClean === $cleanNum || $aBedStr === (string)$bed->bed_number || $aBedStr === "Bed {$cleanNum}";
                });

                $operationalStatus = strtolower($bed->status ?? 'available');
                $isUsable = $bed->isUsable();

                $grid[$shift][] = [
                    'bed_number' => $cleanNum,
                    'bed_label' => $bed->label ?? "Bed {$cleanNum}",
                    'operational_status' => $operationalStatus,
                    'master_bed_status' => $operationalStatus,
                    'is_usable' => $isUsable,
                    'is_occupied' => !is_null($app),
                    'appointment' => $app ? [
                        'id' => $app->id,
                        'patient_id' => $app->patient_id,
                        'patient_name' => $app->patient->user->name ?? 'Pasien',
                        'medical_record_number' => $app->patient->medical_record_number ?? '',
                        'status' => $app->status,
                        'emergency_override' => $app->emergency_override,
                        'appointment_date' => $app->appointment_date,
                        'shift' => $app->shift,
                        'bed_number' => $app->bed_number,
                        'cancellation_reason' => $app->cancellation_reason,
                        'patient' => [
                            'medical_record_number' => $app->patient->medical_record_number ?? '',
                            'user' => [
                                'name' => $app->patient->user->name ?? 'Pasien',
                            ],
                        ],
                    ] : null,
                ];
            }
        }

        return $grid;
    }
}
