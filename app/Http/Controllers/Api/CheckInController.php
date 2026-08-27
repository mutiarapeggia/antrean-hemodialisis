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
            // Read raw input payload (RM number or QR token or JSON payload)
            $rawInput = trim(
                (string) ($request->input('rm_number') ?? 
                $request->input('medical_record_number') ?? 
                $request->input('qr_token', ''))
            );

            if (empty($rawInput)) {
                return response()->json([
                    'status' => 'not_found',
                    'message' => 'QR Code tidak valid atau tidak dikenali',
                ], 400);
            }

            // Arrival time: accept 'simulated_at' or 'check_in_time' or default to now() in Asia/Jakarta timezone
            $simulatedAt = $request->input('simulated_at') ?? $request->input('check_in_time');
            $now = !empty($simulatedAt) 
                ? Carbon::parse($simulatedAt)->setTimezone('Asia/Jakarta') 
                : now()->setTimezone('Asia/Jakarta');
            $todayStr = $now->format('Y-m-d');
            $arrivalHourMin = $now->format('H:i');

            // Determine arrival shift window:
            // Shift 1 (Pagi): 07:00 - 11:00 WIB (Check-in opens 06:30 WIB)
            // Shift 2 (Siang): 12:00 - 16:00 WIB (Check-in opens 11:30 WIB)
            $arrivalShift = ($arrivalHourMin >= '11:30') ? 'siang' : 'pagi';

            // =========================================================================
            // LANGKAH A: DECODE & VERIFIKASI TOKEN / DATA JANJI TEMU
            // =========================================================================
            $appointmentIdFromQr = null;
            $qrTokenFromQr = null;

            // Attempt to parse structured JSON payload e.g. {"appointment_id": 123, "qr_token": "..."}
            if (str_starts_with($rawInput, '{') && str_ends_with($rawInput, '}')) {
                $decoded = json_decode($rawInput, true);
                if (is_array($decoded)) {
                    $appointmentIdFromQr = $decoded['appointment_id'] ?? null;
                    $qrTokenFromQr = $decoded['qr_token'] ?? null;
                    if (empty($rawInput) && !empty($decoded['medical_record_number'])) {
                        $rawInput = $decoded['medical_record_number'];
                    }
                }
            }

            $appByToken = null;
            if ($appointmentIdFromQr && $qrTokenFromQr) {
                $appByToken = Appointment::with(['patient.user', 'rescheduleRequests'])
                    ->where('id', $appointmentIdFromQr)
                    ->where('qr_token', $qrTokenFromQr)
                    ->first();
            } elseif (!empty($rawInput)) {
                $appByToken = Appointment::with(['patient.user', 'rescheduleRequests'])
                    ->where('qr_token', $rawInput)
                    ->first();
            }

            // Search Patient by Medical Record Number candidates
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

            if (!$patient && $appByToken) {
                $patient = $appByToken->patient;
            }

            // Reject if neither QR token nor patient match exists
            if (!$appByToken && !$patient) {
                return response()->json([
                    'status' => 'not_found',
                    'message' => 'QR Code tidak valid atau tidak dikenali',
                ], 404);
            }

            // =========================================================================
            // LANGKAH B: VALIDASI STATUS RESCHEDULE PENDING
            // =========================================================================
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

            // =========================================================================
            // LANGKAH C: QUERY JANJI TEMU HARI INI (TODAY'S APPOINTMENTS)
            // =========================================================================
            $todayAppointments = Appointment::with(['patient.user'])
                ->where(function ($query) use ($patient, $appByToken) {
                    if ($appByToken) {
                        $query->where('id', $appByToken->id);
                    } elseif ($patient) {
                        $query->where('patient_id', $patient->id);
                    }
                })
                ->whereDate('appointment_date', $todayStr)
                ->where('status', '!=', Appointment::STATUS_CANCELLED)
                ->lockForUpdate()
                ->get();

            // =========================================================================
            // LANGKAH D: JIKA TIDAK ADA JANJI TEMU HARI INI -> CEK MASA DEPAN / LALU / NOT FOUND
            // =========================================================================
            if ($todayAppointments->isEmpty()) {
                $otherApp = $appByToken;
                if (!$otherApp && $patient) {
                    $otherApp = Appointment::where('patient_id', $patient->id)
                        ->where('status', '!=', Appointment::STATUS_CANCELLED)
                        ->orderBy('appointment_date', 'desc')
                        ->first();
                }

                if ($otherApp) {
                    $appDateStr = $otherApp->appointment_date->format('Y-m-d');
                    $formattedAppDate = $otherApp->appointment_date->format('d-m-Y');

                    // Case 1: Future Date (> today)
                    if ($appDateStr > $todayStr) {
                        return response()->json([
                            'status' => 'future_ticket',
                            'message' => "Belum waktunya: Janji temu Anda terdaftar untuk tanggal {$formattedAppDate}.",
                            'patient_name' => $otherApp->patient->user->name ?? 'Pasien',
                            'medical_record_number' => $otherApp->patient->medical_record_number ?? '-',
                        ], 400);
                    }

                    // Case 2: Past Date (< today)
                    if ($appDateStr < $todayStr) {
                        return response()->json([
                            'status' => 'expired_ticket',
                            'message' => "Tiket kedaluwarsa: Janji temu ini untuk tanggal {$formattedAppDate} yang sudah lewat.",
                            'patient_name' => $otherApp->patient->user->name ?? 'Pasien',
                            'medical_record_number' => $otherApp->patient->medical_record_number ?? '-',
                        ], 400);
                    }
                }

                return response()->json([
                    'status' => 'not_found',
                    'message' => 'Tidak ditemukan janji temu terdaftar untuk No. RM ini.',
                ], 404);
            }

            // =========================================================================
            // LANGKAH E: ADA JANJI TEMU HARI INI -> DETEKSI SUDAH CHECK-IN & SINKRONISASI
            // =========================================================================
            $checkedInApp = $todayAppointments->first(function ($a) {
                return in_array($a->status, [
                    Appointment::STATUS_CHECKED_IN, 
                    'arrived', 
                    'in_progress', 
                    'in-progress', 
                    Appointment::STATUS_COMPLETED
                ]);
            });

            // Select active scheduled appointment matching the arrival shift
            $appointment = $todayAppointments->first(function ($a) use ($arrivalShift) {
                return $a->status === Appointment::STATUS_SCHEDULED && $a->shift === $arrivalShift;
            });

            if (!$appointment) {
                $appointment = $todayAppointments->firstWhere('status', Appointment::STATUS_SCHEDULED);
            }

            // If no active scheduled appointment remains, but patient already checked in today -> Return ALREADY CHECKED IN
            if (!$appointment && $checkedInApp) {
                $patientUser = $checkedInApp->patient->user ?? null;
                $patientName = $patientUser ? $patientUser->name : 'Pasien';
                $rm = $checkedInApp->patient->medical_record_number ?? '-';
                $bedStr = $checkedInApp->bed_number ? (str_starts_with($checkedInApp->bed_number, 'Bed') ? $checkedInApp->bed_number : "Bed {$checkedInApp->bed_number}") : 'Bed Utama';

                return response()->json([
                    'status' => 'already_checked_in',
                    'message' => "Anda sudah berhasil melakukan check-in untuk hari ini di {$bedStr}.",
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

            if (!$appointment) {
                $appointment = $todayAppointments->first();
            }

            $patientUser = $appointment->patient->user ?? null;
            $userId = $patientUser ? $patientUser->id : null;
            $patientName = $patientUser ? $patientUser->name : 'Pasien';
            $rm = $appointment->patient->medical_record_number ?? '-';
            $bedStr = $appointment->bed_number ? (str_starts_with($appointment->bed_number, 'Bed') ? $appointment->bed_number : "Bed {$appointment->bed_number}") : 'Bed Utama';

            // Check duplicate check-in if selected appointment is already checked in
            if (in_array($appointment->status, [Appointment::STATUS_CHECKED_IN, 'arrived', 'in_progress', 'in-progress', Appointment::STATUS_COMPLETED])) {
                return response()->json([
                    'status' => 'already_checked_in',
                    'message' => "Anda sudah berhasil melakukan check-in untuk hari ini di {$bedStr}.",
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

            // Check Shift Mismatch
            if ($appointment->status === Appointment::STATUS_SCHEDULED && $appointment->shift !== $arrivalShift) {
                if ($appointment->shift === 'siang') {
                    $mismatchMsg = 'Jadwal Anda berada di Shift 2 (12.00 - 16.00 WIB). Silakan check-in saat Shift 2 dibuka.';
                } else {
                    $mismatchMsg = 'Jadwal Anda berada di Shift 1 (07.00 - 11.00 WIB).';
                }

                return response()->json([
                    'status' => 'shift_mismatch',
                    'message' => $mismatchMsg,
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

            // Shift 1 (Pagi): 07:00:00 - 11:00:00 (On-Time cutoff 07:15:00)
            // Shift 2 (Siang): 12:00:00 - 16:00:00 (On-Time cutoff 12:15:00)
            $appDateStr = $appointment->appointment_date->format('Y-m-d');
            $shiftStartTimeStr = ($appointment->shift === 'pagi') ? '07:00:00' : '12:00:00';
            $shiftEndTimeStr = ($appointment->shift === 'pagi') ? '11:00:00' : '16:00:00';

            $shiftStart = Carbon::parse("{$appDateStr} {$shiftStartTimeStr}", 'Asia/Jakarta');
            $onTimeCutoff = $shiftStart->copy()->addMinutes(15);
            $shiftEnd = Carbon::parse("{$appDateStr} {$shiftEndTimeStr}", 'Asia/Jakarta');

            // 1. If scan is AFTER shift end time (> 11:00 or > 16:00) -> Reject HTTP 422
            if ($now->gt($shiftEnd)) {
                if (in_array($appointment->status, [Appointment::STATUS_SCHEDULED, 'approved', 'pending_approval'])) {
                    $appointment->update([
                        'status' => Appointment::STATUS_NO_SHOW,
                    ]);
                }

                $shiftNumStr = ($appointment->shift === 'pagi') ? '1 (Pagi)' : '2 (Siang)';
                $shiftTimeRangeStr = ($appointment->shift === 'pagi') ? '07.00 - 11.00' : '12.00 - 16.00';
                return response()->json([
                    'status' => 'shift_ended',
                    'message' => "Check-In Ditolak: Jam operasional Shift {$shiftNumStr} ({$shiftTimeRangeStr} WIB) telah berakhir pada jam {$shiftEnd->format('H:i')} WIB. Silakan hubungi petugas medis.",
                    'patient_name' => $patientName,
                    'medical_record_number' => $rm,
                    'shift' => ucfirst($appointment->shift),
                    'data' => [
                        'patient_name' => $patientName,
                        'rm_number' => $rm,
                        'shift' => ucfirst($appointment->shift),
                        'shift_ended' => true,
                    ],
                ], 422);
            }

            // 2. Scan is DURING active shift duration (<= 11:00 or <= 16:00) -> CHECK-IN SUCCESS!
            $isLate = $now->gt($onTimeCutoff);
            $checkInStatus = $isLate ? 'late' : 'on-time';
            $successMsg = $isLate ? 'Check-In Berhasil! (Check-in Terlambat)' : 'Check-In Berhasil!';

            \Illuminate\Support\Facades\DB::transaction(function () use ($appointment, $now, $checkInStatus, $userId, $rm, $patientName, $isLate, $request) {
                $appointment->update([
                    'status' => Appointment::STATUS_CHECKED_IN,
                ]);

                CheckIn::create([
                    'appointment_id' => $appointment->id,
                    'check_in_time' => $now,
                    'status' => $checkInStatus,
                    'source' => 'kiosk',
                ]);

                AuditLog::create([
                    'user_id' => $userId,
                    'action' => 'CHECK_IN_SUCCESS',
                    'description' => "Patient Checked In via Kiosk (RM: {$rm}): {$patientName} at {$now->format('H:i:s')} WIB for Shift {$appointment->shift} (" . ($isLate ? 'Late' : 'On-Time') . ").",
                    'ip_address' => $request->ip(),
                    'created_at' => $now,
                ]);
            });

            if ($patientUser) {
                dispatch(function () use ($patientUser, $appointment) {
                    try {
                        $patientUser->notify(new \App\Notifications\CheckInSuccessNotification($appointment));
                    } catch (Throwable $e) {
                        // Suppress background notification exception
                    }
                })->afterResponse();
            }

            return response()->json([
                'status' => 'success',
                'is_late' => $isLate,
                'message' => $successMsg,
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
                    'is_late' => $isLate,
                ],
            ], 200);
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
