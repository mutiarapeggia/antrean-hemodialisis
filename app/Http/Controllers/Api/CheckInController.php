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

            $appointment = null;

            // 1. Search by Patient Medical Record Number (No. RM) or normalized candidates
            $cleanRmCandidates = [$rawInput];

            // Extract RM-XXXX pattern via regex
            if (preg_match('/(RM-?\d+(?:-\d+)?)/i', $rawInput, $matches)) {
                $matched = strtoupper($matches[1]);
                if (!str_contains($matched, 'RM-')) {
                    $matched = str_replace('RM', 'RM-', $matched);
                }
                $cleanRmCandidates[] = $matched;
            }

            // If digits only e.g. "9901" -> "RM-9901"
            if (preg_match('/^(\d+)$/', $rawInput, $matches)) {
                $cleanRmCandidates[] = 'RM-' . $matches[1];
                $cleanRmCandidates[] = 'RM' . $matches[1];
            }

            // If "RM9901" -> "RM-9901"
            if (preg_match('/^RM(\d+)$/i', $rawInput, $matches)) {
                $cleanRmCandidates[] = 'RM-' . $matches[1];
            }

            $cleanRmCandidates = array_values(array_unique($cleanRmCandidates));

            $patient = Patient::whereIn('medical_record_number', $cleanRmCandidates)
                ->orWhere(function ($query) use ($rawInput) {
                    $query->where('medical_record_number', 'LIKE', '%' . $rawInput . '%');
                })
                ->first();

            if ($patient) {
                $appointment = Appointment::with(['patient.user'])
                    ->where('patient_id', $patient->id)
                    ->whereDate('appointment_date', $todayStr)
                    ->whereIn('status', [
                        Appointment::STATUS_SCHEDULED,
                        Appointment::STATUS_CHECKED_IN,
                        Appointment::STATUS_COMPLETED,
                    ])
                    ->lockForUpdate()
                    ->first();
            }

            // 2. Fallback: Search by exact qr_token with pessimistic locking
            if (!$appointment) {
                $appointment = Appointment::with(['patient.user'])
                    ->where('qr_token', $rawInput)
                    ->lockForUpdate()
                    ->first();
            }

            if (!$appointment) {
                return response()->json([
                    'status' => 'not_found',
                    'message' => 'Tidak ada janji temu terdaftar untuk No. RM ini pada hari ini.',
                ], 404);
            }

            $appDateStr = $appointment->appointment_date->format('Y-m-d');

            // Check if appointment is for today
            if ($appDateStr !== $todayStr) {
                return response()->json([
                    'status' => 'invalid_token',
                    'message' => "Janji temu ini dijadwalkan untuk tanggal {$appDateStr}, bukan hari ini ({$todayStr}).",
                ], 422);
            }

            $patientUser = $appointment->patient->user ?? null;
            $userId = $patientUser ? $patientUser->id : null;
            $patientName = $patientUser ? $patientUser->name : 'Pasien';
            $rm = $appointment->patient->medical_record_number ?? '-';
            $bedStr = $appointment->bed_number ? (str_starts_with($appointment->bed_number, 'Bed') ? $appointment->bed_number : "Bed {$appointment->bed_number}") : 'Bed Utama';

            // Check duplicate check-in
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

            // Check 15-Minute Tolerance Rule
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
