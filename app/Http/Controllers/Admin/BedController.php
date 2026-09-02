<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Bed;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BedController extends Controller
{
    public function index(): Response
    {
        $beds = Bed::all()->sortBy(fn($b) => (int) preg_replace('/\D/', '', $b->bed_number))->values();

        return Inertia::render('Admin/Beds/Index', [
            'beds' => $beds,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'bed_number' => 'required|string|max:50|unique:beds,bed_number',
            'label' => 'required|string|max:255',
            'status' => 'required|in:available,occupied,maintenance,damaged',
            'notes' => 'nullable|string',
        ]);

        Bed::create($validated);

        return redirect()->back()->with('success', 'Master Bed berhasil ditambahkan.');
    }

    public function update(Request $request, Bed $bed): RedirectResponse
    {
        $validated = $request->validate([
            'bed_number' => 'required|string|max:50|unique:beds,bed_number,' . $bed->id,
            'label' => 'required|string|max:255',
            'status' => 'required|in:available,occupied,maintenance,damaged',
            'notes' => 'nullable|string',
        ]);

        $oldStatus = strtolower($bed->status ?? 'available');
        $newStatus = strtolower($validated['status']);

        $bed->update($validated);

        $relocationResult = null;
        if (in_array($newStatus, ['damaged', 'maintenance', 'rusak'], true) && !in_array($oldStatus, ['damaged', 'maintenance', 'rusak'], true)) {
            $relocationResult = \App\Models\Appointment::relocateAppointmentsFromBed($bed->bed_number);
        }

        $message = 'Data Bed berhasil diperbarui.';
        if ($relocationResult) {
            $relocated = $relocationResult['relocated_count'];
            $unassigned = $relocationResult['unassigned_count'];

            if ($relocated > 0) {
                $message .= " {$relocated} pasien otomatis dipindahkan ke bed pengganti yang tersedia.";
            }

            if ($unassigned > 0) {
                $statusLabel = $newStatus === 'damaged' ? 'RUSAK' : 'MAINTENANCE';
                return redirect()->back()->with('warning', "Status bed berhasil diperbarui ke {$statusLabel}, tetapi ada {$unassigned} pasien yang tidak mendapatkan bed pengganti otomatis karena kapasitas penuh.");
            }
        }

        return redirect()->back()->with('success', $message);
    }

    public function destroy(Bed $bed): RedirectResponse
    {
        $bed->delete();

        return redirect()->back()->with('success', 'Master Bed berhasil dihapus.');
    }
}
