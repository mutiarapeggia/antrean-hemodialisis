<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\CheckIn;
use App\Models\Patient;
use App\Notifications\NextPatientPromotionNotification;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class CheckInController extends Controller
{
    public function checkIn(Request $request): JsonResponse
    {
        try {
            // Read input RM number or QR token
            $rawInput = trim(
                (string) ($request->input('rm_number') ?? 
                $request->input('medical_record_number') ?? 
                $request->input('qr_token', ''))
            );

            if (empty($rawInput)) {
                return response()->json([
                    'status' => 'not_found',
                    'message' => 'Nomor Rekam Medis (No. RM) Tidak Boleh Kosong',
                ], 400);
            }

            // Arrival time: accept 'simulated_at' or 'check_in_time'
            $simulatedAt = $request->input('simulated_at') ?? $request->input('check_in_time');
            $now = !empty($simulatedAt) ? Carbon::parse($simulatedAt) : now();
            $todayStr = $now->format('Y-m-d');
            $arrivalHour = (int) $now->format('H');
            $arrivalShift = ($arrivalHour < 12) ? 'pagi' : 'siang';

            // 1. Search Patient by Medical Record Number candidates
            $cleanRmCandidates = [$rawInput];

            if (preg_match('/(RM-?\d+(?:-\d+)?)/i', $rawInput, $matches)) {
                $matched = strtoupper($matches[1]);
                if (!str_contains($matched, 'RM-')) {
                    $matched = str_replace('RM', 'RM-', $matched);
                }
                $cleanRmCandidates[] = $matched;
            }

            if (preg_match('/^(\d+)$/', $rawInput, $matches)) {
                $cleanRmCandidates[] = 'RM-' . $matches[1];
                $cleanRmCandidates[] = 'RM' . $matches[1];
            }

            if (preg_match('/^RM(\d+)$/i', $rawInput, $matches)) {
                $cleanRmCandidates[] = 'RM-' . $matches[1];
            }

            $cleanRmCandidates = array_values(array_unique($cleanRmCandidates));

            $patient = Patient::whereIn('medical_record_number', $cleanRmCandidates)
                ->orWhere(function ($query) use ($rawInput) {
                    $query->where('medical_record_number', 'LIKE', '%' . $rawInput . '%');
                })
                ->first();

            // Check if appointment by token or patient has a pending reschedule request
            $appByToken = Appointment::with(['patient.user', 'rescheduleRequests'])
                ->where('qr_token', $rawInput)
                ->first();

            $pendingRescheduleApp = null;
            if ($appByToken && $appByToken->rescheduleRequests->contains('status', 'pending')) {
                $pendingRescheduleApp = $appByToken;
            } elseif ($patient) {
                $pendingRescheduleApp = Appointment::where('patient_id', $patient->id)
                    ->whereHas('rescheduleRequests', function ($q) {
                        $q->where('status', 'pending');
                    })
                    ->first();
            }

            if ($pendingRescheduleApp) {
                $patientUser = $pendingRescheduleApp->patient->user ?? null;
                $patientName = $patientUser ? $patientUser->name : 'Pasien';
                $rm = $pendingRescheduleApp->patient->medical_record_number ?? '-';

                return response()->json([
                    'status' => 'reschedule_pending',
                    'message' => 'Check-in ditolak: Janji temu ini sedang dalam proses permohonan jadwal ulang',
                    'patient_name' => $patientName,
                    'medical_record_number' => $rm,
                    'data' => [
                        'patient_name' => $patientName,
                        'rm_number' => $rm,
                    ],
                ], 400);
            }

            // 2. Fetch all appointments for today (excluding cancelled) with lockForUpdate
            $todayAppointments = Appointment::with(['patient.user'])
                ->where(function ($query) use ($patient, $rawInput) {
                    if ($patient) {
                        $query->where('patient_id', $patient->id);
                    } else {
                        $query->where('qr_token', $rawInput);
                    }
                })
                ->whereDate('appointment_date', $todayStr)
                ->where('status', '!=', Appointment::STATUS_CANCELLED)
                ->lockForUpdate()
                ->get();

            if ($todayAppointments->isEmpty()) {
                return response()->json([
                    'status' => 'not_found',
                    'message' => 'Tidak ada janji temu terdaftar untuk No. RM ini pada hari ini.',
                ], 404);
            }

            // Select scheduled appointment matching the current arrival shift
            $appointment = $todayAppointments->first(function ($a) use ($arrivalShift) {
                return $a->status === Appointment::STATUS_SCHEDULED && $a->shift === $arrivalShift;
            });

            // If no exact shift match, pick any scheduled appointment for today
            if (!$appointment) {
                $appointment = $todayAppointments->firstWhere('status', Appointment::STATUS_SCHEDULED);
            }

            // If all appointments for today are already checked in or completed, prevent double check-in
            if (!$appointment) {
                $checkedInApp = $todayAppointments->first(function ($a) {
                    return in_array($a->status, [Appointment::STATUS_CHECKED_IN, Appointment::STATUS_COMPLETED]);
                });

                if ($checkedInApp) {
                    $patientUser = $checkedInApp->patient->user ?? null;
                    $patientName = $patientUser ? $patientUser->name : 'Pasien';
                    $rm = $checkedInApp->patient->medical_record_number ?? '-';
                    $bedStr = $checkedInApp->bed_number ? (str_starts_with($checkedInApp->bed_number, 'Bed') ? $checkedInApp->bed_number : "Bed {$checkedInApp->bed_number}") : 'Bed Utama';

                    return response()->json([
                        'status' => 'already_checked_in',
                        'message' => 'Pasien Dengan No. RM Ini Sudah Pernah Check-In!',
                        'patient_name' => $patientName,
                        'medical_record_number' => $rm,
                        'bed_number' => $bedStr,
                        'shift' => ucfirst($checkedInApp->shift),
                        'data' => [
                            'patient_name' => $patientName,
                            'rm_number' => $rm,
                            'shift' => ucfirst($checkedInApp->shift),
                            'bed_number' => $bedStr,
                        ],
                    ], 400);
                }

                $appointment = $todayAppointments->first();
            }

            $patientUser = $appointment->patient->user ?? null;
            $userId = $patientUser ? $patientUser->id : null;
            $patientName = $patientUser ? $patientUser->name : 'Pasien';
            $rm = $appointment->patient->medical_record_number ?? '-';
            $bedStr = $appointment->bed_number ? (str_starts_with($appointment->bed_number, 'Bed') ? $appointment->bed_number : "Bed {$appointment->bed_number}") : 'Bed Utama';

            // Check duplicate check-in for this specific appointment
            if ($appointment->status === Appointment::STATUS_CHECKED_IN || $appointment->status === Appointment::STATUS_COMPLETED) {
                return response()->json([
                    'status' => 'already_checked_in',
                    'message' => 'Pasien Dengan No. RM Ini Sudah Pernah Check-In!',
                    'patient_name' => $patientName,
                    'medical_record_number' => $rm,
                    'bed_number' => $bedStr,
                    'shift' => ucfirst($appointment->shift),
                    'data' => [
                        'patient_name' => $patientName,
                        'rm_number' => $rm,
                        'shift' => ucfirst($appointment->shift),
                        'bed_number' => $bedStr,
                    ],
                ], 400);
            }

            // Check Shift Match: If registered shift does not match current arrival shift
            if ($appointment->status === Appointment::STATUS_SCHEDULED && $appointment->shift !== $arrivalShift) {
                return response()->json([
                    'status' => 'shift_mismatch',
                    'message' => 'Jadwal Anda terdaftar pada Shift ' . ucfirst($appointment->shift) . ', silakan check-in pada jam shift yang sesuai.',
                    'patient_name' => $patientName,
                    'medical_record_number' => $rm,
                    'shift' => ucfirst($appointment->shift),
                    'data' => [
                        'patient_name' => $patientName,
                        'rm_number' => $rm,
                        'registered_shift' => ucfirst($appointment->shift),
                    ],
                ], 422);
            }

            // Check 15-Minute Tolerance Rule
            $appDateStr = $appointment->appointment_date->format('Y-m-d');
            $shiftStart = Carbon::parse("{$appDateStr} {$appointment->start_time}");
            $cutoffTime = $shiftStart->copy()->addMinutes(15);

            if ($now->lte($cutoffTime)) {
                // ON-TIME CHECK-IN (<= 15 minutes)
                $appointment->update([
                    'status' => Appointment::STATUS_CHECKED_IN,
                ]);

                CheckIn::create([
                    'appointment_id' => $appointment->id,
                    'check_in_time' => $now,
                    'status' => 'on-time',
                    'source' => 'kiosk',
                ]);

                AuditLog::create([
                    'user_id' => $userId,
                    'action' => 'CHECK_IN_SUCCESS',
                    'description' => "Patient Checked In via Kiosk (RM: {$rm}): {$patientName} at {$now->format('H:i:s')} WIB for Shift {$appointment->shift}.",
                    'ip_address' => $request->ip(),
                    'created_at' => $now,
                ]);

                if ($patientUser) {
                    try {
                        $patientUser->notify(new \App\Notifications\CheckInSuccessNotification($appointment));
                    } catch (Throwable $e) {
                        // Suppress email exception in test/local environment
                    }
                }

                return response()->json([
                    'status' => 'success',
                    'message' => 'Check-In Berhasil!',
                    'patient_name' => $patientName,
                    'medical_record_number' => $rm,
                    'shift' => ucfirst($appointment->shift),
                    'bed_number' => $bedStr,
                    'check_in_time' => $now->format('H:i:s'),
                    'data' => [
                        'patient_name' => $patientName,
                        'rm_number' => $rm,
                        'shift' => ucfirst($appointment->shift),
                        'bed_number' => $bedStr,
                    ],
                ], 200);
            } else {
                // LATE CHECK-IN (> 15 minutes) -> FLAG AS NO-SHOW
                $appointment->update([
                    'status' => Appointment::STATUS_NO_SHOW,
                ]);

                CheckIn::create([
                    'appointment_id' => $appointment->id,
                    'check_in_time' => $now,
                    'status' => 'late',
                    'source' => 'kiosk',
                ]);

                AuditLog::create([
                    'user_id' => $userId,
                    'action' => 'PATIENT_FLAGGED_NO_SHOW',
                    'description' => "Patient Flagged No-Show at Kiosk (Late >15 mins): {$patientName} ({$rm}). Arrival: {$now->format('H:i:s')}, Cutoff: {$cutoffTime->format('H:i:s')}.",
                    'ip_address' => $request->ip(),
                    'created_at' => $now,
                ]);

                // Auto-promote next patient in queue
                $this->promoteNextPatient($appDateStr, $appointment->shift, $appointment->id);

                return response()->json([
                    'status' => 'late_error',
                    'message' => 'Check-In Gagal! Batas Waktu Terlampaui (>15 Menit)',
                    'patient_name' => $patientName,
                    'medical_record_number' => $rm,
                    'shift' => ucfirst($appointment->shift),
                    'arrival_time' => $now->format('H:i:s'),
                    'cutoff_time' => $cutoffTime->format('H:i:s'),
                    'data' => [
                        'patient_name' => $patientName,
                        'rm_number' => $rm,
                        'shift' => ucfirst($appointment->shift),
                        'arrival_time' => $now->format('H:i:s'),
                        'cutoff_time' => $cutoffTime->format('H:i:s'),
                    ],
                ], 422);
            }
        } catch (Throwable $e) {
            return response()->json([
                'status' => 'invalid_token',
                'message' => 'Pemeriksaan Check-In Gagal / Data Tidak Valid',
                'error_detail' => $e->getMessage(),
            ], 400);
        }
    }

    private function promoteNextPatient(string $date, string $shift, int $currentAppointmentId): void
    {
        $nextAppointment = Appointment::with('patient.user')
            ->whereDate('appointment_date', $date)
            ->where('shift', $shift)
            ->where('id', '!=', $currentAppointmentId)
            ->where('status', Appointment::STATUS_SCHEDULED)
            ->orderBy('id', 'asc')
            ->first();

        if ($nextAppointment && $nextAppointment->patient && $nextAppointment->patient->user) {
            try {
                $nextAppointment->patient->user->notify(new NextPatientPromotionNotification($nextAppointment));

                AuditLog::create([
                    'user_id' => $nextAppointment->patient->user->id,
                    'action' => 'PATIENT_PROMOTED_AUTO',
                    'description' => "Next patient promoted automatically via email notification: {$nextAppointment->patient->user->name}",
                    'ip_address' => '127.0.0.1',
                    'created_at' => now(),
                ]);
            } catch (Throwable $e) {
                // Suppress email exceptions in local environment
            }
        }
    }
}
