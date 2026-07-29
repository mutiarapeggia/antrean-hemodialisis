<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PatientController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Patient::with('user');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('medical_record_number', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status')) {
            $status = $request->input('status');
            if ($status === 'active') {
                $query->where('is_active', true);
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        $patients = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('Admin/Patients/Index', [
            'patients' => $patients,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Patients/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'phone' => ['required', 'string', 'max:30'],
            'medical_record_number' => ['required', 'string', 'max:50', 'unique:patients'],
            'address' => ['nullable', 'string'],
            'medical_conditions' => ['nullable', 'string'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password'] ?? 'password123'),
                'role' => 'patient',
                'email_verified_at' => now(),
            ]);

            Patient::create([
                'user_id' => $user->id,
                'medical_record_number' => $validated['medical_record_number'],
                'phone' => $validated['phone'],
                'address' => $validated['address'] ?? null,
                'medical_conditions' => $validated['medical_conditions'] ?? null,
                'is_active' => true,
            ]);
        });

        return redirect()->route('admin.patients.index')->with('success', 'Pasien berhasil ditambahkan.');
    }

    public function show(Patient $patient): Response
    {
        $patient->load(['user', 'medications', 'appointments' => function ($q) {
            $q->orderBy('appointment_date', 'desc')->take(5);
        }]);

        return Inertia::render('Admin/Patients/Show', [
            'patient' => $patient,
        ]);
    }

    public function edit(Patient $patient): Response
    {
        $patient->load('user');
        return Inertia::render('Admin/Patients/Edit', [
            'patient' => $patient,
        ]);
    }

    public function update(Request $request, Patient $patient): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($patient->user_id)],
            'phone' => ['required', 'string', 'max:30'],
            'medical_record_number' => ['required', 'string', 'max:50', Rule::unique('patients')->ignore($patient->id)],
            'address' => ['nullable', 'string'],
            'medical_conditions' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
        ]);

        DB::transaction(function () use ($patient, $validated) {
            if ($patient->user) {
                $patient->user->update([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                ]);
            }

            $patient->update([
                'medical_record_number' => $validated['medical_record_number'],
                'phone' => $validated['phone'],
                'address' => $validated['address'] ?? null,
                'medical_conditions' => $validated['medical_conditions'] ?? null,
                'is_active' => $validated['is_active'],
            ]);
        });

        return redirect()->route('admin.patients.index')->with('success', 'Data pasien berhasil diperbarui.');
    }

    public function toggleStatus(Patient $patient): RedirectResponse
    {
        $patient->update(['is_active' => ! $patient->is_active]);
        $statusText = $patient->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', "Status pasien berhasil {$statusText}.");
    }

    public function exportCsv(): StreamedResponse
    {
        $fileName = 'data_pasien_' . date('Y-m-d_H-i-s') . '.csv';
        $patients = Patient::with('user')->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$fileName\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($patients) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['ID', 'No RM', 'Nama Pasien', 'Email', 'No Telepon', 'Alamat', 'Kondisi Medis', 'Status']);

            foreach ($patients as $p) {
                fputcsv($file, [
                    $p->id,
                    $p->medical_record_number,
                    $p->user?->name ?? 'N/A',
                    $p->user?->email ?? 'N/A',
                    $p->phone,
                    $p->address,
                    $p->medical_conditions,
                    $p->is_active ? 'Aktif' : 'Nonaktif',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function importCsv(Request $request): RedirectResponse
    {
        $request->validate([
            'csv_file' => ['required', 'file', 'mimes:csv,txt', 'max:2048'],
        ]);

        $file = $request->file('csv_file');
        $handle = fopen($file->getRealPath(), 'r');
        $header = fgetcsv($handle);

        $imported = 0;
        DB::transaction(function () use ($handle, &$imported) {
            while (($row = fgetcsv($handle)) !== false) {
                if (count($row) < 4) continue;

                $rm = trim($row[0]);
                $name = trim($row[1]);
                $email = trim($row[2]);
                $phone = trim($row[3]);
                $address = isset($row[4]) ? trim($row[4]) : null;
                $conditions = isset($row[5]) ? trim($row[5]) : null;

                if (empty($email) || User::where('email', $email)->exists()) continue;
                if (empty($rm) || Patient::where('medical_record_number', $rm)->exists()) continue;

                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => Hash::make('password123'),
                    'role' => 'patient',
                    'email_verified_at' => now(),
                ]);

                Patient::create([
                    'user_id' => $user->id,
                    'medical_record_number' => $rm,
                    'phone' => $phone,
                    'address' => $address,
                    'medical_conditions' => $conditions,
                    'is_active' => true,
                ]);

                $imported++;
            }
        });

        fclose($handle);

        return back()->with('success', "Berhasil mengimpor {$imported} data pasien baru.");
    }
}
