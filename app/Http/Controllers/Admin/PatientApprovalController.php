<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Patient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PatientApprovalController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->query('status', 'pending');

        $query = Patient::with('user');

        if ($status !== 'all') {
            $query->where('approval_status', $status);
        }

        $patients = $query->latest()->paginate(10)->withQueryString();

        $stats = [
            'pending' => Patient::where('approval_status', 'pending')->count(),
            'approved' => Patient::where('approval_status', 'approved')->count(),
            'rejected' => Patient::where('approval_status', 'rejected')->count(),
        ];

        return Inertia::render('Admin/Patients/Approvals', [
            'patients' => $patients,
            'stats' => $stats,
            'filters' => [
                'status' => $status,
            ],
        ]);
    }

    public function approve(Patient $patient): RedirectResponse
    {
        $patient->update([
            'approval_status' => 'approved',
            'is_active' => true,
        ]);

        AuditLog::log(
            'PATIENT_REGISTRATION_APPROVED',
            "Pendaftaran pasien {$patient->user->name} (RM: {$patient->medical_record_number}) disetujui oleh admin.",
            auth()->id()
        );

        return back()->with('success', "Pendaftaran pasien {$patient->user->name} berhasil disetujui.");
    }

    public function reject(Request $request, Patient $patient): RedirectResponse
    {
        $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $patient->update([
            'approval_status' => 'rejected',
            'rejection_reason' => $request->rejection_reason,
            'is_active' => false,
        ]);

        AuditLog::log(
            'PATIENT_REGISTRATION_REJECTED',
            "Pendaftaran pasien {$patient->user->name} ditolak. Alasan: {$request->rejection_reason}",
            auth()->id()
        );

        return back()->with('success', "Pendaftaran pasien {$patient->user->name} ditolak.");
    }
}
