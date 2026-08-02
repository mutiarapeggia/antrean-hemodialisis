<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\RescheduleRequest;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class RescheduleRequestController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $patient = $request->user()->patient;

        if (!$patient) {
            return back()->with('error', 'Profil pasien tidak ditemukan.');
        }

        $validated = $request->validate([
            'appointment_id' => 'required|exists:appointments,id',
            'requested_date' => 'required|date|after:today',
            'requested_shift' => 'required|in:pagi,siang',
            'reason' => 'nullable|string|max:500',
        ], [
            'requested_date.after' => 'Pengajuan reschedule hanya berlaku untuk jadwal H-1 (tanggal baru harus setelah hari ini).',
        ]);

        $appointment = Appointment::where('id', $validated['appointment_id'])
            ->where('patient_id', $patient->id)
            ->firstOrFail();

        if ($appointment->status !== Appointment::STATUS_SCHEDULED) {
            return back()->with('error', 'Hanya janji temu berstatus Scheduled yang dapat di-reschedule.');
        }

        $todayStr = now()->format('Y-m-d');
        $appDateStr = Carbon::parse($appointment->appointment_date)->format('Y-m-d');

        if ($appDateStr <= $todayStr) {
            return back()->with('error', 'Reschedule tidak dapat diajukan pada hari H atau tanggal yang sudah lewat (Minimal H-1).');
        }

        // Check if there is already a pending request for this appointment
        $existingPending = RescheduleRequest::where('appointment_id', $appointment->id)
            ->where('status', 'pending')
            ->first();

        if ($existingPending) {
            return back()->with('error', 'Anda sudah memiliki permohonan reschedule yang sedang diproses admin.');
        }

        $reschedule = RescheduleRequest::create([
            'appointment_id' => $appointment->id,
            'patient_id' => $patient->id,
            'requested_date' => $validated['requested_date'],
            'requested_shift' => $validated['requested_shift'],
            'reason' => $validated['reason'] ?? null,
            'status' => 'pending',
        ]);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'RESCHEDULE_REQUESTED',
            'description' => "Patient {$patient->user->name} submitted reschedule request for appointment #{$appointment->id} to {$validated['requested_date']} ({$validated['requested_shift']}).",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return back()->with('success', 'Permohonan reschedule janji temu Anda telah berhasil dikirimkan dan menunggu review admin.');
    }
}
