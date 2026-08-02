<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\CheckIn;
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
            $qrToken = trim($request->input('qr_token', ''));

            if (empty($qrToken)) {
                return response()->json([
                    'status' => 'invalid_token',
                    'message' => 'Kode QR Token Tidak Boleh Kosong',
                ], 400);
            }

            // Arrival time: accept 'simulated_at' or 'check_in_time'
            $simulatedAt = $request->input('simulated_at') ?? $request->input('check_in_time');
            $now = !empty($simulatedAt) ? Carbon::parse($simulatedAt) : now();
            $todayStr = $now->format('Y-m-d');

            // Find appointment by exact qr_token
            $appointment = Appointment::with(['patient.user'])
                ->where('qr_token', $qrToken)
                ->first();

            // Fallback: search candidate appointments for today and match HMAC token
            if (!$appointment) {
                $candidates = Appointment::with(['patient.user'])
                    ->whereDate('appointment_date', $todayStr)
                    ->get();

                foreach ($candidates as $cand) {
                    $expected = Appointment::generateHmacQrToken(
                        $cand->patient_id,
                        $cand->appointment_date->format('Y-m-d'),
                        $cand->shift,
                        $cand->bed_number
                    );

                    if (hash_equals($expected, $qrToken)) {
                        $appointment = $cand;
                        break;
                    }
                }
            }

            if (!$appointment) {
                return response()->json([
                    'status' => 'invalid_token',
                    'message' => 'Kode QR Token Tidak Ditemukan / Tidak Valid',
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
                    'message' => 'Token Kode QR Ini Sudah Pernah Dipakai Check-In!',
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
                    'description' => "Patient Checked In via Kiosk: {$patientName} ({$rm}) at {$now->format('H:i:s')} WIB for Shift {$appointment->shift}.",
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
                'message' => 'Kode QR Token Tidak Ditemukan / Tidak Valid',
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
