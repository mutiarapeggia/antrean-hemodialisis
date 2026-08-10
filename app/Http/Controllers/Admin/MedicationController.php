<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\Medication;
use App\Models\Patient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MedicationController extends Controller
{
    public function index(Request $request): Response
    {
        $selectedPatientId = $request->input('patient_id');

        $query = Medication::with(['patient.user']);

        if ($selectedPatientId) {
            $query->where('patient_id', $selectedPatientId);
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('dosage', 'like', "%{$search}%")
                  ->orWhere('frequency', 'like', "%{$search}%")
                  ->orWhereHas('patient.user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $medications = $query->orderBy('created_at', 'desc')->paginate(12)->withQueryString();
        $patients = Patient::with('user')->where('is_active', true)->get();

        return Inertia::render('Admin/Medications/Index', [
            'medications' => $medications,
            'patients' => $patients,
            'filters' => [
                'patient_id' => $selectedPatientId,
                'search' => $request->input('search'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'patient_id' => ['required', 'exists:patients,id'],
            'name' => ['required', 'string', 'max:255'],
            'dosage' => ['required', 'string', 'max:100'],
            'frequency' => ['required', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        $medication = Medication::create($validated);
        $patientName = $medication->patient->user->name ?? 'Pasien';

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'MEDICATION_ADDED',
            'description' => "Obat '{$medication->name}' ({$medication->dosage}) ditambahkan untuk pasien {$patientName}.",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return back()->with('success', 'Obat baru berhasil ditambahkan.');
    }

    public function update(Request $request, Medication $medication): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'dosage' => ['required', 'string', 'max:100'],
            'frequency' => ['required', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        $medication->update($validated);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'MEDICATION_UPDATED',
            'description' => "Resep obat '{$medication->name}' diperbarui.",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return back()->with('success', 'Data obat berhasil diperbarui.');
    }

    public function destroy(Request $request, Medication $medication): RedirectResponse
    {
        $name = $medication->name;
        $medication->delete();

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'MEDICATION_DELETED',
            'description' => "Resep obat '{$name}' dihapus.",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return back()->with('success', 'Data obat berhasil dihapus.');
    }

    /**
     * FR-44: Attach medication to specific appointment
     */
    public function attachToAppointment(Request $request, Appointment $appointment): RedirectResponse
    {
        $validated = $request->validate([
            'medication_id' => ['required', 'exists:medications,id'],
            'dosage_given' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        $appointment->medications()->syncWithoutDetaching([
            $validated['medication_id'] => [
                'dosage_given' => $validated['dosage_given'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]
        ]);

        $medication = Medication::find($validated['medication_id']);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'MEDICATION_ATTACHED_TO_APPOINTMENT',
            'description' => "Obat '{$medication->name}' dikaitkan dengan janji temu pasien {$appointment->patient->user->name} (Tanggal {$appointment->appointment_date->format('Y-m-d')}).",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return back()->with('success', "Obat {$medication->name} berhasil dikaitkan dengan janji temu.");
    }

    /**
     * Detach medication from appointment
     */
    public function detachFromAppointment(Request $request, Appointment $appointment, Medication $medication): RedirectResponse
    {
        $appointment->medications()->detach($medication->id);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'MEDICATION_DETACHED_FROM_APPOINTMENT',
            'description' => "Pengaitan obat '{$medication->name}' dari janji temu dilepas.",
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return back()->with('success', 'Pengaitan obat dari janji temu berhasil dilepas.');
    }
}
